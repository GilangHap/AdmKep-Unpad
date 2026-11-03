import { useEffect, useId, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  FilePlus2,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import { UnpadLogo } from "@/components/ui/Motif";
import { useAuth } from "@/lib/AuthProvider";
import { ROUTES, SITE } from "@/config/site";
import { cn } from "@/lib/cn";

const COLLAPSE_KEY = "kepadm.sidebar-collapsed";
/* Each page gets its own small mark, drawn big and faint on the sidebar ground. */
const HERO_ICON = {
  "/app/dasbor": LayoutDashboard,
  "/app/pengajuan-baru": FilePlus2,
  "/app/pengaturan": Settings,
};

const NAVS = [
  { to: "/app/dasbor", label: "Dasbor", icon: LayoutDashboard, end: true },
  { to: "/app/pengajuan-baru", label: "Pengajuan baru", icon: FilePlus2 },
  { to: "/app/pengaturan", label: "Pengaturan akun", icon: Settings },
];

function NavRow({ to, label, icon: Icon, end = false, collapsed, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      title={label}
      aria-label={label}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center rounded-lg text-[13.5px] font-medium",
          "transition-[background-color,color,box-shadow] duration-200",
          "focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep",
          collapsed ? "h-11 justify-center" : "gap-3 px-3 py-2.5",
          isActive
            ? "bg-primary text-on-primary"
            : "text-white/70 hover:bg-white/10 hover:text-white",
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive ? (
            <span
              className="absolute -left-3 h-5 w-[3px] rounded-r-full bg-primary"
              aria-hidden="true"
            />
          ) : null}
          <Icon
            className={cn(
              "size-[18px] shrink-0 transition-colors duration-200",
              isActive ? "text-on-primary" : "text-white/55 group-hover:text-white",
            )}
            strokeWidth={isActive ? 2.1 : 1.7}
            aria-hidden="true"
          />
          {collapsed ? null : <span className="truncate">{label}</span>}
          {collapsed || !isActive ? null : (
            <ChevronRight className="ml-auto size-3.5 text-on-primary/60" aria-hidden="true" />
          )}
        </>
      )}
    </NavLink>
  );
}

function Nav({ collapsed, onNavigate }) {
  return (
    <nav
      className={cn("sidebar-scroll flex-1 overflow-y-auto px-3", collapsed && "px-2")}
      aria-label="Navigasi utama"
    >
      {!collapsed ? (
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">
          Menu
        </p>
      ) : null}
      <div className={cn("space-y-1", collapsed && "space-y-1.5")}>
        {NAVS.map((item) => (
          <NavRow
            key={item.to}
            to={item.to}
            label={item.label}
            icon={item.icon}
            end={item.end}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </nav>
  );
}

function SidebarContent({ collapsed, onNavigate, user, onLogout }) {
  const { pathname } = useLocation();
  const Hero =
    NAVS.find((item) => (item.end ? pathname === item.to : pathname.startsWith(item.to)))?.icon ??
    LayoutDashboard;

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-brand-deep">
      {collapsed ? null : (
        <Hero
          className="pointer-events-none absolute -bottom-10 -right-12 size-56 text-white/[0.045]"
          strokeWidth={0.9}
          aria-hidden="true"
        />
      )}
      <div className={cn("flex items-center px-4 pb-4 pt-5", collapsed && "justify-center px-0")}>
        <Link
          to="/app/dasbor"
          onClick={onNavigate}
          title="E-KEP Unpad"
          className="flex min-w-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white ring-1 ring-white/15">
            <UnpadLogo size={28} />
          </span>
          <span className={cn("min-w-0 leading-[1.25]", collapsed && "hidden")}>
            <span className="block truncate font-display text-[15px] font-bold tracking-[-0.01em] text-white">
              E-KEP Unpad
            </span>
            <span className="block truncate text-[11.5px] text-white/50">{SITE.committee}</span>
          </span>
        </Link>
      </div>

      <Nav collapsed={collapsed} onNavigate={onNavigate} />

      <div className={cn("p-3", collapsed && "px-2")}>
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-xl bg-white/[0.07] p-2",
            collapsed && "justify-center bg-transparent p-0",
          )}
        >
          <span
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-full bg-primary text-[12.5px] font-bold text-on-primary",
              !collapsed && "ring-2 ring-white/15",
            )}
          >
            {user.initials}
          </span>
          <span className={cn("min-w-0 flex-1 leading-[1.3]", collapsed && "hidden")}>
            <span className="block truncate text-[13px] font-semibold text-white">{user.name}</span>
            <span className="block truncate text-[11.5px] text-white/50">{user.role}</span>
          </span>
          <button
            type="button"
            onClick={onLogout}
            title="Keluar"
            aria-label="Keluar"
            className={cn(
              "shrink-0 cursor-pointer rounded-lg p-1.5 text-white/50 transition-colors duration-200 hover:bg-white/10 hover:text-white",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
              collapsed && "hidden",
            )}
          >
            <LogOut className="size-4" aria-hidden="true" strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const buttonRef = useRef(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Menu akun ${user.name}`}
        className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 transition-colors duration-150 hover:bg-canvas"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-[12px] font-semibold tracking-wide text-white" aria-hidden="true">
          {user.initials}
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block max-w-[11rem] truncate text-[13px] font-semibold text-ink">{user.name}</span>
          <span className="block text-[11.5px] text-ink-faint">{user.role}</span>
        </span>
        <ChevronDown
          className={cn("size-3.5 text-ink-faint transition-transform duration-150", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          id={panelId}
          className="absolute right-0 top-full z-40 mt-2 w-[19rem] overflow-hidden rounded-xl border border-line bg-surface shadow-[0_12px_32px_-12px_rgba(15,23,42,0.18)]" /* taste-skill-ignore: floating account menu, app rules allow shadows on overlays */
        >
          <div className="flex items-start gap-3 border-b border-line px-4 py-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-[13px] font-semibold text-white" aria-hidden="true">
              {user.initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold text-ink">{user.name}</p>
              <p className="truncate text-[12.5px] text-ink-faint">{user.email}</p>
              <p className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-canvas px-1.5 py-0.5 text-[11.5px] text-ink-soft">
                {user.role}
                <span className="text-line" aria-hidden="true">|</span>
                {user.institution || "—"}
              </p>
            </div>
          </div>

          <div className="p-1.5">
            <Link
              to="/app/biodata"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] text-ink-soft transition-colors duration-150 hover:bg-canvas hover:text-ink"
            >
              <UserRound className="size-4 text-ink-faint" aria-hidden="true" />
              Biodata peneliti
            </Link>
            <Link
              to="/app/pengaturan"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] text-ink-soft transition-colors duration-150 hover:bg-canvas hover:text-ink"
            >
              <Settings className="size-4 text-ink-faint" aria-hidden="true" />
              Pengaturan akun
            </Link>
            <a
              href={`mailto:${SITE.supportEmail ?? "kep@unpad.ac.id"}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] text-ink-soft transition-colors duration-150 hover:bg-canvas hover:text-ink"
            >
              <MessageCircle className="size-4 text-ink-faint" aria-hidden="true" />
              Hubungi komite
            </a>
          </div>

          <div className="border-t border-line p-1.5">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13.5px] font-medium text-red transition-colors duration-150 hover:bg-[#fef3f2]"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Keluar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MobileSheet({ open, onClose, user, onLogout }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Menu navigasi"
        tabIndex={-1}
        className="absolute inset-y-0 left-0 flex w-[min(17rem,86vw)] flex-col outline-none"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup menu"
          className="absolute right-3 top-4 z-10 grid size-8 cursor-pointer place-items-center rounded-lg text-white/60 transition-colors duration-150 hover:bg-white/10 hover:text-white"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
        <SidebarContent collapsed={false} onNavigate={onClose} user={user} onLogout={onLogout} />
      </div>
    </div>
  );
}

const pageMeta = (pathname) => ({
  title:
    NAVS.find((item) => (item.end ? pathname === item.to : pathname.startsWith(item.to)))?.label ??
    "Dasbor",
});

export function AppShell({ children }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== "undefined" && window.localStorage.getItem(COLLAPSE_KEY) === "true",
  );
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => setSheetOpen(false), [location.pathname]);

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      window.localStorage.setItem(COLLAPSE_KEY, String(!current));
      return !current;
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.login, { replace: true });
  };

  const meta = pageMeta(location.pathname);

  return (
    <div className="flex h-dvh overflow-hidden bg-canvas">
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-[13px] focus:font-semibold focus:text-white"
      >
        Lompat ke konten
      </a>

      <aside
        className={cn(
          "hidden shrink-0 transition-[width] duration-200 lg:block",
          collapsed ? "w-[4.75rem]" : "w-[15rem]",
        )}
      >
        <div className={cn("fixed inset-y-0 left-0 z-30", collapsed ? "w-[4.75rem]" : "w-[15rem]")}>
          <h1 className="sr-only">{meta.title}</h1>
          <SidebarContent
            collapsed={collapsed}
            user={user}
            onLogout={handleLogout}
          />
        </div>
      </aside>

      <MobileSheet open={sheetOpen} onClose={() => setSheetOpen(false)} user={user} onLogout={handleLogout} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2.5 border-b border-line bg-surface px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-label="Buka menu navigasi"
            aria-expanded={sheetOpen}
            className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg text-ink-soft transition-colors duration-150 hover:bg-canvas hover:text-ink lg:hidden"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Buka sidebar" : "Tutup sidebar"}
            title={collapsed ? "Buka sidebar" : "Tutup sidebar"}
            className="hidden size-9 shrink-0 cursor-pointer place-items-center rounded-lg text-ink-soft transition-colors duration-150 hover:bg-canvas hover:text-ink lg:grid"
          >
            {collapsed ? <PanelLeftOpen className="size-5" aria-hidden="true" /> : <PanelLeftClose className="size-5" aria-hidden="true" />}
          </button>

          <div className="mr-auto min-w-0">
            <div className="flex items-center gap-1.5 text-[12px] text-ink-faint">
              <Link to="/app/dasbor" className="hover:text-ink">
                Dasbor
              </Link>
              {meta.title === "Dasbor" ? null : (
                <>
                  <ChevronRight className="size-3" aria-hidden="true" />
                  <span className="font-medium text-ink">{meta.title}</span>
                </>
              )}
            </div>
          </div>

          <ProfileMenu user={user} onLogout={handleLogout} />
        </header>

        <main id="konten" tabIndex={-1} className="flex-1 overflow-y-auto outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
