import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { me, login as apiLogin, logout as apiLogout } from "@/lib/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await me();
        if (alive) setUser(data.user);
      } catch {
        if (alive) setUser(null);
      } finally {
        if (alive) setStatus("ready");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(async (values) => {
    const data = await apiLogin(values);
    setUser(data.user);
    setStatus("ready");
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const updateUser = useCallback((next) => setUser(next), []);

  const value = useMemo(
    () => ({ user, status, login, logout, updateUser }),
    [user, status, login, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}

/** Auth pages only for guests: a signed-in visitor goes straight to the dashboard. */
export function GuestOnly() {
  const { user, status } = useAuth();

  if (status === "loading") return null;
  if (user) return <Navigate to="/app/dasbor" replace />;
  return <Outlet />;
}

/** Blocks the app area until the session is known; sends guests to the login page. */
export function RequireAuth({ children, group = 6 }) {
  const { user, status, logout } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas" role="status" aria-live="polite">
        <span className="flex items-center gap-2.5 text-[13.5px] text-ink-soft">
          <span
            className="size-4 animate-spin rounded-full border-2 border-ink-faint border-t-transparent"
            aria-hidden="true"
          />
          Memuat sesi…
        </span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (Number(user.cGroup) !== group) {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas px-5">
        <section className="w-full max-w-md rounded-xl border border-line bg-surface p-6">
          <h1 className="font-display text-[22px] font-semibold text-ink">Akses khusus anggota</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
            Dasbor ini hanya untuk akun anggota KEP (c_group 6). Akun Anda memiliki peran berbeda.
          </p>
          <button
            type="button"
            onClick={logout}
            className="mt-5 inline-flex h-10 cursor-pointer items-center rounded-full bg-primary px-5 text-[14px] font-semibold text-on-primary hover:bg-primary-deep"
          >
            Keluar
          </button>
        </section>
      </div>
    );
  }

  return children;
}
