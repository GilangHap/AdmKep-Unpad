import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Field, Input, PasswordInput } from "@/components/ui/FormControl";
import { ROUTES } from "@/config/site";
import { loginSchema } from "@/lib/authSchemas";
import { useAuth } from "@/lib/AuthProvider";

export default function LoginPage() {
  const [formError, setFormError] = useState(null);
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: true },
  });

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      const user = await login(values);
      if (Number(user.cGroup) !== 6) {
        await logout();
        setFormError("Akun ini bukan akun anggota. Silakan gunakan portal sesuai peran Anda.");
        return;
      }
      navigate(location.state?.from ?? "/app/dasbor", { replace: true });
    } catch (error) {
      setFormError(error.message);
    }
  };

  return (
    <AuthShell
      title="Masuk ke akun Anda"
      subtitle="Untuk peneliti dan reviewer Komite Etik Penelitian Unpad."
      footer={
        <p className="text-[14px] text-ink-soft">
          Belum punya akun?{" "}
          <Link
            to={ROUTES.register}
            className="font-semibold text-gold-deep underline-offset-4 hover:underline"
          >
            Daftar sekarang
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {formError ? <Alert tone="error">{formError}</Alert> : null}


        <Field label="Email" htmlFor="login-email" required error={errors.email?.message}>
          {({ describedBy }) => (
            <Input
              id="login-email"
              type="email"
              autoComplete="username"
              spellCheck={false}
              placeholder="nama@email.com"
              invalid={Boolean(errors.email)}
              aria-describedby={describedBy}
              {...register("email")}
            />
          )}
        </Field>

        <Field label="Kata sandi" htmlFor="login-password" required error={errors.password?.message}>
          {({ describedBy }) => (
            <PasswordInput
              id="login-password"
              autoComplete="current-password"
              placeholder="Masukkan kata sandi"
              invalid={Boolean(errors.password)}
              aria-describedby={describedBy}
              {...register("password")}
            />
          )}
        </Field>

        <div className="flex items-center justify-between gap-3 pt-0.5">
          <label className="flex cursor-pointer items-center gap-2 text-[15px] text-ink-soft">
            <input
              type="checkbox"
              className="size-[17px] cursor-pointer rounded-[5px] accent-brand"
              {...register("remember")}
            />
            Ingat saya
          </label>
          <Link
            to={ROUTES.forgotPassword}
            className="text-[14px] font-medium text-gold-deep underline-offset-4 hover:underline"
          >
            Lupa kata sandi?
          </Link>
        </div>

        <Button type="submit" size="lg" fullWidth loading={isSubmitting} className="mt-1">
          Masuk
          {!isSubmitting ? <ArrowRight className="size-4" aria-hidden="true" /> : null}
        </Button>
      </form>
    </AuthShell>
  );
}
