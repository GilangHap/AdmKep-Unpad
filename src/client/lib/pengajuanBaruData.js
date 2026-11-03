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
  { value: "1", label: "Subjek manusia" },
  { value: "2", label: "Hewan" },
  { value: "3", label: "Mikroorganisme / cell line / BBT" },
];

export const KELOMPOK = [
  { value: "", label: "-- Pilih kelompok --" },
  { value: "1", label: "FL_2.2.3 Non klinis / survei / epidemiologi" },
  { value: "2", label: "FL_2.2.2 Uji klinis" },
  { value: "3", label: "FL_2.2.6 Penggunaan & kesejahteraan hewan" },
  { value: "4", label: "FL_2.2.5 Sosial komunitas" },
  { value: "5", label: "FL_2.2.4 BBT riset dasar" },
  { value: "6", label: "FL_2.2.7 BBT hewan" },
  { value: "7", label: "FL_2.2.8 Laporan kasus / serial kasus" },
];


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
  ver_pro: "",
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
  peneliti_asing: [{ n_nama_asing: "", n_tugas_asing: "", n_kontak_asing: "" }],
  n_tempat_penelitian: "",
  d_awal: "",
  d_akhir: "",
  d_rekrutmen: "",
  c_etik_lain: "",
  c_status_etik_lain: "",
  s_rincian_dana: "",
  c_coi: "",
  u_coi: "",
};
