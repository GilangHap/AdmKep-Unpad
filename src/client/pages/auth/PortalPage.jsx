import { Link } from "react-router-dom";
import { ArrowRight, Info, LogIn, UserPlus } from "lucide-react";
import { AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/Button";
import { ROUTES, SITE } from "@/config/site";

function Choice({ to, icon: Icon, title, description, action, primary = false }) {
  return (
    <div
      className={[
        "flex h-full flex-col rounded-2xl p-5",
        primary ? "bg-primary-soft" : "bg-canvas",
      ].join(" ")}
    >
      <span
        className={[
          "grid size-10 place-items-center rounded-xl",
          primary ? "bg-primary text-on-primary" : "bg-surface text-brand",
        ].join(" ")}
        aria-hidden="true"
      >
        <Icon className="size-5" />
      </span>

      <h2 className="mt-3.5 font-display text-[17px] font-bold tracking-[-0.01em] text-ink">
        {title}
      </h2>
      <p className="mt-1 flex-1 text-[14px] leading-[1.55] text-ink-soft">{description}</p>

      <Link to={to} className="mt-4 block">
        <Button
          variant={primary ? "primary" : "secondary"}
          size="lg"
          fullWidth
        >
          {action}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </Link>
    </div>
  );
}

export default function PortalPage() {
  return (
    <AuthShell
      title="Masuk atau daftar akun"
      subtitle={`Apakah Anda sudah memiliki akun untuk masuk ke aplikasi ${SITE.shortName}? Pilih salah satu di bawah.`}
      footer={
        <p className="text-[13px] text-ink-faint">
          Lupa kata sandi akun yang sudah aktif?{" "}
          <Link
            to={ROUTES.forgotPassword}
            className="font-medium text-gold-deep underline-offset-4 hover:underline"
          >
            Atur ulang di sini
          </Link>
          .
        </p>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Choice
          primary
          to={ROUTES.register}
          icon={UserPlus}
          title="Belum punya akun"
          description="Buat akun peneliti baru untuk mengajukan protokol kaji etik."
          action="Daftar sekarang"
        />
        <Choice
          to={ROUTES.login}
          icon={LogIn}
          title="Sudah punya akun"
          description="Masuk ke sistem layanan untuk melanjutkan pengajuan Anda."
          action="Masuk ke sistem"
        />
      </div>

      <div className="mt-3 flex items-start gap-2.5 rounded-2xl bg-canvas px-4 py-3">
        <Info className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
        <p className="text-[13px] leading-[1.55] text-ink-soft">
          Hanya ingin memeriksa status persetujuan?{" "}
          <Link
            to={ROUTES.status}
            className="font-medium text-gold-deep underline-offset-4 hover:underline"
          >
            Cek data etik tanpa akun
          </Link>
          .
        </p>
      </div>
    </AuthShell>
  );
}
