import { Suspense, lazy, useEffect, useState } from "react";
import { useWatch } from "react-hook-form";
import { Download, FileText, Upload } from "lucide-react";
import { cn } from "@/lib/cn";
import { Field, Input, Select } from "@/components/ui/FormControl";
import { DynamicRows } from "@/components/pengajuan-baru/DynamicTable";

// Quill is only needed on the steps with long text, so it ships as its own chunk.
const RichText = lazy(() =>
  import("@/components/pengajuan-baru/RichText").then((mod) => ({ default: mod.RichText })),
);
import {
  DOKUMEN_KELOMPOK,
  FOKUS,
  GATE_STEPS,
  JENIS_SUBJEK,
  JENJANG,
  KELOMPOK,
  KERJASAMA,
  PERUNTUKAN,
  STATUS_ETIK_LAIN,
  SUMBER_DANA,
  YA_TIDAK,
  dokumenDariGate,
} from "@/lib/pengajuanBaruData";
import { kelompokDariGate } from "@/lib/pengajuanBaruSchema";

// Alur gate legacy: tiap jawaban membuka pertanyaan berikutnya dan menetapkan kelompok formulir.
function gateFlow(c_jenis_subjek, fetik_p1, fetik_p1_tdk, fetik_p1_tdk_tdk) {
  if (c_jenis_subjek === "3") return { gates: [], fokus: false, c_kelompok: "5" };
  if (c_jenis_subjek !== "1") return { gates: [], fokus: false, c_kelompok: "" };

  const gates = ["fetik_p1"];
  if (fetik_p1 === "Y") return { gates, fokus: false, c_kelompok: "5" };
  if (fetik_p1 !== "N") return { gates, fokus: false, c_kelompok: "" };

  gates.push("fetik_p1_tdk");
  if (fetik_p1_tdk === "Y") return { gates, fokus: false, c_kelompok: "7" };
  if (fetik_p1_tdk !== "N") return { gates, fokus: false, c_kelompok: "" };

  gates.push("fetik_p1_tdk_tdk");
  if (fetik_p1_tdk_tdk === "Y") return { gates, fokus: false, c_kelompok: "2" };
  if (fetik_p1_tdk_tdk === "N") return { gates, fokus: true, c_kelompok: "" };
  return { gates, fokus: false, c_kelompok: "" };
}

const AREA =
  "w-full rounded-xl border border-line bg-canvas px-3.5 py-3 text-[16px] text-ink placeholder:text-ink-faint focus:border-brand focus:bg-surface focus:outline-none";

const options = (list) =>
  list.map((o) => (
    <option key={o.value} value={o.value}>
      {o.label}
    </option>
  ));

function Area({ id, rows = 3, invalid, ...props }) {
  return (
    <textarea
      id={id}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={AREA}
      {...props}
    />
  );
}

function Section({ title, children }) {
  return (
    <section className="mt-6 border-t border-line pt-6 first:mt-0 first:border-t-0 first:pt-0">
      <h2 className="font-display text-[15.5px] font-semibold text-ink">{title}</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function FileField({ label, name, value, recordId, onUpload, uploading, readOnly }) {
  const inputId = `file-${name}`;
  const [dragging, setDragging] = useState(false);
  const disabled = readOnly || uploading;
  const take = (files) => {
    const file = files?.[0];
    if (file) onUpload(name, file);
  };

  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-[14px] font-medium text-ink">{label}</p>
      <div
        onDragOver={(event) => {
          if (disabled) return;
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!disabled) take(event.dataTransfer.files);
        }}
        className={cn(
          "relative rounded-xl border p-3 transition-colors duration-150",
          dragging ? "border-brand bg-primary-soft" : "border-line bg-canvas",
        )}
      >
        <input
          id={inputId}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="sr-only"
          disabled={disabled}
          aria-describedby={`${inputId}-hint`}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) take([file]);
          }}
        />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className={value ? "text-brand" : "text-ink-faint"} aria-hidden="true">
            {value ? <FileText className="size-4" /> : <Upload className="size-4" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-ink">
              {value ? "Dokumen tersimpan" : "Belum ada dokumen"}
            </p>
            {value && recordId ? (
              <a
                href={`/api/pengajuan-baru/${recordId}/files/${name}`}
                target="_blank"
                rel="noreferrer"
                className="mt-0.5 inline-flex items-center gap-1 text-[12.5px] text-brand hover:underline"
              >
                <Download className="size-3.5" aria-hidden="true" /> Unduh
              </a>
            ) : null}
          </div>
          {disabled ? null : (
            <label
              htmlFor={inputId}
              className="inline-flex h-8 shrink-0 cursor-pointer items-center rounded-lg border border-control bg-surface px-3 text-[12.5px] font-medium text-ink transition-colors duration-150 hover:border-brand hover:text-brand"
            >
              {value ? "Ganti" : "Pilih file"}
            </label>
          )}
        </div>
        <p id={`${inputId}-hint`} className="mt-2 text-[12px] text-ink-faint">
          {readOnly
            ? "Tidak dapat diubah setelah dikirim."
            : uploading
              ? "Mengunggah…"
              : value
                ? "Seret file baru untuk mengganti."
                : "PDF, JPG, atau PNG · maks 10 MB. Bisa juga seret file ke sini."}
        </p>
      </div>
    </div>
  );
}

function Step1({ register, errors, control, setValue, isExisting }) {
  const values = useWatch({ control }) ?? {};
  const showHewan = values.c_jenis_subjek === "2";
  const flow = gateFlow(values.c_jenis_subjek, values.fetik_p1, values.fetik_p1_tdk, values.fetik_p1_tdk_tdk);
  const gates = GATE_STEPS.filter((g) => flow.gates.includes(g.key));
  const fokus = flow.fokus;
  const c_kelompok =
    kelompokDariGate(values) ||
    (values.c_jenis_subjek === "2" && values.hwn_hidup_mati === "1" ? "3" : "") ||
    (values.c_jenis_subjek === "2" && values.hwn_hidup_mati === "2" ? "6" : "") ||
    flow.c_kelompok;
  const dokumen = dokumenDariGate(values) ?? DOKUMEN_KELOMPOK[c_kelompok];

  useEffect(() => {
    if (values.c_kelompok !== c_kelompok) {
      setValue("c_kelompok", c_kelompok, { shouldValidate: !!errors.c_kelompok });
    }
  }, [c_kelompok]); // ponytail: kelompok selalu diturunkan dari gate; sync hanya saat nilainya beda.

  return (
    <>
      <Section title="Pilih kelompok / jenis formulir">
        <Field
          label="Jenis subjek"
          htmlFor="c_jenis_subjek"
          required
          hint={isExisting ? "Jenis subjek tidak dapat diubah setelah draf tersimpan." : undefined}
          error={errors.c_jenis_subjek?.message}
        >
          <Select
            id="c_jenis_subjek"
            invalid={!!errors.c_jenis_subjek}
            disabled={isExisting}
            {...register("c_jenis_subjek")}
          >
            {options(JENIS_SUBJEK)}
          </Select>
        </Field>
        {gates.map((gate) => (
          <Field key={gate.key} label={gate.label} htmlFor={gate.key} hint={gate.hint} required error={errors[gate.key]?.message} className="sm:col-span-2">
            <Select id={gate.key} invalid={!!errors[gate.key]} {...register(gate.key)}>
              {options(YA_TIDAK)}
            </Select>
          </Field>
        ))}
        {showHewan ? (
          <Field label="Jenis penelitian hewan" htmlFor="hwn_hidup_mati" required error={errors.hwn_hidup_mati?.message} className="sm:col-span-2">
            <Select id="hwn_hidup_mati" invalid={!!errors.hwn_hidup_mati} {...register("hwn_hidup_mati")}>
              <option value="">-- Pilih --</option>
              <option value="1">Hewan hidup (in-vivo)</option>
              <option value="2">BBT hewan (ex-vivo / arsip)</option>
            </Select>
          </Field>
        ) : null}
        {fokus ? (
          <Field label={FOKUS.label} htmlFor="fetik_fokus" className="sm:col-span-2">
            <Select id="fetik_fokus" {...register("fetik_fokus")}>
              <option value="">-- Pilih --</option>
              {options(Object.values(FOKUS.jenis))}
            </Select>
          </Field>
        ) : null}
        <Field label="Kelompok formulir etik" htmlFor="c_kelompok" required error={errors.c_kelompok?.message} className="sm:col-span-2">
          <input id="c_kelompok" type="hidden" {...register("c_kelompok")} />
          <p className="rounded-xl border border-line bg-canvas-deep/60 px-3.5 py-3 text-[15px] font-semibold text-ink">
            {KELOMPOK.find((o) => o.value === c_kelompok)?.label ??
              "Akan terisi otomatis dari jawaban di atas."}
          </p>
        </Field>
        {dokumen ? (
          <div className="rounded-xl border border-line bg-canvas-deep/60 p-4 sm:col-span-2">
            <p className="text-[13px] font-semibold text-ink">Dokumen-dokumen yang harus ada</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-[12.5px] text-ink-soft">
              {dokumen.map((item) => (
                <li key={item.label}>
                  {item.url ? (
                    <a
                      className="inline-flex items-center gap-1 text-brand hover:underline"
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.label}
                      <Download className="size-3.5 shrink-0" aria-hidden="true" />
                    </a>
                  ) : (
                    item.label
                  )}
                </li>
              ))}
            </ol>
            <p className="mt-2.5 text-[12px] text-ink-faint">
              Formulir dan persyaratan lengkap di{" "}
              <a
                className="text-brand hover:underline"
                href="https://kep.unpad.ac.id/layanan/persyaratan"
                target="_blank"
                rel="noopener noreferrer"
              >
                kep.unpad.ac.id/layanan/persyaratan
              </a>
            </p>
          </div>
        ) : null}
      </Section>

      <Section title="1. Informasi umum peneliti utama">
        <Field label="Nama peneliti utama" htmlFor="n_peneliti_u" required error={errors.n_peneliti_u?.message}>
          <Input id="n_peneliti_u" invalid={!!errors.n_peneliti_u} {...register("n_peneliti_u")} />
        </Field>
        <Field label="Keahlian / spesialisasi" htmlFor="n_keahlian" required error={errors.n_keahlian?.message}>
          <Input id="n_keahlian" invalid={!!errors.n_keahlian} {...register("n_keahlian")} />
        </Field>
        <Field label="Jabatan / kedudukan" htmlFor="n_kedudukan" required error={errors.n_kedudukan?.message}>
          <Input id="n_kedudukan" invalid={!!errors.n_kedudukan} {...register("n_kedudukan")} />
        </Field>
        <Field label="No HP peneliti utama" htmlFor="n_hp" required error={errors.n_hp?.message}>
          <Input id="n_hp" inputMode="tel" invalid={!!errors.n_hp} {...register("n_hp")} />
        </Field>
        <Field label="Telepon rumah" htmlFor="n_telp_rumah">
          <Input id="n_telp_rumah" inputMode="tel" {...register("n_telp_rumah")} />
        </Field>
        <Field label="Status civitas Unpad" htmlFor="civitas_unpad" required error={errors.civitas_unpad?.message}>
          <Select id="civitas_unpad" invalid={!!errors.civitas_unpad} {...register("civitas_unpad")}>
            {options(YA_TIDAK)}
          </Select>
        </Field>
      </Section>

      <Section title="Kontak person">
        <Field label="Nama kontak person" htmlFor="n_cp" required error={errors.n_cp?.message}>
          <Input id="n_cp" invalid={!!errors.n_cp} {...register("n_cp")} />
        </Field>
        <Field label="No HP kontak person" htmlFor="hp_cp" required error={errors.hp_cp?.message}>
          <Input id="hp_cp" inputMode="tel" invalid={!!errors.hp_cp} {...register("hp_cp")} />
        </Field>
        <Field label="Email kontak person" htmlFor="n_email" required error={errors.n_email?.message} className="sm:col-span-2">
          <Input id="n_email" type="email" invalid={!!errors.n_email} {...register("n_email")} />
        </Field>
      </Section>

      <Section title="Status & pendanaan">
        <Field label="Jenjang" htmlFor="c_jenjang" required error={errors.c_jenjang?.message}>
          <Select id="c_jenjang" invalid={!!errors.c_jenjang} {...register("c_jenjang")}>
            {options(JENJANG)}
          </Select>
        </Field>
        <Field label="Sumber dana" htmlFor="c_dana" required error={errors.c_dana?.message}>
          <Select id="c_dana" invalid={!!errors.c_dana} {...register("c_dana")}>
            {options(SUMBER_DANA)}
          </Select>
        </Field>
        {values.c_dana && values.c_dana !== "Mandiri" ? (
          <Field label="Detail sumber dana" htmlFor="s_dana" className="sm:col-span-2">
            <Input id="s_dana" {...register("s_dana")} />
          </Field>
        ) : null}
        <Field label="Peruntukan" htmlFor="c_peruntukan" required error={errors.c_peruntukan?.message}>
          <Select id="c_peruntukan" invalid={!!errors.c_peruntukan} {...register("c_peruntukan")}>
            {options(PERUNTUKAN)}
          </Select>
        </Field>
      </Section>

      <Section title="2. Instansi pengusul">
        <Field label="Asal instansi" htmlFor="n_institusi_pengusul" required error={errors.n_institusi_pengusul?.message} className="sm:col-span-2">
          <Input id="n_institusi_pengusul" invalid={!!errors.n_institusi_pengusul} {...register("n_institusi_pengusul")} />
        </Field>
        <Field label="Alamat instansi" htmlFor="n_alamat_pengusul" required error={errors.n_alamat_pengusul?.message} className="sm:col-span-2">
          <Input id="n_alamat_pengusul" invalid={!!errors.n_alamat_pengusul} {...register("n_alamat_pengusul")} />
        </Field>
        <Field label="Telepon / HP" htmlFor="hp_pengusul">
          <Input id="hp_pengusul" inputMode="tel" {...register("hp_pengusul")} />
        </Field>
        <Field label="Fax" htmlFor="fax_pengusul">
          <Input id="fax_pengusul" {...register("fax_pengusul")} />
        </Field>
        <Field label="Email instansi" htmlFor="n_email_pengusul" required error={errors.n_email_pengusul?.message} className="sm:col-span-2">
          <Input id="n_email_pengusul" type="email" invalid={!!errors.n_email_pengusul} {...register("n_email_pengusul")} />
        </Field>
      </Section>

      <Section title="Pembimbing / peneliti lain">
        <Field label="Apakah ada pembimbing atau peneliti lain?" htmlFor="c_peneliti_lain" required error={errors.c_peneliti_lain?.message} className="sm:col-span-2">
          <Select id="c_peneliti_lain" invalid={!!errors.c_peneliti_lain} {...register("c_peneliti_lain")}>
            {options(YA_TIDAK)}
          </Select>
        </Field>
        {values.c_peneliti_lain === "Y" ? (
          <DynamicRows
            control={control}
            register={register}
            name="pembimbing"
            addLabel="Tambah pembimbing"
            columns={[{ key: "n_nama", label: "Nama lengkap & gelar", placeholder: "Nama & gelar" }]}
          />
        ) : null}
      </Section>
    </>
  );
}

function Step2({ register, errors, values, control, recordId, onUpload, uploadingSlot, readOnly }) {
  const plainRingkasan = (values.ringkasan_penelitian ?? "").replace(/<[^>]*>/g, " ");
  const words = plainRingkasan.trim().split(/\s+/).filter(Boolean).length;
  const kerja = values.c_kerjasama === "2" || values.c_kerjasama === "3";

  return (
    <>
      <Section title="3. Informasi umum penelitian">
        <Field
          label="Judul penelitian"
          htmlFor="n_judul"
          required
          hint="Jangan gunakan tanda petik tunggal (')"
          error={errors.n_judul?.message}
          className="sm:col-span-2"
        >
          <Area id="n_judul" rows={3} invalid={!!errors.n_judul} {...register("n_judul")} />
        </Field>
        <Field label="Versi protokol" htmlFor="ver_pro" required error={errors.ver_pro?.message}>
          <Input id="ver_pro" invalid={!!errors.ver_pro} {...register("ver_pro")} />
        </Field>
        <Field label="Bidang ilmu" htmlFor="bidang_ilmu" required error={errors.bidang_ilmu?.message}>
          <Input id="bidang_ilmu" invalid={!!errors.bidang_ilmu} {...register("bidang_ilmu")} />
        </Field>
        <Field
          label="Ringkasan penelitian"
          htmlFor="ringkasan_penelitian"
          required
          hint={`${words} / 500 kata`}
          error={errors.ringkasan_penelitian?.message}
          className="sm:col-span-2"
        >
          {({ describedBy }) => (
            <Suspense fallback={<div className="min-h-[198px] rounded-xl border border-line bg-canvas" />}>
              <RichText
                control={control}
                name="ringkasan_penelitian"
                describedBy={describedBy}
                invalid={!!errors.ringkasan_penelitian}
                readOnly={readOnly}
              />
            </Suspense>
          )}
        </Field>
        <Field label="Tujuan penelitian" htmlFor="tujuan_penelitian" required error={errors.tujuan_penelitian?.message} className="sm:col-span-2">
          <Area id="tujuan_penelitian" rows={3} invalid={!!errors.tujuan_penelitian} {...register("tujuan_penelitian")} />
        </Field>
        <Field label="Jumlah partisipan" htmlFor="jum_partisipan" required error={errors.jum_partisipan?.message}>
          <Input id="jum_partisipan" invalid={!!errors.jum_partisipan} {...register("jum_partisipan")} />
        </Field>
      </Section>

      <Section title="4. Penelitian multisenter">
        <Field label="Apakah penelitian dilakukan di beberapa senter?" htmlFor="c_multisenter" required error={errors.c_multisenter?.message}>
          <Select id="c_multisenter" invalid={!!errors.c_multisenter} {...register("c_multisenter")}>
            {options(YA_TIDAK)}
          </Select>
        </Field>
        {values.c_multisenter === "Y" ? (
          <>
            <Field label="Senter utama (lembaga, kota, negara)" htmlFor="c_spu" required error={errors.c_spu?.message}>
              <Input id="c_spu" invalid={!!errors.c_spu} {...register("c_spu")} />
            </Field>
            <Field label="Senter satelit (lembaga, kota, negara)" htmlFor="c_sps" required error={errors.c_sps?.message}>
              <Input id="c_sps" invalid={!!errors.c_sps} {...register("c_sps")} />
            </Field>
          </>
        ) : null}
      </Section>

      <Section title="5. Kerjasama penelitian">
        <Field label="Status kerjasama" htmlFor="c_kerjasama" required error={errors.c_kerjasama?.message}>
          <Select id="c_kerjasama" invalid={!!errors.c_kerjasama} {...register("c_kerjasama")}>
            {options(KERJASAMA)}
          </Select>
        </Field>
        {kerja ? (
          <Field label="Jumlah negara" htmlFor="v_jum_negara">
            <Input id="v_jum_negara" {...register("v_jum_negara")} />
          </Field>
        ) : null}
        {kerja ? (
          <Field label="Melibatkan peneliti / institusi asing?" htmlFor="c_peneliti_asing_stat" className="sm:col-span-2">
            <Select id="c_peneliti_asing_stat" {...register("c_peneliti_asing_stat")}>
              {options(YA_TIDAK)}
            </Select>
          </Field>
        ) : null}
        {kerja ? (
          <div className="grid gap-3 sm:col-span-2">
            <FileField
              label="Izin peneliti asing (bila terlibat langsung di Indonesia)"
              name="file_izin_asing"
              value={values.file_izin_asing}
              recordId={recordId}
              onUpload={onUpload}
              uploading={uploadingSlot === "file_izin_asing"}
              readOnly={readOnly}
            />
            <FileField
              label="Draft MoU institusi"
              name="file_mou"
              value={values.file_mou}
              recordId={recordId}
              onUpload={onUpload}
              uploading={uploadingSlot === "file_mou"}
              readOnly={readOnly}
            />
            <FileField
              label="Draft MTA (bila material/data dibagikan ke luar negeri)"
              name="file_mta"
              value={values.file_mta}
              recordId={recordId}
              onUpload={onUpload}
              uploading={uploadingSlot === "file_mta"}
              readOnly={readOnly}
            />
          </div>
        ) : null}
      </Section>

      {values.c_peneliti_asing_stat === "Y" ? (
        <Section title="6. Ketua peneliti asing">
          <DynamicRows
            control={control}
            register={register}
            name="peneliti_asing"
            addLabel="Tambah peneliti asing"
            columns={[
              { key: "n_nama_asing", label: "Nama, gelar, institusi", placeholder: "Nama, gelar, institusi" },
              { key: "n_tugas_asing", label: "Tugas & fungsi", placeholder: "Tugas & fungsi" },
              { key: "n_kontak_asing", label: "Telp / email", placeholder: "Telp/Fax/HP/Email" },
            ]}
          />
        </Section>
      ) : null}
    </>
  );
}

function Step3({ register, errors, values, control, recordId, onUpload, uploadingSlot, readOnly }) {
  const butuhDokumenEtik = values.c_etik_lain === "Y";

  return (
    <>
      <Section title="7. Tempat dan alamat penelitian">
        <Field label="Tempat / wilayah penelitian" htmlFor="n_tempat_penelitian" required error={errors.n_tempat_penelitian?.message} className="sm:col-span-2">
          <Area id="n_tempat_penelitian" rows={3} invalid={!!errors.n_tempat_penelitian} {...register("n_tempat_penelitian")} />
        </Field>
      </Section>

      <Section title="8. Rencana waktu penelitian">
        <Field label="Mulai" htmlFor="d_awal" required error={errors.d_awal?.message}>
          <Input id="d_awal" type="date" invalid={!!errors.d_awal} {...register("d_awal")} />
        </Field>
        <Field label="Selesai" htmlFor="d_akhir" required error={errors.d_akhir?.message}>
          <Input id="d_akhir" type="date" invalid={!!errors.d_akhir} {...register("d_akhir")} />
        </Field>
      </Section>

      <Section title="9. Waktu mulai rekrutmen / skrining">
        <Field label="Tanggal mulai" htmlFor="d_rekrutmen" required error={errors.d_rekrutmen?.message}>
          <Input id="d_rekrutmen" type="date" invalid={!!errors.d_rekrutmen} {...register("d_rekrutmen")} />
        </Field>
      </Section>

      <Section title="10. Pengajuan ke komite etik lain">
        <Field label="Pernah diajukan ke komite etik lain?" htmlFor="c_etik_lain" required error={errors.c_etik_lain?.message}>
          <Select id="c_etik_lain" invalid={!!errors.c_etik_lain} {...register("c_etik_lain")}>
            {options(YA_TIDAK)}
          </Select>
        </Field>
        {butuhDokumenEtik ? (
          <>
            <Field label="Keputusan komite etik lain" htmlFor="c_status_etik_lain">
              <Select id="c_status_etik_lain" {...register("c_status_etik_lain")}>
                {options(STATUS_ETIK_LAIN)}
              </Select>
            </Field>
            <FileField
              label="Dokumen keputusan komite etik lain"
              name="file_etik_lain"
              value={values.file_etik_lain}
              recordId={recordId}
              onUpload={onUpload}
              uploading={uploadingSlot === "file_etik_lain"}
              readOnly={readOnly}
            />
          </>
        ) : null}
      </Section>

      <Section title="11. Alokasi dan rincian dana">
        <Field label="Rincian dana penelitian" htmlFor="s_rincian_dana" required error={errors.s_rincian_dana?.message} className="sm:col-span-2">
          {({ describedBy }) => (
            <Suspense fallback={<div className="min-h-[198px] rounded-xl border border-line bg-canvas" />}>
              <RichText
                control={control}
                name="s_rincian_dana"
                describedBy={describedBy}
                invalid={!!errors.s_rincian_dana}
                readOnly={readOnly}
              />
            </Suspense>
          )}
        </Field>
      </Section>

      <Section title="Conflict of interest">
        <Field label="Apakah tim peneliti memiliki CoI?" htmlFor="c_coi" required error={errors.c_coi?.message}>
          <Select id="c_coi" invalid={!!errors.c_coi} {...register("c_coi")}>
            {options(YA_TIDAK)}
          </Select>
        </Field>
        {values.c_coi === "Y" ? (
          <Field label="Uraikan siapa dan bentuk CoI-nya" htmlFor="u_coi" required error={errors.u_coi?.message} className="sm:col-span-2">
            <Area id="u_coi" rows={3} invalid={!!errors.u_coi} {...register("u_coi")} />
          </Field>
        ) : null}
      </Section>
    </>
  );
}

export function StepFields({ step, ...props }) {
  if (step === 0) return <Step1 {...props} />;
  if (step === 1) return <Step2 {...props} />;
  if (step === 2) return <Step3 {...props} />;
  return null;
}
