import { useEffect } from "react";
import { useWatch } from "react-hook-form";
import { Field, Input, Select } from "@/components/ui/FormControl";
import { DynamicRows } from "@/components/pengajuan-baru/DynamicTable";
import {
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
} from "@/lib/pengajuanBaruData";
import { kelompokDariGate } from "@/lib/pengajuanBaruSchema";

// Alur gate legacy: tiap jawaban membuka pertanyaan berikutnya dan menetapkan kelompok formulir.
function gateFlow(c_jenis_subjek, fetik_p1, fetik_p1_tdk, fetik_p1_tdk_tdk) {
  if (c_jenis_subjek === "1") {
    if (fetik_p1 === "Y") return { gates: ["fetik_p1"], fokus: false, c_kelompok: "5" };
    if (fetik_p1 === "N") {
      if (fetik_p1_tdk === "Y") return { gates: ["fetik_p1", "fetik_p1_tdk"], fokus: false, c_kelompok: "7" };
      if (fetik_p1_tdk === "N") {
        if (fetik_p1_tdk_tdk === "Y") return { gates: ["fetik_p1", "fetik_p1_tdk", "fetik_p1_tdk_tdk"], fokus: false, c_kelompok: "2" };
        if (fetik_p1_tdk_tdk === "N") return { gates: ["fetik_p1", "fetik_p1_tdk", "fetik_p1_tdk_tdk"], fokus: true, c_kelompok: "" };
      }
      return { gates: ["fetik_p1", "fetik_p1_tdk"], fokus: false, c_kelompok: "" };
    }
    return { gates: ["fetik_p1"], fokus: false, c_kelompok: "" };
  }
  if (c_jenis_subjek === "3") return { gates: [], fokus: false, c_kelompok: "5" };
  return { gates: [], fokus: false, c_kelompok: "" };
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

function Step1({ register, errors, control, setValue }) {
  const values = useWatch({ control }) ?? {};
  const showHewan = values.c_jenis_subjek === "2";
  const flow = gateFlow(values.c_jenis_subjek, values.fetik_p1, values.fetik_p1_tdk, values.fetik_p1_tdk_tdk);
  const gates = GATE_STEPS.filter((g) => flow.gates.includes(g.key));
  const fokus = flow.fokus && values.fetik_fokus ? FOKUS.jenis[values.fetik_fokus] : null;
  const c_kelompok =
    kelompokDariGate(values) ||
    (values.c_jenis_subjek === "2" && values.hwn_hidup_mati === "1" ? "3" : "") ||
    (values.c_jenis_subjek === "2" && values.hwn_hidup_mati === "2" ? "6" : "") ||
    flow.c_kelompok;

  useEffect(() => {
    if (values.c_kelompok !== c_kelompok) {
      setValue("c_kelompok", c_kelompok, { shouldValidate: !!errors.c_kelompok });
    }
  }, [c_kelompok]); // ponytail: kelompok selalu diturunkan dari gate; sync hanya saat nilainya beda.

  return (
    <>
      <Section title="Pilih kelompok / jenis formulir">
        <Field label="Jenis subjek" htmlFor="c_jenis_subjek" required error={errors.c_jenis_subjek?.message}>
          <Select id="c_jenis_subjek" invalid={!!errors.c_jenis_subjek} {...register("c_jenis_subjek")}>
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
              {options(FOKUS.list)}
            </Select>
          </Field>
        ) : null}
        {values.c_kelompok ? (
          <Field label="Kelompok formulir etik" htmlFor="c_kelompok" required error={errors.c_kelompok?.message} className="sm:col-span-2">
            <Select id="c_kelompok" invalid={!!errors.c_kelompok} {...register("c_kelompok")}>
              {options(KELOMPOK)}
            </Select>
          </Field>
        ) : (
          <p className="rounded-xl border border-dashed border-control bg-canvas p-4 text-[12.5px] text-ink-soft sm:col-span-2">
            Kelompok formulir etik dipilih otomatis dari jawaban di atas.
          </p>
        )}
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

function Step2({ register, errors, values, control }) {
  const words = (values.ringkasan_penelitian ?? "").trim().split(/\s+/).filter(Boolean).length;
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
          <Area id="ringkasan_penelitian" rows={6} invalid={!!errors.ringkasan_penelitian} {...register("ringkasan_penelitian")} />
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
            <Field label="Senter utama (lembaga, kota, negara)" htmlFor="c_spu">
              <Input id="c_spu" {...register("c_spu")} />
            </Field>
            <Field label="Senter satelit (lembaga, kota, negara)" htmlFor="c_sps">
              <Input id="c_sps" {...register("c_sps")} />
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
          <div className="rounded-xl border border-dashed border-control bg-canvas p-4 sm:col-span-2">
            <p className="text-[13px] font-semibold text-ink">Lampiran kerjasama</p>
            <p className="mt-1 text-[12.5px] text-ink-soft">
              Unggah dokumen diaktifkan saat backend tersambung.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                ["Izin peneliti asing", "file_izin_asing"],
                ["Draft MoU", "file_mou"],
                ["Draft MTA", "file_mta"],
              ].map(([label, id]) => (
                <label key={id} htmlFor={id} className="block text-[12.5px] text-ink-soft">
                  {label}
                  <input id={id} type="file" disabled className="mt-1 block w-full text-[12px] disabled:opacity-60" />
                </label>
              ))}
            </div>
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

function Step3({ register, errors, values }) {
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
            <div className="rounded-xl border border-dashed border-control bg-canvas p-4 text-[12.5px] text-ink-soft sm:col-span-2">
              Unggah dokumen keputusan diaktifkan saat backend tersambung.
            </div>
          </>
        ) : null}
      </Section>

      <Section title="11. Alokasi dan rincian dana">
        <Field label="Rincian dana penelitian" htmlFor="s_rincian_dana" required error={errors.s_rincian_dana?.message} className="sm:col-span-2">
          <Area id="s_rincian_dana" rows={6} invalid={!!errors.s_rincian_dana} {...register("s_rincian_dana")} />
        </Field>
      </Section>

      <Section title="Conflict of interest">
        <Field label="Apakah tim peneliti memiliki CoI?" htmlFor="c_coi" required error={errors.c_coi?.message}>
          <Select id="c_coi" invalid={!!errors.c_coi} {...register("c_coi")}>
            {options(YA_TIDAK)}
          </Select>
        </Field>
        {values.c_coi === "Y" ? (
          <Field label="Uraikan siapa dan bentuk CoI-nya" htmlFor="u_coi" className="sm:col-span-2">
            <Area id="u_coi" rows={3} {...register("u_coi")} />
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
