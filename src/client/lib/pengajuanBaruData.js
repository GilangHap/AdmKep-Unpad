// Opsi disalin dari tabel referensi DB (tr_kelompok, tr_jenjang, tr_metode, tr_status_protokol)
// dan dari nilai legacy di ref/PengajuanbaruController.php. Statis karena backend belum dipakai.
export const DRAFT_KEY = "kepadm.pengajuan-baru.draft";

export const YA_TIDAK = [
  { value: "", label: "-- Pilih --" },
  { value: "Y", label: "Ya" },
  { value: "N", label: "Tidak" },
];

export const JENIS_SUBJEK = [
  { value: "", label: "-- Pilih --" },
  {
    value: "1",
    label:
      "Manusia/data rekam medik/data registri/data publik/BBT/cell line/sisa spesimen biologis lainnya",
  },
  {
    value: "2",
    label:
      "Hewan bertulang belakang (termasuk jaringan/bahan biologis/BBT/sisa spesimen biologis lainnya/uji pada hewan hidup)",
  },
  { value: "3", label: "Mikroorganisme/ hewan tak bertulang belakang / cell line komersial" },
];

export const KELOMPOK = [
  { value: "", label: "-- Pilih kelompok --" },
  { value: "1", label: "FL/2.2.3 Formulir Etik Penelitian Non Uji Klinis" },
  { value: "2", label: "FL_2.2.2 Formulir Etik Penelitian Uji klinis" },
  { value: "3", label: "FL_2.2.6 Formulir Etik Penelitian Penggunaan dan Kesejahteraan Hewan" },
  { value: "4", label: "FL_2.2.5 Formulir Etik Penelitian Sosial Komunitas" },
  { value: "5", label: "FL_2.2.4 Formulir Penelitian BBT Riset Dasar" },
  { value: "6", label: "FL_2.2.7 Formulir Etik Penelitian Penggunaan BBT Hewan" },
  { value: "7", label: "FL/2.2.10 Lembar Informasi Laporan Kasus" },
];

// Daftar dokumen wajib per kelompok, disalin dari tampilan jenisformetik di legacy
// (ref/pengajuanbaru/pengajuanbarudata.phtml). Kelompok 5 punya dua varian.
// URL unduhan diambil dari https://kep.unpad.ac.id/layanan/persyaratan.
const FORM = "https://admkep.unpad.ac.id/format_dokumen/2026/Formulir_Etik/";
const FL_222 = FORM + "FL_2.2.2%20Formulir%20Etik%20Penelitian%20Uji%20klinis.docx";
const FL_223 =
  FORM +
  "FL_2.2.3%20Formulir%20Etik%20Penelitian%20Survei_Registri_Epidemiologi-Humaniora%20Dan%20Non%20klinis%20lainnya%20(Riset%20dasar,%20Riset%20Kesehatan%20Komunitas).docx";
const FL_224 = FORM + "FL_2.2.4%20Formulir%20Penelitian%20BBT%20Riset%20dasar.docx";
const FL_225 = FORM + "FL_2.2.5%20Formulir%20Etik%20Penelitian%20Sosial%20Komunitas.docx";
const FL_226 = FORM + "FL_2.2.6%20Formulir%20Etik%20Penelitian%20Penggunaan%20dan%20Kesejahteraan%20Hewan.docx";
const FL_227 = FORM + "FL_2.2.7%20Formulir%20Etik%20Penelitian%20Penggunaan%20BBT%20hewan.docx";
const FL_228 = FORM + "FL_2.2.8%20Formulir%20Etik%20Laporan%20Kasus_Serial%20Kasus%20Klinis.docx";
const CRF = "https://admkep.unpad.ac.id/format_dokumen/Contoh%20Lampiran%20Case%20Report%20Form%20(CRF).docx";

const HELSINKI = { label: "Lembar pernyataan Kepatuhan terhadap Deklarasi Helsinki" };
const BIODATA = { label: "Biodata Peneliti Utama dan Pembimbing/Peneliti Lain" };
const LEMBAR_INFORMASI = { label: "FL/2.2.9 Lembar Informasi" };

export const DOKUMEN_KELOMPOK = {
  1: [
    {
      label:
        "FL/2.2.3 Formulir Etik Penelitian Survei/Registri/Epidemiologi-Humaniora Dan Non klinis lainnya (Riset dasar, Riset Kesehatan Komunitas)",
      url: FL_223,
    },
    HELSINKI,
    LEMBAR_INFORMASI,
    BIODATA,
  ],
  2: [
    { label: "FL_2.2.2 Formulir Etik Penelitian Uji klinis", url: FL_222 },
    HELSINKI,
    LEMBAR_INFORMASI,
    BIODATA,
    { label: "Sertifikat GCP" },
    { label: "Lampiran Case Report Form (CRF)", url: CRF },
  ],
  3: [{ label: "FL_2.2.6 Formulir Etik Penelitian Penggunaan dan Kesejahteraan Hewan", url: FL_226 }, BIODATA],
  4: [
    { label: "FL_2.2.5 Formulir Etik Penelitian Sosial Komunitas", url: FL_225 },
    HELSINKI,
    LEMBAR_INFORMASI,
    BIODATA,
  ],
  5: [{ label: "FL_2.2.4 Formulir Penelitian BBT Riset Dasar", url: FL_224 }, HELSINKI, BIODATA],
  "5Y": [
    { label: "FL_2.2.4 Formulir Penelitian BBT Riset Dasar", url: FL_224 },
    HELSINKI,
    { ...LEMBAR_INFORMASI, label: `${LEMBAR_INFORMASI.label} (bila akan melakukan pengambilan consent ulang)` },
    BIODATA,
  ],
  6: [{ label: "FL_2.2.7 Formulir Etik Penelitian Penggunaan BBT Hewan", url: FL_227 }, BIODATA],
  7: [
    { label: "FL/2.2.8 Formulir Etik Laporan Kasus/Serial Kasus Klinis", url: FL_228 },
    HELSINKI,
    { label: "FL/2.2.10 Lembar Informasi Laporan Kasus" },
    BIODATA,
  ],
};

export function dokumenDariGate(v) {
  if (v.c_jenis_subjek === "1" && v.fetik_p1 === "Y") return DOKUMEN_KELOMPOK["5Y"];
  return null;
}


// taste-skill-ignore: kode jenjang adalah nilai DB legacy, bukan penomoran dekoratif.
export const JENJANG = [
  { value: "", label: "-- Pilih jenjang --" },
  { value: "01", label: "S-0 atau S-1 UNPAD" },
  { value: "02", label: "S-0 atau S-1 Non UNPAD" },
  { value: "03", label: "S-2 atau PPDS UNPAD" },
  { value: "04", label: "S-2 atau PPDS Non UNPAD" },
  { value: "05", label: "S-3 UNPAD" },
  { value: "06", label: "S-3 Non UNPAD" },
  { value: "07", label: "Kerjasama/Hibah/Mandiri UNPAD" },
  { value: "08", label: "Kerjasama/Hibah/Mandiri Non UNPAD" },
];

export const SUMBER_DANA = [
  { value: "", label: "-- Pilih --" },
  { value: "Mandiri", label: "Mandiri / Individu" },
  { value: "Hibah Internal", label: "Hibah Internal Institusi" },
  { value: "Hibah Nasional", label: "Hibah Nasional" },
  { value: "Hibah Internasional", label: "Hibah Internasional" },
  { value: "Swasta", label: "Swasta" },
];

export const PERUNTUKAN = [
  { value: "", label: "-- Pilih peruntukan --" },
  { value: "D", label: "Disertasi" },
  { value: "K", label: "Kerjasama" },
  { value: "H", label: "Hibah" },
  { value: "L", label: "Lainnya" },
  { value: "S", label: "Skripsi" },
  { value: "T", label: "Tesis" },
  { value: "P", label: "PKM (Program Kreativitas Mahasiswa)" },
];

export const KERJASAMA = [
  { value: "", label: "-- Pilih kerjasama --" },
  { value: "1", label: "Tidak bekerjasama dengan institusi luar" },
  { value: "2", label: "Kerjasama nasional" },
  { value: "3", label: "Kerjasama internasional" },
];

export const STATUS_ETIK_LAIN = [
  { value: "", label: "-- Pilih status --" },
  { value: "Diterima", label: "Diterima" },
  { value: "Ditolak", label: "Ditolak" },
];

// Fokus analisis muncul hanya saat subjek manusia & tidak ada intervensi; tiap nilai memetakan kelompok.
export const FOKUS = {
  label: "Apa fokus utama analisis penelitian Anda?",
  jenis: {
    2: { value: "2", label: "Kesehatan komunitas", kelompok: "1" },
    3: { value: "3", label: "Sosial komunitas", kelompok: "4" },
    4: { value: "4", label: "Riset kesehatan dasar", kelompok: "1" },
  },
};

export const GATE_STEPS = [
  {
    key: "fetik_p1",
    label:
      "Apakah penelitian dilakukan sepenuhnya di laboratorium menggunakan Bahan Biologis Tersimpan (BBT)?",
    hint: "Contoh: isolat DNA, serum sisa, atau blok parafin manusia tanpa kontak langsung dengan pasien.",
  },
  {
    key: "fetik_p1_tdk",
    label:
      "Apakah protokol ini laporan kasus unik/langka yang sudah terjadi (retrospektif) tanpa intervensi terencana?",
  },
  {
    key: "fetik_p1_tdk_tdk",
    label: "Apakah penelitian melibatkan intervensi aktif kepada subjek manusia?",
    hint: "Contoh: obat, herbal, vaksin, alat medis baru, prosedur terapi, atau intervensi psikologis.",
  },
];

export const EMPTY_PENGAJUAN = {
  c_jenis_subjek: "",
  c_kelompok: "",
  fetik_p1: "",
  fetik_p1_tdk: "",
  fetik_p1_tdk_tdk: "",
  fetik_fokus: "",
  hwn_hidup_mati: "",
  n_peneliti_u: "",
  n_keahlian: "",
  n_kedudukan: "",
  n_hp: "",
  n_telp_rumah: "",
  n_cp: "",
  hp_cp: "",
  n_email: "",
  civitas_unpad: "",
  c_jenjang: "",
  c_dana: "",
  s_dana: "",
  c_peruntukan: "",
  n_institusi_pengusul: "",
  n_alamat_pengusul: "",
  hp_pengusul: "",
  fax_pengusul: "",
  n_email_pengusul: "",
  c_peneliti_lain: "",
  pembimbing: [{ n_nama: "" }],
  n_judul: "",
  ver_pro: "00",
  bidang_ilmu: "",
  ringkasan_penelitian: "",
  tujuan_penelitian: "",
  jum_partisipan: "",
  c_multisenter: "",
  c_spu: "",
  c_sps: "",
  c_kerjasama: "",
  v_jum_negara: "",
  c_peneliti_asing_stat: "",
  file_izin_asing: "",
  file_mou: "",
  file_mta: "",
  peneliti_asing: [{ n_nama_asing: "", n_tugas_asing: "", n_kontak_asing: "" }],
  n_tempat_penelitian: "",
  d_awal: "",
  d_akhir: "",
  d_rekrutmen: "",
  c_etik_lain: "",
  c_status_etik_lain: "",
  file_etik_lain: "",
  s_rincian_dana: "",
  c_coi: "",
  u_coi: "",
};
