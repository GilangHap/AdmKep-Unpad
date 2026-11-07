import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { StepFields } from "@/components/pengajuan-baru/FormSections";
import { ReviewPanel } from "@/components/pengajuan-baru/ReviewPanel";
import { WizardProgress } from "@/components/pengajuan-baru/WizardProgress";
import { EMPTY_PENGAJUAN } from "@/lib/pengajuanBaruData";
import { STEP_FIELDS, STEP_LABELS, allSchema } from "@/lib/pengajuanBaruSchema";
import {
  createPengajuan,
  getPengajuan,
  submitPengajuan,
  updatePengajuan,
  uploadPengajuanFile,
} from "@/lib/pengajuanBaruApi";

const LAST = STEP_LABELS.length - 1;
const AUTOSAVE_MS = 900;

const fromItem = (item) => ({
  ...EMPTY_PENGAJUAN,
  ...Object.fromEntries(
    Object.entries(item.fields).map(([key, value]) => [key, value ?? ""]),
  ),
  pembimbing: item.pembimbing.length
    ? item.pembimbing.map((r) => ({ n_nama: r.n_nama ?? "" }))
    : EMPTY_PENGAJUAN.pembimbing,
  peneliti_asing: item.penelitiAsing.length
    ? item.penelitiAsing.map(({ n_nama_asing, n_tugas_asing, n_kontak_asing }) => ({
        n_nama_asing: n_nama_asing ?? "",
        n_tugas_asing: n_tugas_asing ?? "",
        n_kontak_asing: n_kontak_asing ?? "",
      }))
    : EMPTY_PENGAJUAN.peneliti_asing,
});

export default function PengajuanBaruFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recordId, setRecordId] = useState(id ?? null);
  const [step, setStep] = useState(0);
  const [sync, setSync] = useState(id ? "loading" : "idle");
  const [syncError, setSyncError] = useState("");
  const [serverFields, setServerFields] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [locked, setLocked] = useState(null);
  const [uploadingSlot, setUploadingSlot] = useState("");
  // Legacy locks the subject type once the draft exists; keep that for rows opened by id.
  const [isExisting] = useState(Boolean(id));
  const dirty = useRef(false);
  const saving = useRef(false);
  const inflight = useRef(Promise.resolve());

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    getValues,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(allSchema),
    defaultValues: EMPTY_PENGAJUAN,
    mode: "onTouched",
  });

  const values = watch();
  // watch() returns a fresh object every render; the serialised snapshot keeps the
  // autosave effect from re-arming itself after each unrelated state change.
  const valuesKey = JSON.stringify(values);

  // Runs on mount only (and on a hard URL change): once a draft is created here the page
  // navigates to its own id, and re-fetching that id would clobber unsaved keystrokes.
  useEffect(() => {
    if (!id) return undefined;
    let alive = true;
    getPengajuan(id)
      .then((item) => {
        if (!alive) return;
        reset(fromItem(item));
        if (item.statusKode && item.statusKode !== "-1") setLocked(item.status);
        setSync("saved");
      })
      .catch((err) => {
        if (!alive) return;
        setSyncError(err.message);
        setSync("error");
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // One place that writes to the server: create on first save, update afterwards.
  // Calls are chained so an explicit submit always lands after the last autosave.
  const persist = () => {
    const run = inflight.current.then(async () => {
      if (locked) return null;
      saving.current = true;
      setSync("saving");
      setSyncError("");
      try {
        const payload = getValues();
        const result = recordId
          ? await updatePengajuan(recordId, payload)
          : await createPengajuan(payload);
        dirty.current = false;
        setServerFields({});
        setSync("saved");
        if (!recordId && result?.id) {
          setRecordId(String(result.id));
          navigate(`/app/pengajuan-baru/${result.id}`, { replace: true });
        }
        return result;
      } catch (err) {
        setSyncError(err.message);
        setServerFields(err.fields ?? {});
        setSync("error");
        return null;
      } finally {
        saving.current = false;
      }
    });
    inflight.current = run.catch(() => null);
    return run;
  };

  // A file needs a saved row first: flush the draft, upload, then mirror the stored
  // filename into the form so autosave keeps it.
  const uploadFile = async (slot, file) => {
    setUploadingSlot(slot);
    setSyncError("");
    try {
      const saved = await persist();
      const targetId = saved?.id ?? recordId;
      if (!targetId) throw new Error("Draf belum tersimpan. Coba lagi.");
      const data = await uploadPengajuanFile(targetId, slot, file);
      setValue(slot, data.filename);
    } catch (err) {
      setSyncError(err.message);
    } finally {
      setUploadingSlot("");
    }
  };

  // Autosave only once the author touched the form; an untouched new draft is never
  // written, so opening the wizard does not litter the table with empty rows.
  const touched = useRef(false);
  useEffect(() => {
    if (sync === "loading" || locked) return undefined;
    if (!touched.current) return undefined;
    dirty.current = true;
    const timer = window.setTimeout(() => {
      if (dirty.current) persist();
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valuesKey, locked]);

  const next = async () => {
    const ok = await trigger(STEP_FIELDS[step]);
    if (!ok) return;
    touched.current = true;
    setStep((s) => Math.min(s + 1, LAST));
    if (dirty.current) persist();
  };

  // Jumping forward validates every step before the target, so a later step cannot be
  // opened while an earlier one is still incomplete. Backward jumps are always allowed.
  const goToStep = async (target) => {
    if (target === step) return;
    if (locked || target < step) {
      setStep(target);
      return;
    }
    for (let index = 0; index < target; index += 1) {
      const ok = await trigger(STEP_FIELDS[index]);
      if (!ok) {
        setStep(index);
        return;
      }
    }
    touched.current = true;
    setStep(target);
  };

  const onSubmit = async () => {
    touched.current = true;
    setSubmitError("");
    setSubmitting(true);
    try {
      const saved = await persist();
      if (!saved) return;
      await submitPengajuan(saved.id ?? recordId);
      navigate("/app/pengajuan-baru?terkirim=1", { replace: true });
    } catch (err) {
      setSubmitError(err.message);
      setServerFields(err.fields ?? {});
      const first = STEP_FIELDS.findIndex((fields) =>
        fields.some((field) => err.fields?.[field]),
      );
      if (first >= 0) setStep(first);
    } finally {
      setSubmitting(false);
    }
  };

  if (sync === "loading") {
    return (
      <AppShell>
        <div className="mx-auto w-full max-w-[900px] px-5 py-8 sm:px-6">
          <p className="text-[13.5px] text-ink-soft">Memuat pengajuan…</p>
        </div>
      </AppShell>
    );
  }

  if (sync === "error" && !recordId) {
    return (
      <AppShell>
        <div className="mx-auto w-full max-w-[900px] px-5 py-8 sm:px-6">
          <Alert tone="error" title="Tidak dapat membuka pengajuan">
            {syncError}
          </Alert>
          <Link
            to="/app/pengajuan-baru"
            className="mt-4 inline-block text-[13.5px] text-brand hover:underline"
          >
            Kembali ke daftar pengajuan
          </Link>
        </div>
      </AppShell>
    );
  }

  const statusText = locked
    ? `Status: ${locked}`
    : {
        idle: "Belum tersimpan",
        loading: "Memuat…",
        saving: "Menyimpan…",
        saved: recordId ? `Tersimpan · No. ${recordId}` : "Tersimpan",
        error: "Gagal menyimpan",
      }[sync];

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
              {locked ? "Pengajuan etik" : recordId ? "Draf pengajuan" : "Formulir pengajuan etik"}
            </h1>
            <p
              className={
                sync === "error"
                  ? "mt-1 text-[12.5px] font-medium text-red"
                  : "mt-1 text-[12.5px] text-ink-faint"
              }
              role="status"
              aria-live="polite"
            >
              {statusText}
            </p>
          </div>
          {locked ? (
            <StatusPill tone="info">{locked}</StatusPill>
          ) : (
            <Button variant="secondary" size="sm" onClick={persist} disabled={sync === "saving"}>
              <Save className="size-4" aria-hidden="true" />
              Simpan draf
            </Button>
          )}
        </div>

        <div className="mt-5">
          <WizardProgress step={step} labels={STEP_LABELS} onSelect={goToStep} />
        </div>

        {locked ? (
          <Alert tone="info" title="Pengajuan sudah dikirim" className="mt-4">
            Pengajuan menunggu verifikasi petugas. Perubahan setelah dikirim harus melalui
            pengajuan perbaikan.
          </Alert>
        ) : null}

        {submitError ? (
          <Alert tone="error" title="Pengajuan belum terkirim" className="mt-4">
            {submitError}
          </Alert>
        ) : null}

        {syncError && recordId && !locked ? (
          <Alert tone="error" title="Perubahan belum tersimpan" className="mt-4">
            {syncError}
          </Alert>
        ) : null}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-5 rounded-xl border border-line bg-surface p-5 sm:p-6"
          noValidate
        >
          <fieldset
            disabled={Boolean(locked)}
            className="m-0 min-w-0 border-0 p-0 disabled:cursor-not-allowed"
          >
            <StepFields
              step={step}
              register={(name, opts) => {
                const field = register(name, opts);
                return {
                  ...field,
                  onChange: (event) => {
                    touched.current = true;
                    return field.onChange(event);
                  },
                };
              }}
              errors={{ ...errors, ...serverFields }}
              values={values}
              control={control}
              setValue={setValue}
              isExisting={isExisting}
              recordId={recordId}
              onUpload={uploadFile}
              uploadingSlot={uploadingSlot}
              readOnly={Boolean(locked)}
            />
          </fieldset>

          {step === LAST ? (
            <ReviewPanel
              values={values}
              agreed={agreed}
              onAgree={setAgreed}
              readOnly={Boolean(locked)}
            />
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
            ) : locked ? (
              <Link to="/app/pengajuan-baru">
                <Button variant="secondary">Kembali ke daftar</Button>
              </Link>
            ) : (
              <Button type="submit" disabled={!agreed || submitting}>
                {submitting ? "Mengirim…" : "Kirim pengajuan"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </AppShell>
  );
}
