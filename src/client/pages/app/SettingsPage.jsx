import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, KeyRound, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, PasswordInput, Select } from "@/components/ui/FormControl";
import { SITE } from "@/config/site";
import { useAuth } from "@/lib/AuthProvider";
import { changePassword, updateProfile } from "@/lib/authApi";
import { changePasswordSchema, profileSchema } from "@/lib/authSchemas";

const GENDER = { L: "Laki-laki", P: "Perempuan" };
const validGender = (value) => (value === "L" || value === "P" ? value : "");

function applyFieldErrors(error, setError) {
  for (const [name, messages] of Object.entries(error?.fields ?? {})) {
    const message = Array.isArray(messages) ? messages[0] : messages;
    if (message) setError(name, { type: "server", message });
  }
}

function Panel({ icon: Icon, title, description, children }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-canvas-deep text-brand">
          <Icon className="size-[18px]" aria-hidden="true" strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-[17px] font-semibold text-ink">{title}</h2>
          <p className="mt-0.5 text-[13px] leading-relaxed text-ink-soft">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function IdentityRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5 py-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-white/40" aria-hidden="true" strokeWidth={1.7} />
      <div className="min-w-0">
        <dt className="text-[11.5px] text-white/45">{label}</dt>
        <dd className="mt-0.5 break-words text-[13px] text-white/85">{value || "—"}</dd>
      </div>
    </div>
  );
}

function IdentityCard({ user }) {
  return (
    <aside className="lg:sticky lg:top-6">
      <section className="overflow-hidden rounded-xl bg-brand-deep">
        <div className="relative px-5 pb-4 pt-6">
          <ShieldCheck
            className="pointer-events-none absolute -right-7 -top-5 size-32 text-white/[0.05]"
            strokeWidth={0.9}
            aria-hidden="true"
          />
          <div className="flex items-center gap-3.5">
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary text-[19px] font-bold tracking-wide text-on-primary ring-2 ring-white/15">
              {user.initials}
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-[16.5px] font-semibold leading-tight text-white">
                {user.name}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-[12px]">
                <span className="text-gold-light">{user.role}</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-0.5 text-white/75">
                  <span className="size-1.5 rounded-full bg-gold" aria-hidden="true" />
                  Akun aktif
                </span>
              </p>
            </div>
          </div>
        </div>

        <dl className="divide-y divide-white/10 border-t border-white/10 px-5">
          <IdentityRow icon={Mail} label="Email" value={user.email} />
          <IdentityRow icon={Building2} label="Institusi" value={user.institution} />
          <IdentityRow icon={Phone} label="Nomor HP" value={user.phone} />
        </dl>
      </section>

      <section className="mt-4 rounded-xl border border-line bg-surface p-4">
        <p className="text-[13px] font-semibold text-ink">Butuh bantuan?</p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">
          Email dan peran akun hanya dapat diubah oleh komite. Hubungi tim bila ada kendala
          masuk atau data yang perlu diperbaiki.
        </p>
        <a
          href={`mailto:${SITE.supportEmail}`}
          className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-brand hover:underline"
        >
          <Mail className="size-3.5" aria-hidden="true" />
          {SITE.supportEmail}
        </a>
      </section>
    </aside>
  );
}

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [profileError, setProfileError] = useState(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const profile = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? "",
      gender: validGender(user?.gender),
      phone: user?.phone ?? "",
      institution: user?.institution ?? "",
    },
  });

  const password = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", password: "", confirmPassword: "" },
  });

  const onSaveProfile = async (values) => {
    setProfileError(null);
    setProfileSaved(false);
    try {
      const { user: next } = await updateProfile(values);
      updateUser(next);
      profile.reset({
        name: next.name,
        gender: validGender(next.gender),
        phone: next.phone,
        institution: next.institution,
      });
      setProfileSaved(true);
    } catch (error) {
      setProfileError(error.message);
      applyFieldErrors(error, profile.setError);
    }
  };

  const onChangePassword = async (values) => {
    setPasswordError(null);
    setPasswordSaved(false);
    try {
      await changePassword(values);
      password.reset();
      setPasswordSaved(true);
    } catch (error) {
      setPasswordError(error.message);
      applyFieldErrors(error, password.setError);
    }
  };

  const profileForm = profile.formState;
  const passwordForm = password.formState;

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1040px] px-5 py-8 sm:px-6">
        <header className="max-w-[62ch]">
          <h1 className="font-display text-[24px] font-semibold tracking-[-0.01em] text-ink">
            Pengaturan akun
          </h1>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-soft">
            Kelola profil peneliti, kontak yang dipakai komite, dan kata sandi akun Anda.
          </p>
        </header>

        <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <IdentityCard user={user} />

          <div className="space-y-6">
            <Panel
              icon={UserRound}
              title="Profil peneliti"
              description="Nama dan kontak ini dipakai komite untuk menghubungi Anda soal pengajuan."
            >
              {profileError ? (
                <Alert tone="error" title="Profil belum tersimpan" className="mb-5">
                  {profileError}
                </Alert>
              ) : null}
              {profileSaved ? (
                <Alert tone="success" title="Profil diperbarui" className="mb-5">
                  Perubahan Anda sudah tersimpan.
                </Alert>
              ) : null}

              <form
                onSubmit={profile.handleSubmit(onSaveProfile)}
                className="grid gap-4 sm:grid-cols-2"
                noValidate
              >
                <div className="flex items-center gap-3 rounded-xl bg-canvas px-4 py-3 sm:col-span-2">
                  <Mail className="size-[18px] shrink-0 text-ink-faint" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-[12px] text-ink-faint">Email akun</p>
                    <p className="truncate text-[14px] font-medium text-ink">{user?.email}</p>
                  </div>
                  <span className="ml-auto hidden shrink-0 rounded-full bg-canvas-deep px-2.5 py-1 text-[11.5px] text-ink-faint sm:block">
                    Tidak dapat diubah
                  </span>
                </div>

                <Field
                  label="Nama lengkap"
                  htmlFor="profile-name"
                  required
                  error={profileForm.errors.name?.message}
                >
                  {({ describedBy }) => (
                    <Input
                      id="profile-name"
                      autoComplete="name"
                      invalid={Boolean(profileForm.errors.name)}
                      aria-describedby={describedBy}
                      {...profile.register("name")}
                    />
                  )}
                </Field>

                <Field
                  label="Jenis kelamin"
                  htmlFor="profile-gender"
                  required
                  error={profileForm.errors.gender?.message}
                >
                  {({ describedBy }) => (
                    <Select
                      id="profile-gender"
                      invalid={Boolean(profileForm.errors.gender)}
                      aria-describedby={describedBy}
                      {...profile.register("gender")}
                    >
                      <option value="">Pilih jenis kelamin</option>
                      {Object.entries(GENDER).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>

                <Field
                  label="Nomor HP"
                  htmlFor="profile-phone"
                  required
                  error={profileForm.errors.phone?.message}
                  hint="Nomor aktif WhatsApp, contoh 08123456789."
                >
                  {({ describedBy }) => (
                    <Input
                      id="profile-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      invalid={Boolean(profileForm.errors.phone)}
                      aria-describedby={describedBy}
                      {...profile.register("phone")}
                    />
                  )}
                </Field>

                <Field
                  label="Institusi / unit kerja"
                  htmlFor="profile-institution"
                  required
                  error={profileForm.errors.institution?.message}
                >
                  {({ describedBy }) => (
                    <Input
                      id="profile-institution"
                      autoComplete="organization"
                      invalid={Boolean(profileForm.errors.institution)}
                      aria-describedby={describedBy}
                      {...profile.register("institution")}
                    />
                  )}
                </Field>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 sm:col-span-2">
                  <p className="text-[12.5px] text-ink-faint">
                    Perubahan berlaku untuk pengajuan berikutnya.
                  </p>
                  <Button
                    type="submit"
                    size="md"
                    loading={profileForm.isSubmitting}
                    disabled={!profileForm.isDirty}
                  >
                    Simpan profil
                  </Button>
                </div>
              </form>
            </Panel>

            <Panel
              icon={KeyRound}
              title="Kata sandi"
              description="Ganti kata sandi secara berkala. Masukkan kata sandi saat ini untuk mengonfirmasi."
            >
              {passwordError ? (
                <Alert tone="error" title="Kata sandi belum berubah" className="mb-5">
                  {passwordError}
                </Alert>
              ) : null}
              {passwordSaved ? (
                <Alert tone="success" title="Kata sandi diperbarui" className="mb-5">
                  Gunakan kata sandi baru pada saat masuk berikutnya.
                </Alert>
              ) : null}

              <form
                onSubmit={password.handleSubmit(onChangePassword)}
                className="grid gap-4 sm:grid-cols-2"
                noValidate
              >
                <Field
                  label="Kata sandi saat ini"
                  htmlFor="password-current"
                  required
                  error={passwordForm.errors.currentPassword?.message}
                  className="sm:col-span-2"
                >
                  {({ describedBy }) => (
                    <PasswordInput
                      id="password-current"
                      autoComplete="current-password"
                      invalid={Boolean(passwordForm.errors.currentPassword)}
                      aria-describedby={describedBy}
                      {...password.register("currentPassword")}
                    />
                  )}
                </Field>

                <Field
                  label="Kata sandi baru"
                  htmlFor="password-new"
                  required
                  error={passwordForm.errors.password?.message}
                  hint="8–30 karakter. Gunakan huruf, angka, dan simbol."
                >
                  {({ describedBy }) => (
                    <PasswordInput
                      id="password-new"
                      autoComplete="new-password"
                      invalid={Boolean(passwordForm.errors.password)}
                      aria-describedby={describedBy}
                      {...password.register("password")}
                    />
                  )}
                </Field>

                <Field
                  label="Ulangi kata sandi baru"
                  htmlFor="password-confirm"
                  required
                  error={passwordForm.errors.confirmPassword?.message}
                >
                  {({ describedBy }) => (
                    <PasswordInput
                      id="password-confirm"
                      autoComplete="new-password"
                      invalid={Boolean(passwordForm.errors.confirmPassword)}
                      aria-describedby={describedBy}
                      {...password.register("confirmPassword")}
                    />
                  )}
                </Field>

                <div className="flex justify-end border-t border-line pt-5 sm:col-span-2">
                  <Button type="submit" size="md" loading={passwordForm.isSubmitting}>
                    Perbarui kata sandi
                  </Button>
                </div>
              </form>
            </Panel>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
