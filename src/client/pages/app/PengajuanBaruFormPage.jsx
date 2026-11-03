import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { StepFields } from "@/components/pengajuan-baru/FormSections";
import { ReviewPanel } from "@/components/pengajuan-baru/ReviewPanel";
import { WizardProgress } from "@/components/pengajuan-baru/WizardProgress";
import { DRAFT_KEY, EMPTY_PENGAJUAN } from "@/lib/pengajuanBaruData";
import { STEP_FIELDS, STEP_LABELS, allSchema } from "@/lib/pengajuanBaruSchema";

const readDraft = () => {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? { ...EMPTY_PENGAJUAN, ...JSON.parse(raw) } : EMPTY_PENGAJUAN;
  } catch {
    return EMPTY_PENGAJUAN;
  }
};

const LAST = STEP_LABELS.length - 1;

export default function PengajuanBaruFormPage() {
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const defaultValues = useMemo(readDraft, []);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    getValues,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(allSchema),
    defaultValues,
    mode: "onTouched",
  });

  const values = watch();

  useEffect(() => {
    const id = window.setTimeout(() => {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(getValues()));
    }, 400);
    return () => window.clearTimeout(id);
  }, [values, getValues]);

  const saveDraft = () => {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(getValues()));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  const next = async () => {
    const ok = await trigger(STEP_FIELDS[step]);
    if (ok) setStep((s) => Math.min(s + 1, LAST));
  };

  const onSubmit = () => {
    window.localStorage.removeItem(DRAFT_KEY);
    setSubmitted(true);
  };

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[900px] px-5 py-8 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[12.5px] text-ink-faint">
              <Link to="/app/pengajuan-baru" className="hover:text-ink">
                Pengajuan baru
              </Link>{" "}
              / Formulir
            </p>
            <h1 className="mt-1 font-display text-[24px] font-semibold tracking-[-0.01em] text-ink">
              Formulir pengajuan etik
            </h1>
          </div>
          <Button variant="secondary" size="sm" onClick={saveDraft}>
            <Save className="size-4" aria-hidden="true" />
            Simpan draf
          </Button>
        </div>

        <div className="mt-5">
          <WizardProgress step={step} labels={STEP_LABELS} />
        </div>

        {saved ? (
          <Alert tone="success" className="mt-4">
            Draf tersimpan di perangkat ini.
          </Alert>
        ) : null}

        {submitted ? (
          <Alert tone="success" title="Pengajuan siap dikirim" className="mt-4">
            Ini masih prototipe frontend. Penghubung ke backend akan ditambahkan pada tahap
            berikutnya.
          </Alert>
        ) : null}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-5 rounded-xl border border-line bg-surface p-5 sm:p-6"
          noValidate
        >
          <StepFields
            step={step}
            register={register}
            errors={errors}
            values={values}
            control={control}
            setValue={setValue}
          />

          {step === LAST ? (
            <ReviewPanel values={values} agreed={agreed} onAgree={setAgreed} />
          ) : null}

          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((s) => Math.max(s - 1, 0))}
              disabled={step === 0}
            >
              Kembali
            </Button>
            {step < LAST ? (
              <Button type="button" onClick={next}>
                Lanjut
              </Button>
            ) : (
              <Button type="submit" disabled={!agreed}>
                Kirim pengajuan
              </Button>
            )}
          </div>
        </form>
      </div>
    </AppShell>
  );
}
