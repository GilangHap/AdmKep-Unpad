import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/AuthProvider";

const GENDER = { L: "Laki-laki", P: "Perempuan" };

function initialsOf(name = "", email = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? email)[0];
  return (letters ?? "?").toUpperCase();
}

/* 08xx-xxxx-xxxx / +62 8xx-xxxx-xxxx: first group 3, the rest split in three. */
function formatPhone(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  const rest = digits.startsWith("62") ? digits.slice(2) : digits.replace(/^0/, "");
  if (rest.length < 8) return raw || "-";
  const tail = rest.slice(3);
  const cut = Math.ceil(tail.length / 2);
  return `${digits.startsWith("62") ? "+62 " : "0"}${rest.slice(0, 3)}-${tail.slice(0, cut)}-${tail.slice(cut)}`;
}

function Row({ label, value, mono = false }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3.5">
      <dt className="text-[13px] text-ink-faint">{label}</dt>
      <dd className={`text-right text-[14.5px] font-medium text-ink ${mono ? "tabular-nums" : ""}`}>
        {value || "-"}
      </dd>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = (user?.name ?? "").split(/\s+/)[0] || "Peneliti";
  const initials = user?.initials || initialsOf(user?.name, user?.email);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[760px] px-5 py-8 sm:px-6">
        <h1 className="sr-only">Dasbor</h1>

        <section className="overflow-hidden rounded-xl border border-line bg-surface">
          <div className="flex flex-wrap items-center gap-5 px-6 py-6">
            <span
              className="grid size-16 shrink-0 place-items-center rounded-full bg-brand text-[20px] font-semibold tracking-wide text-white"
              aria-hidden="true"
            >
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] text-ink-faint">Selamat datang kembali</p>
              <p className="mt-0.5 truncate font-display text-[22px] font-semibold leading-tight tracking-[-0.01em] text-ink">
                {user?.name ?? "-"}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-soft">
                <span>{user?.role ?? "-"}</span>
                {user?.institution ? (
                  <>
                    <span className="text-line" aria-hidden="true">|</span>
                    <span className="truncate">{user.institution}</span>
                  </>
                ) : null}
              </p>
            </div>
          </div>

          <dl className="divide-y divide-line border-t border-line px-6">
            <Row label="Nama" value={user?.name} />
            <Row label="Nomor HP" value={formatPhone(user?.phone)} mono />
          </dl>
        </section>

        <p className="mt-4 px-1 text-[12.5px] text-ink-faint">
          Halo, {firstName}. Data ini diambil dari akun Anda.
        </p>
      </div>
    </AppShell>
  );
}
