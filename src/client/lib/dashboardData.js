// Sample data shaped like the real admkep records (registration codes, form types,
// statuses and the committee's per-category case officers). Replace with the API later.

export const NAV_ITEMS = [
  { to: "/app/biodata", label: "Biodata" },
  { to: "/app/pengajuan-baru", label: "Pengajuan Baru" },
  { to: "/app/pengajuan-perbaikan", label: "Pengajuan Perbaikan" },
  { to: "/app/pengajuan-amandemen", label: "Pengajuan Amandemen" },
  { to: "/app/laporan-akhir", label: "Laporan Akhir" },
  { to: "/app/perpanjangan", label: "Perpanjangan" },
  { to: "/app/ktd-sae", label: "KTD-SAE" },
];

export const STATUS = {
  DRAFT: { label: "Draf", tone: "neutral" },
  SUBMITTED: { label: "Menunggu verifikasi", tone: "info" },
  IN_REVIEW: { label: "Dalam telaah", tone: "warning" },
  REVISION: { label: "Perlu perbaikan", tone: "danger" },
  APPROVED: { label: "Disetujui", tone: "positive" },
};

export const ACTIVE_SUBMISSION = {
  code: "2206030773",
  title:
    "Hubungan Pengetahuan dan Perilaku Sanitasi Lingkungan dengan Kejadian Stunting pada Balita",
  type: "Subjek manusia",
  form: "FL_2.2.6",
  updatedAt: "2026-11-01T09:20:00+07:00",
  steps: [
    { key: "data", label: "Data pengajuan", done: true },
    { key: "biodata", label: "Biodata & pembimbing", done: true },
    { key: "bcd", label: "Poin B-D", done: true },
    { key: "e", label: "Poin E", done: false },
    { key: "dokumen", label: "Upload dokumen", done: false },
    { key: "kirim", label: "Kirim & verifikasi", done: false },
  ],
};

export const SUBMISSIONS = [
  {
    code: "2206030773",
    title:
      "Hubungan Pengetahuan dan Perilaku Sanitasi Lingkungan dengan Kejadian Stunting pada Balita",
    type: "Subjek manusia",
    updatedAt: "2026-11-01",
    status: "DRAFT",
    action: "Lanjutkan",
  },
  {
    code: "2206021145",
    title: "Uji Efektivitas Ekstrak Daun Sirih terhadap Penyembuhan Luka Insisi Tikus Wistar",
    type: "Hewan coba",
    updatedAt: "2026-10-22",
    status: "REVISION",
    action: "Perbaiki",
  },
  {
    code: "2206018874",
    title: "Laporan Kasus: Tatalaksana Diabetes Melitus Tipe 2 dengan Komplikasi Nefropati",
    type: "Laporan kasus",
    updatedAt: "2026-10-09",
    status: "IN_REVIEW",
    action: "Lihat",
  },
  {
    code: "2206016642",
    title: "Gambaran Kualitas Hidup Pasien Hemodialisis di RSUP Dr. Hasan Sadikin Bandung",
    type: "Subjek manusia",
    updatedAt: "2026-09-18",
    status: "APPROVED",
    action: "Lihat",
  },
  {
    code: "2206013097",
    title: "Survei Perilaku Cuci Tangan Tenaga Kesehatan di Puskesmas Kota Bandung",
    type: "Subjek manusia",
    updatedAt: "2026-08-30",
    status: "APPROVED",
    action: "Lihat",
  },
];

export const CONTACTS = [
  {
    name: "Ibu Novi Rohyanti",
    scope: "Pengajuan baru data primer mahasiswa (S1, S2, S3)",
    phone: "0812-6626-6418",
    wa: "https://wa.me/6281266266418",
  },
  {
    name: "Pak Diya Kusbini",
    scope: "Data sekunder, hewan coba, laporan akhir, reset kata sandi",
    phone: "0822-9503-5418",
    wa: "https://wa.me/6282295035418",
  },
  {
    name: "Ibu Lilik Supriatin",
    scope: "Data primer non-mahasiswa, uji klinik, perbaikan, amandemen, KTD-SAE",
    phone: "0852-2047-2509",
    wa: "https://wa.me/6285220472509",
  },
];

/** Counts are computed from the rows, never typed twice. */
export const COUNTS = SUBMISSIONS.reduce(
  (acc, row) => {
    acc.total += 1;
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  },
  { total: 0 },
);

export const ACTIVE_STEP_DONE = ACTIVE_SUBMISSION.steps.filter((s) => s.done).length;
export const ACTIVE_STEP_TOTAL = ACTIVE_SUBMISSION.steps.length;

const needsWork = (COUNTS.DRAFT ?? 0) + (COUNTS.REVISION ?? 0);

export const HEADLINE_FINDING =
  needsWork > 0
    ? `${needsWork} pengajuan masih perlu tindakan Anda.`
    : "Semua pengajuan Anda sudah berjalan.";

export const SAMPLE_NOTES =
  "Data contoh: nama, nomor registrasi, dan status di file ini perlu diganti data nyata sebelum dipakai.";
