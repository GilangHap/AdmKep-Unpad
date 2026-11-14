import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/FormControl";
import { sectionSchema, SECTION_META, defaultBiodataHtml } from "@/lib/pengajuanSections";
import { getPengajuanSection, savePengajuanSection, uploadKpph } from "@/lib/pengajuanBaruApi";

const AREA =
  "w-full rounded-xl border border-line bg-canvas px-3.5 py-3 text-[16px] text-ink placeholder:text-ink-faint focus:border-brand focus:bg-surface focus:outline-none";

// Quill is heavy and only the biodata sub-form needs it, so keep it out of the main chunk.
const RichTextEditor = lazy(() =>
  import("@/components/pengajuan-baru/RichText").then((mod) => ({ default: mod.RichTextEditor })),
);

function RichEditor(props) {
  return (
    <Suspense fallback={<div className="h-40 rounded-xl border border-line bg-canvas" />}>
      <RichTextEditor {...props} />
    </Suspense>
  );
}

const isoDay = (value) => {
  if (!value) return "";
  const text = String(value);
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : "";
};

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return String(value)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
};

function hydrate(schema, data) {
  const out = {};
  for (const group of schema.groups) {
    for (const f of group.fields) {
      const raw = data?.[f.name];
      if (f.type === "checkbox") out[f.name] = asArray(raw);
      else if (f.type === "repeater") {
        if (Array.isArray(raw)) out[f.name] = raw;
        else if (typeof raw === "string" && raw.trim()) {
          try {
            const parsed = JSON.parse(raw);
            out[f.name] = Array.isArray(parsed) ? parsed : [];
          } catch {
            out[f.name] = [];
          }
        } else out[f.name] = [];
      } else if (f.name === "pembimbing") out[f.name] = Array.isArray(raw) ? raw : [];
      else if (f.type === "date") out[f.name] = isoDay(raw);
      else if (f.type === "number") out[f.name] = raw == null ? "" : String(raw).trim();
      else out[f.name] = raw == null ? "" : String(raw);
      if (!out[f.name] && f.default) out[f.name] = f.default;
    }
  }
  if (out.json_ringkasan_kasus && out.json_ringkasan_kasus.length === 0) {
    out.json_ringkasan_kasus = [{}];
  }
  return out;
}

function visible(field, values) {
  const cond = field.showIf;
  if (!cond) return true;
  if (Array.isArray(cond)) return cond.some((c) => visible({ showIf: c }, values));
  if (cond.includes) return asArray(values[cond.field]).includes(cond.includes);
  return String(values[cond.field] ?? "") === cond.is;
}

function Choice({ field, value, onChange, invalid, disabled }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {field.options.map((option) => {
        const checked = String(value ?? "") === option.value;
        return (
          <label
            key={option.value}
            className={`flex items-start gap-2 text-[14.5px] text-ink ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
          >
            <input
              type="radio"
              name={field.name}
              value={option.value}
              checked={checked}
              onChange={() => onChange(option.value)}
              disabled={disabled}
              aria-invalid={invalid || undefined}
              className="mt-0.5 size-4 accent-[#002a5c]"
            />
            <span>{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}

function Checks({ field, value, onChange }) {
  const list = asArray(value);
  const toggle = (v) => onChange(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {field.options.map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer items-start gap-2 text-[14.5px] text-ink"
        >
          <input
            type="checkbox"
            value={option.value}
            checked={list.includes(option.value)}
            onChange={() => toggle(option.value)}
            className="mt-0.5 size-4 accent-[#002a5c]"
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

function KpphUpload({ pengajuanId, value, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const onPick = async (file) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const saved = await uploadKpph(pengajuanId, file);
      onChange(saved.filename);
    } catch (err) {
      setError(err.message ?? "Gagal mengunggah file.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      {value ? (
        <p className="mb-2 text-[13px] text-ink-soft">
          Tersimpan:{" "}
          <a href={`/api/pengajuan-baru/${pengajuanId}/kpph`} target="_blank" rel="noreferrer" className="text-brand underline">
            unduh file
          </a>
        </p>
      ) : (
        <p className="mb-2 text-[13px] text-ink-faint">Belum ada file.</p>
      )}
      <input
        type="file"
        accept=".pdf,.doc,.docx"
        disabled={busy}
        onChange={(e) => onPick(e.target.files?.[0])}
        className="block w-full text-[14px] text-ink-soft file:mr-3 file:cursor-pointer file:rounded-xl file:border-0 file:bg-surface file:px-3 file:py-2 file:text-[13px] file:font-medium file:text-ink"
      />
      {busy ? <p className="mt-1 text-[12.5px] text-ink-faint">Mengunggah…</p> : null}
      {error ? <p className="mt-1 text-[12.5px] text-red">{error}</p> : null}
    </div>
  );
}

function Repeater({ field, value, onChange, limits }) {
  const rows = Array.isArray(value) ? value : [];
  const update = (index, key, next) => {
    const copy = rows.map((row, i) => (i === index ? { ...row, [key]: next } : row));
    onChange(copy);
  };
  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div key={index} className="rounded-xl border border-line bg-canvas p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[13px] font-semibold text-ink-soft">
              {field.itemLabel ?? "Baris"} {index + 1}
            </p>
            {rows.length > 1 ? (
              <button
                type="button"
                onClick={() => onChange(rows.filter((_, i) => i !== index))}
                className="inline-flex cursor-pointer items-center gap-1 text-[13px] font-medium text-red hover:underline"
              >
                <Trash2 className="size-3.5" aria-hidden="true" /> Hapus
              </button>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {field.rows.map((rf) => (
              <Field
                key={rf.name}
                htmlFor={`${field.name}-${index}-${rf.name}`}
                label={rf.label}
                required={rf.required}
                className={rf.type === "textarea" ? "sm:col-span-2" : undefined}
              >
                {rf.type === "textarea" ? (
                  <textarea
                    id={`${field.name}-${index}-${rf.name}`}
                    rows={2}
                    maxLength={limits?.[rf.name]}
                    value={row[rf.name] ?? ""}
                    onChange={(e) => update(index, rf.name, e.target.value)}
                    className={AREA}
                  />
                ) : rf.type === "select" ? (
                  <Select
                    id={`${field.name}-${index}-${rf.name}`}
                    value={row[rf.name] ?? ""}
                    onChange={(e) => update(index, rf.name, e.target.value)}
                  >
                    <option value="">-- Pilih --</option>
                    {rf.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    id={`${field.name}-${index}-${rf.name}`}
                    type={rf.type === "number" ? "number" : "text"}
                    maxLength={limits?.[rf.name]}
                    value={row[rf.name] ?? ""}
                    onChange={(e) => update(index, rf.name, e.target.value)}
                  />
                )}
              </Field>
            ))}
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => onChange([...rows, {}])}
        className="gap-1.5"
      >
        <Plus className="size-4" aria-hidden="true" /> Tambah {field.itemLabel ?? "baris"}
      </Button>
    </div>
  );
}

function BiodataRows({ value, onChange, readOnly }) {
  const rows = Array.isArray(value) ? value : [];
  return (
    <div className="space-y-3">
      {rows.length === 0 ? (
        <p className="text-[13.5px] text-ink-faint">Belum ada pembimbing terdaftar.</p>
      ) : null}
      {rows.map((row, index) => (
        <div key={row.id ?? index} className="rounded-xl border border-line bg-canvas p-4">
          <p className="mb-2 text-[13px] font-semibold text-ink-soft">
            {index + 1}. {row.n_nama || `Pembimbing ${index + 1}`}
          </p>
          <RichEditor
            id={`biodata-lain-${row.id ?? index}`}
            value={row.biodata_lain ?? ""}
            onChange={(v) => onChange(rows.map((r, i) => (i === index ? { ...r, biodata_lain: v } : r)))}
            readOnly={readOnly}
          />
        </div>
      ))}
    </div>
  );
}

export default function PengajuanBaruSectionPage() {
  const { id, bagian } = useParams();
  const [item, setItem] = useState(null);
  const [values, setValues] = useState({});
  const [schema, setSchema] = useState(null);
  const [limits, setLimits] = useState({});
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    getPengajuanSection(id, bagian)
      .then((data) => {
        if (!alive) return;
        const next = sectionSchema(bagian, data.item.kelompokKode, data.data);
        const hydrated = hydrate(next, data.data);
        if (bagian === "biodata" && data.item.editable && !String(hydrated.biodata_pi ?? "").trim()) {
          hydrated.biodata_pi = defaultBiodataHtml(data.item.peneliti);
        }
        if (bagian === "li") {
          if (!String(hydrated.n_peneliti_nama ?? "").trim()) hydrated.n_peneliti_nama = data.item.peneliti ?? "";
          if (!String(hydrated.n_peneliti_asal ?? "").trim()) hydrated.n_peneliti_asal = data.item.institusi ?? "";
        }
        setItem(data.item);
        setSchema(next);
        setLimits(data.limits ?? {});
        setValues(hydrated);
        setStatus("ready");
      })
      .catch((err) => {
        if (!alive) return;
        setLoadError(err.message ?? "Gagal memuat isian.");
        setStatus("error");
      });
    return () => {
      alive = false;
    };
  }, [id, bagian]);

  const title = schema?.title ?? SECTION_META[bagian]?.label ?? "Isian";

  const setValue = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: "" } : prev));
  };

  const requiredErrors = useMemo(() => {
    const out = {};
    if (!schema) return out;
    for (const group of schema.groups) {
      for (const f of group.fields) {
        if (!f.required || !visible(f, values)) continue;
        const v = values[f.mirror ?? f.name];
        const empty = Array.isArray(v)
          ? v.length === 0
          : f.type === "rich"
            ? !String(v ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim()
            : !String(v ?? "").trim();
        if (empty) out[f.name] = "Wajib diisi.";
      }
    }
    return out;
  }, [schema, values]);

  const onSave = async () => {
    if (Object.keys(requiredErrors).length) {
      setErrors(requiredErrors);
      setNotice("");
      setError("Masih ada isian wajib yang kosong.");
      return;
    }
    if (bagian === "biodata") {
      const empty = (values.pembimbing ?? []).findIndex((row) => !String(row?.biodata_lain ?? "").trim());
      if (empty >= 0) {
        const nama = values.pembimbing[empty]?.n_nama || `Pembimbing ${empty + 1}`;
        setNotice("");
        setError(`Biodata ${nama} wajib diisi.`);
        return;
      }
    }
    setSaving(true);
    setError("");
    try {
      const saved = await savePengajuanSection(id, bagian, values);
      setValues(hydrate(schema, saved.data));
      setErrors({});
      setNotice("Isian tersimpan.");
    } catch (err) {
      setError(err.message ?? "Gagal menyimpan isian.");
    } finally {
      setSaving(false);
    }
  };

  const renderField = (f) => {
    if (!visible(f, values)) return null;
    if (f.type === "static") return null;
    if (f.type === "note") {
      return (
        <p key={f.name} className="sm:col-span-2 text-[15px] font-semibold leading-relaxed text-ink">
          {f.text}
        </p>
      );
    }
    const shared = { htmlFor: `f-${f.name}`, label: f.label, required: f.required, hint: f.hint, error: errors[f.name] };
    if (f.type === "biodata-rows") {
      return (
        <Field key={f.name} htmlFor={`f-${f.name}`} label={f.label} hint={f.hint} className="sm:col-span-2">
          <BiodataRows
            value={values.pembimbing}
            onChange={(v) => setValue("pembimbing", v)}
            readOnly={item?.editable === false}
          />
        </Field>
      );
    }
    if (f.type === "rich") {
      const key = f.mirror ?? f.name;
      return (
        <Field key={f.name} {...shared} className="sm:col-span-2">
          <RichEditor
            id={`f-${f.name}`}
            value={values[key] ?? ""}
            onChange={(v) => setValue(key, v)}
            readOnly={item?.editable === false}
          />
        </Field>
      );
    }
    if (f.type === "repeater") {
      return (
        <Field
          key={f.name}
          htmlFor={`f-${f.name}`}
          label={f.label}
          required={f.required}
          hint={f.hint}
          error={errors[f.name]}
          className="sm:col-span-2"
        >
          <Repeater
            field={f}
            value={values[f.name]}
            onChange={(v) => setValue(f.name, v)}
            limits={limits}
          />
        </Field>
      );
    }
    if (f.type === "file") {
      return (
        <Field key={f.name} {...shared} className="sm:col-span-2">
          <KpphUpload
            pengajuanId={item?.id}
            value={values[f.name]}
            onChange={(v) => setValue(f.name, v)}
          />
        </Field>
      );
    }
    if (f.type === "radio") {
      return (
        <Field key={f.name} {...shared}>
          <Choice
            field={f}
            value={values[f.name]}
            onChange={(v) => setValue(f.name, v)}
            invalid={Boolean(errors[f.name])}
            disabled={Boolean(f.locked)}
          />
        </Field>
      );
    }
    if (f.type === "checkbox") {
      return (
        <Field key={f.name} {...shared}>
          <Checks field={f} value={values[f.name]} onChange={(v) => setValue(f.name, v)} />
        </Field>
      );
    }
    if (f.type === "textarea") {
      return (
        <Field key={f.name} {...shared} className="sm:col-span-2">
          <textarea
            id={`f-${f.name}`}
            rows={f.rows ?? 3}
            maxLength={limits[f.name]}
            value={values[f.name] ?? ""}
            onChange={(e) => setValue(f.name, e.target.value)}
            aria-invalid={errors[f.name] ? true : undefined}
            className={AREA}
          />
        </Field>
      );
    }
    if (f.type === "select") {
      return (
        <Field key={f.name} {...shared}>
          <Select
            id={`f-${f.name}`}
            value={values[f.name] ?? ""}
            onChange={(e) => setValue(f.name, e.target.value)}
            invalid={Boolean(errors[f.name])}
          >
            <option value="">-- Pilih --</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      );
    }
    return (
      <Field key={f.name} {...shared}>
        <Input
          id={`f-${f.name}`}
          type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
          maxLength={limits[f.name]}
          value={values[f.name] ?? ""}
          onChange={(e) => setValue(f.name, e.target.value)}
          invalid={Boolean(errors[f.name])}
        />
      </Field>
    );
  };

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <Link
          to="/app/pengajuan-baru"
          className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-soft hover:text-brand"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Pengajuan baru
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[24px] font-semibold tracking-tight text-ink sm:text-[28px]">{title}</h1>
            <p className="mt-1 truncate text-[14px] text-ink-soft">{item?.judul || "Pengajuan baru"}</p>
          </div>
          <Button onClick={onSave} disabled={saving || status !== "ready" || item?.editable === false} className="gap-1.5">
            <Save className="size-4" aria-hidden="true" />
            {saving ? "Menyimpan…" : "Simpan isian"}
          </Button>
        </div>

        {notice ? (
          <Alert tone="success" className="mt-4" title={notice}>
            <button type="button" onClick={() => setNotice("")} className="cursor-pointer underline">
              Tutup
            </button>
          </Alert>
        ) : null}
        {error ? (
          <Alert tone="error" className="mt-4" title={error}>
            <button type="button" onClick={() => setError("")} className="cursor-pointer underline">
              Tutup
            </button>
          </Alert>
        ) : null}
        {item?.editable === false ? (
          <Alert tone="info" className="mt-4">
            Pengajuan ini sudah dikirim ke petugas, isian tidak dapat diubah.
          </Alert>
        ) : null}

        {status === "loading" ? (
          <p className="mt-8 text-[14px] text-ink-soft">Memuat isian…</p>
        ) : status === "error" ? (
          <Alert tone="error" className="mt-8" title="Gagal memuat isian">
            {loadError}
          </Alert>
        ) : (
          <>
            {item ? (
              <div className="mt-5 rounded-xl border border-line bg-surface p-4">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-faint">
                  Informasi umum peneliti utama
                </p>
                <dl className="mt-2 grid gap-x-6 gap-y-1.5 text-[14px] sm:grid-cols-2">
                  {[
                    ["Nama", item.peneliti],
                    ["Jabatan/kedudukan", item.kedudukan],
                    ["Instansi pengusul", item.institusi],
                    ["Alamat instansi", item.alamat],
                    ["No HP", item.hp],
                  ].map(([label, value]) => (
                    <div key={label} className="flex gap-2">
                      <dt className="shrink-0 text-ink-faint">{label}:</dt>
                      <dd className="text-ink">{value || "—"}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}

            <form
              className="mt-5 space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                onSave();
              }}
            >
              {schema.groups.map((group) => {
                if (group.key === "li_identitas") {
                  const versi = group.fields.find((f) => f.name === "c_versi");
                  const ro = item?.editable === false;
                  return (
                    <section key={group.key} className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
                      <h2 className="text-[15px] font-semibold text-ink">{group.label}</h2>
                      {versi ? <div className="mt-3 grid gap-4 sm:grid-cols-2">{renderField(versi)}</div> : null}
                      <p className="mt-4 text-[14.5px] leading-relaxed text-ink">
                        Saya adalah{" "}
                        <Input
                          value={values.n_peneliti_nama ?? ""}
                          onChange={(e) => setValue("n_peneliti_nama", e.target.value)}
                          placeholder="[Nama Peneliti]"
                          aria-label="Nama peneliti"
                          disabled={ro}
                          className="mt-1 inline-block w-full align-baseline sm:w-56"
                        />{" "}
                        berasal dari{" "}
                        <Input
                          value={values.n_peneliti_asal ?? ""}
                          onChange={(e) => setValue("n_peneliti_asal", e.target.value)}
                          placeholder="[Institusi Peneliti]"
                          aria-label="Institusi peneliti"
                          disabled={ro}
                          className="mt-1 inline-block w-full align-baseline sm:w-56"
                        />{" "}
                        yang sedang melakukan penelitian untuk mengundang Anda berpartisipasi dalam penelitian ini,
                        keikutsertaan Anda dalam penelitian ini bersifat sukarela, jadi Anda dapat memutuskan untuk
                        berpartisipasi atau sebaliknya.
                      </p>
                    </section>
                  );
                }
                return (
                  <section key={group.key} className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
                    <h2 className="text-[15px] font-semibold text-ink">{group.label}</h2>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">{group.fields.map(renderField)}</div>
                  </section>
                );
              })}
              <div className="flex justify-end">
                <Button type="submit" disabled={saving || item?.editable === false} className="gap-1.5">
                  <Save className="size-4" aria-hidden="true" />
                  {saving ? "Menyimpan…" : "Simpan isian"}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </AppShell>
  );
}
