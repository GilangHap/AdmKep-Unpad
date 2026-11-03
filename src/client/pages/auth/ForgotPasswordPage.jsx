import { Link } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, MailCheck } from "lucide-react";
import { AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Field, Input, Select } from "@/components/ui/FormControl";
import { ROUTES } from "@/config/site";
import { forgotPasswordSchema } from "@/lib/authSchemas";
import { requestPasswordReset } from "@/lib/authApi";

export default function ForgotPasswordPage() {
  const [result, setResult] = useState(null);
  const [formError, setFormError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "", phone: "", institution: "", reason: "", group: "" },
  });

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      setResult(await requestPasswordReset(values));
    } catch (error) {
      setFormError(error.message);
    }
  };

  const footer = (
    <Link
      to={ROUTES.login}
      className="inline-flex items-center gap-1.5 text-[14px] font-medium text-gold-deep hover:underline"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      Kembali ke halaman masuk
    </Link>
  );

  if (result) {
    return (
      <AuthShell
        title="Cek email Anda"
        subtitle="Kata sandi baru dikirim ke alamat email terdaftar."
        footer={footer}
      >
        <span className="grid size-12 place-items-center rounded-full bg-[#e8f3ec]">
          <MailCheck className="size-6 text-[#12502f]" aria-hidden="true" />
        </span>
        <p className="mt-4 text-[14px] leading-[1.55] text-ink-soft">{result.message}</p>
        <dl className="mt-5 rounded-xl bg-canvas px-4 py-3">
          <dt className="text-[13px] text-ink-faint">Dikirim ke</dt>
          <dd className="mt-0.5 break-all text-[14.5px] font-medium text-ink">{result.email}</dd>
        </dl>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Atur ulang kata sandi akun"
      subtitle="Isi data yang sama seperti saat registrasi agar kami bisa memverifikasi."
      footer={footer}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {formError ? <Alert tone="error">{formError}</Alert> : null}

        <Field label="Email" htmlFor="forgot-email" required error={errors.email?.message}>
          {({ describedBy }) => (
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              spellCheck={false}
              placeholder="nama@email.com"
              invalid={Boolean(errors.email)}
              aria-describedby={describedBy}
              {...register("email")}
            />
          )}
        </Field>

        <Field label="Nomor HP" htmlFor="forgot-phone" required error={errors.phone?.message}>
          {({ describedBy }) => (
            <Input
              id="forgot-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="08xxxxxxxxxx"
              invalid={Boolean(errors.phone)}
              aria-describedby={describedBy}
              {...register("phone")}
            />
          )}
        </Field>

        <Field
          label="Asal instansi"
          htmlFor="forgot-institution"
          required
          error={errors.institution?.message}
        >
          {({ describedBy }) => (
            <Input
              id="forgot-institution"
              autoComplete="organization"
              placeholder="Instansi saat registrasi"
              invalid={Boolean(errors.institution)}
              aria-describedby={describedBy}
              {...register("institution")}
            />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Kelompok pengguna"
            htmlFor="forgot-group"
            required
            error={errors.group?.message}
          >
            {({ describedBy }) => (
              <Select
                id="forgot-group"
                invalid={Boolean(errors.group)}
                aria-describedby={describedBy}
                {...register("group")}
              >
                <option value="">Pilih</option>
                <option value="PEMOHON">Pemohon etik</option>
                <option value="REVIEWER">Reviewer etik</option>
              </Select>
            )}
          </Field>

          <Field label="Alasan" htmlFor="forgot-reason" required error={errors.reason?.message}>
            {({ describedBy }) => (
              <Input
                id="forgot-reason"
                placeholder="Mis. lupa kata sandi"
                maxLength={100}
                invalid={Boolean(errors.reason)}
                aria-describedby={describedBy}
                {...register("reason")}
              />
            )}
          </Field>
        </div>

        <Button type="submit" size="lg" fullWidth loading={isSubmitting} className="mt-1">
          Kirim permintaan
        </Button>
      </form>
    </AuthShell>
  );
}
