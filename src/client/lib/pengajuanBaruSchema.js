import { z } from "zod";

const required = (label) => z.string().trim().min(1, `${label} wajib diisi`);

// Kelompok formulir diturunkan dari jawaban gate, mengikuti alur legacy (PengajuanbaruController).
export function kelompokDariGate(v) {
  if (v.c_jenis_subjek === "2") return v.hwn_hidup_mati === "1" ? "3" : v.hwn_hidup_mati === "2" ? "6" : "";
  if (v.c_jenis_subjek === "3") return "5";
  if (v.c_jenis_subjek !== "1") return "";
  if (v.fetik_p1 === "Y") return "5";
  if (v.fetik_p1 !== "N") return "";
  if (v.fetik_p1_tdk === "Y") return "7";
  if (v.fetik_p1_tdk !== "N") return "";
  if (v.fetik_p1_tdk_tdk === "Y") return "2";
  if (v.fetik_p1_tdk_tdk === "N") return v.fetik_fokus ? "1" : "";
  return "";
}
const phone = z
  .string()
  .trim()
  .min(1, "Nomor HP wajib diisi")
  .regex(/^(\+62|62|0)8[1-9][0-9]{6,11}$/, "Nomor HP tidak valid (contoh: 08123456789)");
const email = z.string().trim().min(1, "Email wajib diisi").email("Format email tidak valid");

const step1 = z.object({
  c_jenis_subjek: required("Jenis subjek"),
  c_kelompok: required("Kelompok formulir"),
  hwn_hidup_mati: z.string().trim().default(""),
  fetik_fokus: z.string().trim().default(""),
  n_peneliti_u: required("Nama peneliti utama"),
  n_keahlian: required("Keahlian"),
  n_kedudukan: required("Jabatan"),
  n_hp: phone,
  n_cp: required("Nama kontak person"),
  hp_cp: phone,
  n_email: email,
  civitas_unpad: required("Status civitas Unpad"),
  c_jenjang: required("Jenjang"),
  c_dana: required("Sumber dana"),
  c_peruntukan: required("Peruntukan"),
  n_institusi_pengusul: required("Asal instansi"),
  n_alamat_pengusul: required("Alamat instansi"),
  n_email_pengusul: email,
});

const step2 = z.object({
  c_peneliti_lain: required("Status pembimbing"),
  n_judul: z
    .string()
    .trim()
    .min(1, "Judul penelitian wajib diisi")
    .max(950, "Judul maksimal 950 karakter")
    .refine((v) => !v.includes("'"), "Jangan gunakan tanda petik tunggal (')"),
  ver_pro: required("Versi protokol"),
  bidang_ilmu: required("Bidang ilmu"),
  ringkasan_penelitian: z
    .string()
    .trim()
    .min(1, "Ringkasan penelitian wajib diisi")
    .refine((v) => v.trim().split(/\s+/).length <= 500, "Ringkasan maksimal 500 kata"),
  tujuan_penelitian: required("Tujuan penelitian"),
  jum_partisipan: required("Jumlah partisipan"),
  c_multisenter: required("Status multisenter"),
  c_kerjasama: required("Status kerjasama"),
});

const step3 = z.object({
  n_tempat_penelitian: required("Tempat penelitian"),
  d_awal: required("Tanggal mulai"),
  d_akhir: required("Tanggal selesai"),
  d_rekrutmen: required("Tanggal rekrutmen"),
  c_etik_lain: required("Status pengajuan ke komite etik lain"),
  s_rincian_dana: required("Rincian dana"),
  c_coi: required("Status conflict of interest"),
});

export const stepSchemas = [step1, step2, step3];

export const STEP_FIELDS = [
  [
    "c_jenis_subjek",
    "c_kelompok",
    "n_peneliti_u",
    "n_keahlian",
    "n_kedudukan",
    "n_hp",
    "n_cp",
    "hp_cp",
    "n_email",
    "civitas_unpad",
    "c_jenjang",
    "c_dana",
    "c_peruntukan",
    "n_institusi_pengusul",
    "n_alamat_pengusul",
    "n_email_pengusul",
  ],
  [
    "c_peneliti_lain",
    "n_judul",
    "ver_pro",
    "bidang_ilmu",
    "ringkasan_penelitian",
    "tujuan_penelitian",
    "jum_partisipan",
    "c_multisenter",
    "c_kerjasama",
  ],
  [
    "n_tempat_penelitian",
    "d_awal",
    "d_akhir",
    "d_rekrutmen",
    "c_etik_lain",
    "s_rincian_dana",
    "c_coi",
  ],
];

export const STEP_LABELS = ["Jenis & identitas", "Penelitian", "Pelaksanaan & dana"];

export const allSchema = step1.merge(step2).merge(step3);
