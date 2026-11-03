import { Link } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Field, Input, PasswordInput, Select } from "@/components/ui/FormControl";
import { ROUTES } from "@/config/site";
import { registerSchema } from "@/lib/authSchemas";
import { register as registerAccount, resendActivation } from "@/lib/authApi";

function SuccessPanel({ result }) {
  const [resendState, setResendState] = useState("idle");
  const [resendError, setResendError] = useState(null);

  const onResend = async () => {
    setResendError(null);
    setResendState("busy");
    try {
      await resendActivation(result.email);
      setResendState("sent");
    } catch (error) {
      setResendState("idle");
      setResendError(
        error.status === 429 ? error.message : "Gagal mengirim ulang. Coba lagi.",
      );
    }
  };

  return (
    <div>
      <span className="grid size-12 place-items-center rounded-full bg-[#e8f3ec]">
        <MailCheck className="size-6 text-[#12502f]" aria-hidden="true" />
      </span>
      <h2 className="mt-4 font-display text-[19px] font-bold tracking-[-0.02em] text-ink">
        Cek email Anda
      </h2>
      <p className="mt-1.5 text-[15px] leading-[1.55] text-ink-soft">{result.message}</p>

      <dl className="mt-5 rounded-xl bg-canvas px-4 py-3">
        <dt className="text-[13px] text-ink-faint">Tautan aktivasi dikirim ke</dt>
        <dd className="mt-0.5 break-all text-[15px] font-medium text-ink">{result.email}</dd>
      </dl>

      <ol className="mt-4 space-y-1.5 text-[14px] leading-[1.55] text-ink-soft">
        <li>1. Buka email dari Komite Etik Penelitian.</li>
        <li>2. Klik “Aktifkan akun”. Tautan berlaku 48 jam.</li>
        <li>3. Setelah aktif, masuk dengan email dan kata sandi Anda.</li>
      </ol>

      {resendError ? (
        <Alert tone="error" className="mt-4">
          {resendError}
        </Alert>
      ) : null}
      {resendState === "sent" ? (
        <Alert tone="success" className="mt-4">
          Tautan baru sudah dikirim ke {result.email}.
        </Alert>
      ) : null}

      <div className="mt-5 space-y-2.5">
        <Link to={ROUTES.login} className="block">
          <Button size="lg" fullWidth>
            Sudah aktif, masuk
          </Button>
        </Link>
        {resendState !== "sent" ? (
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            loading={resendState === "busy"}
            onClick={onResend}
          >
            Kirim ulang tautan
          </Button>
        ) : null}
      </div>

      <p className="mt-3 text-center text-[13px] text-ink-faint">
        Tidak menemukannya? Periksa folder spam atau{" "}
        <a href="mailto:kep@unpad.ac.id" className="font-medium text-gold-deep hover:underline">
          hubungi komite
        </a>
        .
      </p>
    </div>
  );
}

export default function RegisterPage() {
  const [result, setResult] = useState(null);
  const [formError, setFormError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      name: "",
      gender: "",
      phone: "",
      institution: "",
      password: "",
      confirmPassword: "",
      agree: false,
    },
  });

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      const response = await registerAccount(values);
      setResult(response);
    } catch (error) {
      setFormError(error.message);
    }
  };

  return (
    <AuthShell
      title={result ? "Aktivasi akun" : "Daftar akun peneliti baru"}
      subtitle={
        result
          ? "Satu langkah lagi: aktifkan akun lewat tautan yang kami kirim."
          : "Buat akun untuk mengajukan protokol kaji etik di Komite Etik Penelitian Unpad. Satu akun untuk satu peneliti; kolom bertanda * wajib diisi."
      }
      footer={
        !result ? (
          <p className="text-[14px] text-ink-soft">
            Sudah punya akun?{" "}
            <Link
              to={ROUTES.login}
              className="font-semibold text-gold-deep underline-offset-4 hover:underline"
            >
              Masuk di sini
            </Link>
          </p>
        ) : null
      }
    >
      {result ? (
        <SuccessPanel result={result} />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-3.5">
          {formError ? <Alert tone="error">{formError}</Alert> : null}

          <Field label="Email" htmlFor="reg-email" required error={errors.email?.message}>
            {({ describedBy }) => (
              <Input
                id="reg-email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                placeholder="nama@email.com"
                maxLength={50}
                invalid={Boolean(errors.email)}
                aria-describedby={describedBy}
                {...register("email")}
              />
            )}
          </Field>

          <Field label="Nama peneliti" htmlFor="reg-name" required error={errors.name?.message}>
            {({ describedBy }) => (
              <Input
                id="reg-name"
                autoComplete="name"
                placeholder="Nama lengkap sesuai identitas"
                maxLength={50}
                invalid={Boolean(errors.name)}
                aria-describedby={describedBy}
                {...register("name")}
              />
            )}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Jenis kelamin"
              htmlFor="reg-gender"
              required
              error={errors.gender?.message}
            >
              {({ describedBy }) => (
                <Select
                  id="reg-gender"
                  invalid={Boolean(errors.gender)}
                  aria-describedby={describedBy}
                  {...register("gender")}
                >
                  <option value="">Pilih</option>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </Select>
              )}
            </Field>

            <Field label="Nomor kontak" htmlFor="reg-phone" required error={errors.phone?.message}>
              {({ describedBy }) => (
                <Input
                  id="reg-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="08xxxxxxxxxx"
                  maxLength={20}
                  invalid={Boolean(errors.phone)}
                  aria-describedby={describedBy}
                  {...register("phone")}
                />
              )}
            </Field>
          </div>

          <Field
            label="Nama instansi"
            htmlFor="reg-institution"
            required
            error={errors.institution?.message}
            hint="Contoh: Universitas Padjadjaran"
          >
            {({ describedBy }) => (
              <Input
                id="reg-institution"
                autoComplete="organization"
                placeholder="Asal instansi peneliti"
                maxLength={100}
                invalid={Boolean(errors.institution)}
                aria-describedby={describedBy}
                {...register("institution")}
              />
            )}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Kata sandi"
              htmlFor="reg-password"
              required
              error={errors.password?.message}
              hint="Minimal 8 karakter"
            >
              {({ describedBy }) => (
                <PasswordInput
                  id="reg-password"
                  autoComplete="new-password"
                  placeholder="Buat kata sandi"
                  maxLength={30}
                  invalid={Boolean(errors.password)}
                  aria-describedby={describedBy}
                  {...register("password")}
                />
              )}
            </Field>

            <Field
              label="Ulangi kata sandi"
              htmlFor="reg-confirm"
              required
              error={errors.confirmPassword?.message}
            >
              {({ describedBy }) => (
                <PasswordInput
                  id="reg-confirm"
                  autoComplete="new-password"
                  placeholder="Ulangi kata sandi"
                  maxLength={30}
                  invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={describedBy}
                  {...register("confirmPassword")}
                />
              )}
            </Field>
          </div>

          </div>

          <div>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-canvas p-4 text-[15px] leading-[1.5] text-ink">
              <input
                type="checkbox"
                className="mt-0.5 size-5 shrink-0 cursor-pointer rounded-md accent-brand"
                aria-invalid={Boolean(errors.agree) || undefined}
                {...register("agree")}
              />
              <span>
                Data yang saya isi benar, dan saya paham ethical clearance hanya
                untuk riset yang belum dilakukan.
              </span>
            </label>
            {errors.agree ? (
              <p role="alert" className="mt-1.5 text-[13px] font-medium text-red">
                {errors.agree.message}
              </p>
            ) : null}
          </div>

          <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
            Simpan pendaftaran
          </Button>

          <p className="text-center text-[13px] text-ink-faint">
            Dengan menyimpan, data dikirim ke komite untuk verifikasi.
          </p>
        </form>
      )}
    </AuthShell>
  );
}
