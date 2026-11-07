import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Clock, MailCheck, ShieldAlert, XCircle } from "lucide-react";
import { AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Field, Input } from "@/components/ui/FormControl";
import { ROUTES } from "@/config/site";
import { activateAccount, resendActivation } from "@/lib/authApi";

const STATE = {
  loading: "loading",
  ok: "ok",
  invalid: "invalid",
  used: "used",
  expired: "expired",
  error: "error",
};

function Panel({ tone = "neutral", icon: Icon, title, children }) {
  const tones = {
    ok: "bg-[#e8f3ec] text-[#12502f]",
    expired: "bg-[#fdf3dd] text-[#7a5500]",
    bad: "bg-[#fdeceb] text-[#8c1d16]",
    neutral: "bg-brand-soft text-brand",
  };

  return (
    <div>
      <span className={`grid size-12 place-items-center rounded-full ${tones[tone]}`}>
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h2 className="mt-4 font-display text-[19px] font-bold tracking-[-0.02em] text-ink">
        {title}
      </h2>
      <div className="mt-1.5 text-[15px] leading-[1.55] text-ink-soft">{children}</div>
    </div>
  );
}

function ResendForm({ email: initialEmail }) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await resendActivation(email);
      setSent(true);
    } catch (e) {
      setError(e.status === 429 ? e.message : "Gagal mengirim tautan. Coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <Alert tone="success" title="Tautan baru dikirim">
        Periksa kembali kotak masuk {email}. Tautan berlaku 48 jam.
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 text-left">
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Field label="Email terdaftar" htmlFor="resend-email" required>
        {({ describedBy }) => (
          <Input
            id="resend-email"
            type="email"
            autoComplete="email"
            spellCheck={false}
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-describedby={describedBy}
            required
          />
        )}
      </Field>
      <Button type="submit" size="lg" fullWidth loading={busy}>
        Kirim tautan baru
      </Button>
    </form>
  );
}

export default function ActivatePage() {
  const { token } = useParams();
  const [state, setState] = useState(token ? STATE.loading : STATE.invalid);
  const [account, setAccount] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;

    (async () => {
      try {
        const data = await activateAccount(token);
        if (cancelled) return;
        setAccount(data);
        setState(STATE.ok);
      } catch (e) {
        if (cancelled) return;
        setMessage(e.message);
        setAccount({ email: e.email ?? null });
        setState(
          e.reason === "used" ? STATE.used : e.reason === "expired" ? STATE.expired : STATE.invalid,
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const footer = (
    <p className="text-[14px] text-ink-soft">
      Butuh bantuan?{" "}
      <a
        href="mailto:kep@unpad.ac.id"
        className="font-semibold text-gold-deep underline-offset-4 hover:underline"
      >
        Hubungi komite
      </a>
    </p>
  );

  if (state === STATE.loading) {
    return (
      <AuthShell title="Mengaktifkan akun" subtitle="Mohon tunggu sebentar." footer={footer}>
        <div className="flex items-center gap-3 rounded-2xl bg-canvas p-4">
          <span className="size-5 animate-spin rounded-full border-2 border-brand border-t-transparent" aria-hidden="true" />
          <p className="text-[15px] text-ink-soft">Memeriksa tautan aktivasi...</p>
        </div>
      </AuthShell>
    );
  }

  if (state === STATE.ok) {
    return (
      <AuthShell
        title="Akun Anda sudah aktif"
        subtitle="Sekarang Anda bisa masuk dan mulai mengajukan protokol."
        footer={footer}
      >
        <Panel
          tone="ok"
          icon={CheckCircle2}
          title={`Selamat, ${account?.name ?? "akun Anda"} sudah aktif`}
        >
          <p>Gunakan email dan kata sandi yang Anda daftarkan untuk masuk.</p>
          <dl className="mt-4 rounded-xl bg-canvas px-4 py-3">
            <dt className="text-[13px] text-ink-faint">Email</dt>
            <dd className="mt-0.5 break-all text-[15px] font-medium text-ink">{account?.email}</dd>
          </dl>
        </Panel>
        <Link to={ROUTES.login} className="mt-6 block">
          <Button size="lg" fullWidth>
            Masuk ke sistem
          </Button>
        </Link>
      </AuthShell>
    );
  }

  if (state === STATE.used) {
    return (
      <AuthShell title="Tautan aktivasi sudah dipakai" subtitle={message} footer={footer}>
        <Panel tone="neutral" icon={MailCheck} title="Akun Anda kemungkinan sudah aktif">
          <p>Jika akun sudah aktif, langsung masuk. Jika belum, minta tautan aktivasi baru.</p>
        </Panel>
        <Link to={ROUTES.login} className="mt-6 block">
          <Button size="lg" fullWidth>
            Coba masuk
          </Button>
        </Link>
        <div className="mt-5">
          <p className="mb-3 text-[14px] font-medium text-ink">Belum bisa masuk?</p>
          <ResendForm email={account?.email} />
        </div>
      </AuthShell>
    );
  }

  if (state === STATE.expired) {
    return (
      <AuthShell title="Tautan aktivasi kedaluwarsa" subtitle={message} footer={footer}>
        <Panel tone="expired" icon={Clock} title="Minta tautan aktivasi baru">
          <p>Tautan aktif selama 48 jam. Masukkan email Anda untuk menerima tautan baru.</p>
        </Panel>
        <div className="mt-6">
          <ResendForm email={account?.email} />
        </div>
      </AuthShell>
    );
  }

  // invalid / error
  return (
    <AuthShell
      title="Tautan aktivasi tidak valid"
      subtitle={message || "Tautan aktivasi tidak dikenali atau sudah tidak berlaku."}
      footer={footer}
    >
      <Panel tone="bad" icon={state === STATE.error ? ShieldAlert : XCircle} title="Tautan tidak bisa dipakai">
        <p>Pastikan Anda membuka tautan terbaru dari email aktivasi, atau minta tautan baru di bawah.</p>
      </Panel>
      <div className="mt-6">
        <ResendForm email={account?.email} />
      </div>
      <p className="mt-4 text-center text-[14px] text-ink-soft">
        Sudah aktif?{" "}
        <Link to={ROUTES.login} className="font-semibold text-gold-deep hover:underline">
          Masuk di sini
        </Link>
      </p>
    </AuthShell>
  );
}
