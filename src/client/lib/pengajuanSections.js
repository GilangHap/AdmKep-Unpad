// Field definitions for the sub-forms that legacy keeps outside the main
// wizard (Isian Poin B/C/D, Lembar Informasi, Biodata, Poin E). Labels and
// option values follow ref/pengajuanbaru/*.phtml and the legacy columns.

const opt = (pairs) => pairs.map(([value, label]) => ({ value, label }));
const T = (name, label, extra = {}) => ({ name, label, type: "text", ...extra });
const TA = (name, label, extra = {}) => ({ name, label, type: "textarea", ...extra });
const NUM = (name, label, extra = {}) => ({ name, label, type: "number", ...extra });
const DATE = (name, label, extra = {}) => ({ name, label, type: "date", ...extra });
const R = (name, label, options, extra = {}) => ({
  name,
  label,
  type: "radio",
  options: opt(options),
  ...extra,
});
const CB = (name, label, options, extra = {}) => ({
  name,
  label,
  type: "checkbox",
  options: opt(options),
  ...extra,
});
const SEL = (name, label, options, extra = {}) => ({
  name,
  label,
  type: "select",
  options: opt(options),
  ...extra,
});

const YA_TIDAK = [["Y", "Ya"], ["T", "Tidak"]];
const YA_TIDAK_LEGACY = [["YA", "Ya"], ["TIDAK", "Tidak"]];
const YA_TIDAK_NA = [["Y", "Ya"], ["T", "Tidak"], ["NA", "Not Available"]];

// ---------------------------------------------------------------- Poin B
const B_METODE = [
  {
    key: "b_metode",
    label: "B.1. Metode Penelitian",
    fields: [
      TA("u_alasan_motivasi", "Alasan / motivasi dilakukannya penelitian", { required: true }),
      TA("u_data_terdahulu", "Data penelitian terdahulu sebagai penunjang perumusan masalah", {
        hint: "Dapat lebih dari 1 jurnal",
      }),
      TA("u_tujuan_penelitian", "Tujuan penelitian", { required: true }),
      TA("u_jumlah_sampel_calc", "Jumlah partisipan/subjek & perhitungan besar sampel"),
      TA("u_manfaat_penelitian", "Manfaat penelitian", { required: true }),
      TA("u_risiko_mitigasi", "Risiko yang mungkin timbul & cara mengatasinya", { required: true }),
      TA("u_cara_pilih_partisipan", "Cara memilih partisipan penelitian", { required: true }),
      TA("u_kriteria_inklusi", "Kriteria inklusi", { required: true }),
      TA("u_kriteria_eksklusi", "Kriteria eksklusi", { required: true }),
      TA("u_kriteria_dropout", "Kriteria drop out", { hint: "Bila ada" }),
      CB(
        "c_rancangan",
        "Rancangan penelitian",
        [
          ["OBS_EKSPLORATIF", "Observasi - Eksploratif"],
          ["OBS_KUALITATIF", "Observasi - Kualitatif/Etnografis"],
          ["OBS_PARTICIPATORY", "Observasi - Participatory"],
          ["OBS_LAIN", "Observasi - Lain-lain"],
          ["DESK_STUDI_KASUS", "Deskriptif - Studi kasus"],
          ["DESK_SERI_KASUS", "Deskriptif - Seri kasus"],
          ["DESK_POTONG_LINTANG", "Deskriptif - Potong lintang"],
          ["DESK_REGISTRI", "Deskriptif - Registri"],
          ["DESK_LAIN", "Deskriptif - Lain-lain"],
          ["ANALITIK_KORELASI", "Analitik - Korelasi"],
          ["ANALITIK_KASUS_KONTROL", "Analitik - Kasus kontrol"],
          ["ANALITIK_KOHORT", "Analitik - Kohort"],
          ["ANALITIK_LAIN", "Analitik - Lain-lain"],
          ["INT_SEMU", "Intervensi - Eksperimental semu"],
          ["INT_MURNI", "Intervensi - Eksperimental murni"],
          ["INT_LAIN", "Intervensi - Lain-lain"],
          ["TRI_ONE_PHASED", "Mixed - A one-phased"],
          ["TRI_CONVERGENCE", "Mixed - Convergence"],
          ["TRI_DATA_TRANSFORM", "Mixed - Data transformation"],
          ["TRI_VALID_QUAN_DATA", "Mixed - Validating quan data"],
          ["TRI_MULTILEVEL", "Mixed - Multilevel"],
          ["TRI_LAIN", "Mixed - Lain-lain"],
          ["EMB_EKSPERIMENTAL", "Embedded - Eksperimental"],
          ["EMB_CORRELATIONAL", "Embedded - Correlational"],
          ["EMB_LAIN", "Embedded - Lain-lain"],
          ["EXPLAN_QUAN_EMPH", "Explanatory - Quan emphasized"],
          ["EXPLAN_QUAL_EMPH", "Explanatory - Qual emphasized"],
          ["EXPLAN_LAIN", "Explanatory - Lain-lain"],
          ["EXPLOR_INST_DEV", "Exploratory - Instrument development"],
          ["EXPLOR_TAXO_DEV", "Exploratory - Taxonomy development"],
          ["EXPLOR_LAIN", "Exploratory - Lain-lain"],
          ["99", "Lain-lain (sebutkan)"],
        ],
        { required: true },
      ),
      T("u_rancangan_lain", "Rancangan lain-lain (sebutkan)", {
        showIf: { field: "c_rancangan", includes: "99" },
      }),
      TA("u_uraian_rancangan", "Uraikan secara singkat"),
      CB(
        "c_unit_sampel",
        "Unit sampel",
        [
          ["INDIVIDU", "Individu"],
          ["MASYARAKAT", "Masyarakat / komunitas"],
          ["INSTITUSI", "Institusi (lampirkan draft surat permohonan izin)"],
          ["BBT_LINKED", "BBT Linked"],
          ["BBT_UNLINKED", "BBT Unlinked"],
          ["CELL_PRIMER", "Cell line primer"],
          ["CELL_KOMERSIAL", "Cell line komersial"],
          ["DATA_PUBLIK", "Data publik"],
          ["DATA_MEDREC", "Medical record"],
          ["DATA_REGISTER", "Registry institusi / registri nasional"],
          ["LAINNYA", "Lainnya"],
        ],
        { required: true },
      ),
      T("u_cell_komersial", "Nama & produsen cell line komersial", {
        showIf: { field: "c_unit_sampel", includes: "CELL_KOMERSIAL" },
      }),
      T("u_unit_sampel_lain", "Unit sampel lainnya", {
        showIf: { field: "c_unit_sampel", includes: "LAINNYA" },
      }),
      R(
        "c_penetapan_sampel",
        "Cara penetapan besar sampel",
        [
          ["BESARAN_MASALAH", "Berdasarkan besaran masalah & presisi perkiraannya"],
          ["KEBUTUHAN_MINIMAL", "Berdasarkan jumlah kebutuhan minimal dalam kegiatannya"],
          ["PARTICIPANT_OBS", "Participant observation"],
          ["INDEPTH_INTERVIEW", "Indepth interview"],
          ["TOTAL_POPULASI", "Berdasarkan total populasi (sensus)"],
          ["LAINNYA", "Lainnya (sertakan justifikasi)"],
          ["TANPA_SAMPEL", "Penelitian ini tidak memerlukan penetapan besar sampel"],
        ],
        { required: true },
      ),
      T("u_penetapan_lain", "Sebutkan & justifikasi", {
        showIf: { field: "c_penetapan_sampel", is: "LAINNYA" },
      }),
      T("u_alasan_tanpa_sampel", "Alasan tidak memerlukan penetapan besar sampel", {
        showIf: { field: "c_penetapan_sampel", is: "TANPA_SAMPEL" },
      }),
      R(
        "c_sampel_probability",
        "a. Probability sampling",
        [
          ["ACAK_SEDERHANA", "Acak sederhana"],
          ["ACAK_SISTEMATIK", "Acak sistematik"],
          ["ACAK_BERTINGKAT", "Acak bertingkat"],
        ],
      ),
      T("u_prob_lain", "Probability sampling lainnya"),
      R(
        "c_sampel_nonprob",
        "b. Non-probability sampling",
        [
          ["PURPOSIVE", "Purposive samples"],
          ["QUOTA", "Quota samples"],
          ["SNOWBALL", "Snow ball"],
          ["CONSECUTIVE", "Consecutive samples"],
        ],
      ),
      T("u_nonprob_lain", "Non-probability sampling lainnya"),
      CB("c_jenis_data", "Jenis data", [["PRIMER", "Data primer"], ["SEKUNDER", "Data sekunder"]], {
        required: true,
      }),
      R("c_primer_stat", "Status subjek data primer", [["RENTAN", "Rentan"], ["TIDAK_RENTAN", "Tidak rentan"]],
        { showIf: { field: "c_jenis_data", includes: "PRIMER" } }),
      CB(
        "c_subjek_rentan",
        "Subjek rentan",
        [
          ["ANAK", "Usia anak < 12 tahun"],
          ["NARAPIDANA", "Narapidana"],
          ["KOGNITIF", "Gangguan fungsi kognitif / tidak sadar"],
          ["HAMIL", "Ibu hamil"],
          ["TNI_POLRI", "TNI dan kepolisian"],
          ["LAINNYA", "Lainnya"],
        ],
        { showIf: { field: "c_primer_stat", is: "RENTAN" } },
      ),
      T("n_rentan_lainnya", "Subjek rentan lainnya", {
        showIf: { field: "c_subjek_rentan", includes: "LAINNYA" },
      }),
      TA("s_upaya_perlindungan", "Upaya melindungi hak partisipan rentan", {
        showIf: { field: "c_primer_stat", is: "RENTAN" },
      }),
      T("u_sumber_data_sekunder", "Bentuk & sumber data sekunder", {
        showIf: { field: "c_jenis_data", includes: "SEKUNDER" },
      }),
      CB(
        "c_pengumpulan_data",
        "Cara pengumpulan data",
        [
          ["FISIK", "Pemeriksaan fisik"],
          ["LAB", "Pemeriksaan laboratorium"],
          ["WAWANCARA", "Wawancara"],
          ["KUESIONER", "Kuesioner / angket"],
          ["PENGAMATAN", "Pengamatan (observasi)"],
          ["DOKUMEN", "Penelusuran dokumen"],
          ["BBT_CELL", "BBT / cell line primer"],
        ],
      ),
      TA("u_bbt_tujuan", "Tujuan protokol primer & kesesuaian cakupan spesimen", {
        showIf: { field: "c_pengumpulan_data", includes: "BBT_CELL" },
      }),
      TA("u_bbt_prosedur_awal", "Prosedur pengumpulan BBT di awal", {
        showIf: { field: "c_pengumpulan_data", includes: "BBT_CELL" },
      }),
      TA("u_bbt_fisibilitas", "Fisibilitas persetujuan ulang", {
        showIf: { field: "c_pengumpulan_data", includes: "BBT_CELL" },
      }),
      T("u_pengumpulan_lain", "Cara pengumpulan lainnya"),
      TA("u_etik_respect", "Respect for person (menghormati harkat & martabat manusia)", {
        required: true,
      }),
      TA("u_etik_beneficence", "Beneficence & non-maleficence (bermanfaat & tidak merugikan)", {
        required: true,
      }),
      TA("u_etik_justice", "Justice (keadilan)", { required: true }),
    ],
  },
];

const B_UJI_KLINIS = [
  {
    key: "b_uji_klinis_awal",
    label: "B. Metode Penelitian (Uji Klinis)",
    fields: [
      DATE("d_gcp_s", "Tanggal awal sertifikat GCP peneliti utama", { required: true }),
      DATE("d_gcp_e", "Tanggal akhir sertifikat GCP peneliti utama", { required: true }),
      T("pj_medis", "Penanggung jawab medis (dokter/dokter gigi)", { required: true }),
      T("pj_monitoring", "Clinical monitor (di luar tim peneliti, bersertifikat GCP)", {
        required: true,
      }),
      TA("u_alasan_motivasi", "Alasan/motivasi dilakukannya penelitian", { required: true }),
      TA("u_manfaat_penelitian", "Manfaat penelitian", { required: true }),
      CB(
        "c_metode_ujiklinis",
        "Metode penelitian",
        [
          ["RANDOMISASI", "Randomisasi"],
          ["OPEN_LABELED", "Open labeled"],
          ["SINGLE_BLIND", "Single blind"],
          ["DOUBLE_BLIND", "Double blind"],
          ["PLASEBO", "Plasebo"],
          ["TREATMENT_CONTROLLED", "Treatment controlled"],
          ["CROSS_OVER", "Cross-over"],
          ["PARALEL", "Paralel"],
          ["LAINNYA", "Lain-lain"],
        ],
        { required: true },
      ),
      T("u_metode_lain", "Metode lainnya", {
        showIf: { field: "c_metode_ujiklinis", includes: "LAINNYA" },
      }),
      CB(
        "c_bahan_ip",
        "Bahan uji klinik (IP)",
        [
          ["IND", "Obat baru (IND)"],
          ["OBAT_EDAR", "Obat berizin edar di Indonesia"],
          ["VAKSIN", "Vaksin"],
          ["NUTRASETIKAL", "Nutrasetikal"],
          ["KOSMETIK", "Kosmetik"],
          ["HERBAL", "Herbal"],
          ["INE", "Peralatan medis baru (INE)"],
          ["INE_EDAR", "Peralatan medis berizin edar"],
          ["METODE_BARU", "Metode atau teknik baru lain"],
        ],
        { required: true },
      ),
      R("c_status_ip", "Investigational product (IP)", [["TIDAK_ADA", "Tidak ada"], ["ADA", "Ada"]], {
        required: true,
      }),
      R("c_ip_jenis", "Jenis IP", [["IND", "IND"], ["INE", "INE"]], {
        showIf: { field: "c_status_ip", is: "ADA" },
      }),
      T("n_ind_noreg_pom", "No. Reg. POM (IND)", { showIf: { field: "c_ip_jenis", is: "IND" } }),
      T("n_ind_nama", "Nama (IND)", { showIf: { field: "c_ip_jenis", is: "IND" } }),
      T("n_ind_sponsor", "Sponsor (IND)", { showIf: { field: "c_ip_jenis", is: "IND" } }),
      T("n_ine_noreg_pom", "No. Reg. POM (INE)", { showIf: { field: "c_ip_jenis", is: "INE" } }),
      T("n_ine_nama", "Nama (INE)", { showIf: { field: "c_ip_jenis", is: "INE" } }),
      T("n_ine_sponsor", "Sponsor (INE)", { showIf: { field: "c_ip_jenis", is: "INE" } }),
      R("c_ijin_dinkes", "Izin Dinkes", [["ADA", "Ada (lampirkan)"], ["TIDAK", "Tidak"]], {
        showIf: { field: "c_status_ip", is: "ADA" },
      }),
      R("c_rekayasa_genetik", "Produk rekayasa genetik", [["TIDAK", "Tidak"], ["YA", "Ya, sudah ditelaah"]], {
        required: true,
      }),
      CB("c_rekayasa_komite", "Komite telaah teknis", [
        ["RDNA", "Recombinant DNA Advisory Committee"],
        ["BIOSAFETY", "Biosafety Committee"],
      ], { showIf: { field: "c_rekayasa_genetik", is: "YA" } }),
    ],
  },
  {
    key: "b_uji_klinis_ip",
    label: "6. Data Bahan Uji Klinis (IP)",
    fields: [
      T("n_ip_uji_generik", "a. Nama generik - IP yang diuji"),
      T("n_ip_pendamping_generik", "a. Nama generik - IP pendamping"),
      T("n_ip_uji_dagang", "b. Nama dagang - IP yang diuji"),
      T("n_ip_pendamping_dagang", "b. Nama dagang - IP pendamping"),
      T("n_ip_uji_kimia", "c. Nama kimia - IP yang diuji"),
      T("n_ip_pendamping_kimia", "c. Nama kimia - IP pendamping"),
      T("n_ip_uji_farma", "d. Kelas farmakologi - IP yang diuji"),
      T("n_ip_pendamping_farma", "d. Kelas farmakologi - IP pendamping"),
      T("n_ip_uji_sediaan", "e. Bentuk sediaan & kekuatan - IP yang diuji"),
      T("n_ip_pendamping_sediaan", "e. Bentuk sediaan & kekuatan - IP pendamping"),
      T("n_ip_uji_kemasan", "f. Kemasan - IP yang diuji", { required: true }),
      T("n_ip_pendamping_kemasan", "f. Kemasan - IP pendamping", { required: true }),
      T("n_ip_uji_pemberian", "g. Cara pemberian - IP yang diuji", { required: true }),
      T("n_ip_pendamping_pemberian", "g. Cara pemberian - IP pendamping", { required: true }),
      DATE("d_ip_uji_exp", "h. Tanggal kedaluwarsa - IP yang diuji", { required: true }),
      DATE("d_ip_pendamping_exp", "h. Tanggal kedaluwarsa - IP pendamping", { required: true }),
      T("n_ip_uji_batch", "i. Nomor batch - IP yang diuji", { required: true }),
      T("n_ip_pendamping_batch", "i. Nomor batch - IP pendamping", { required: true }),
      T("u_ip_uji_coa", "j. Sertifikat analisis - IP yang diuji", { required: true }),
      T("u_ip_pendamping_coa", "j. Sertifikat analisis - IP pendamping", { required: true }),
      T("u_ip_uji_cpob", "k. Sertifikat CPOB - IP yang diuji"),
      T("u_ip_pendamping_cpob", "k. Sertifikat CPOB - IP pendamping"),
      T("n_ip_uji_impor", "l. Jenis & jumlah IP diimpor - IP yang diuji"),
      T("n_ip_pendamping_impor", "l. Jenis & jumlah IP diimpor - IP pendamping"),
      TA("n_ip_uji_produsen", "m. Nama & alamat produsen - IP yang diuji"),
      TA("n_ip_pendamping_produsen", "m. Nama & alamat produsen - IP pendamping"),
      TA("n_ip_uji_importir", "n. Nama & alamat importir - IP yang diuji"),
      TA("n_ip_pendamping_importir", "n. Nama & alamat importir - IP pendamping"),
      TA("u_ip_uji_status_luar", "o. Status peredaran di negara lain - IP yang diuji"),
      TA("u_ip_pendamping_status_luar", "o. Status peredaran di negara lain - IP pendamping"),
      R("c_fase_ujiklinis", "p. Fase uji klinis", [
        ["FASE_1", "Fase I"],
        ["FASE_2", "Fase II"],
        ["FASE_3", "Fase III"],
      ], { required: true }),
    ],
  },
  {
    key: "b_uji_klinis_pelaksanaan",
    label: "7–9. Partisipan & Uji Terdahulu",
    fields: [
      CB(
        "c_cara_dapat_partisipan",
        "Cara mendapatkan partisipan",
        [
          ["KONTAK_PERSON", "Kontak perorangan"],
          ["DATA_DASAR", "Data dasar dari penelitian lain"],
          ["RUJUKAN", "Rujukan"],
          ["IKLAN", "Iklan (lampirkan)"],
          ["LAINNYA", "Lainnya"],
        ],
        { required: true },
      ),
      T("u_cara_dapat_lain", "Cara mendapatkan lainnya", {
        showIf: { field: "c_cara_dapat_partisipan", includes: "LAINNYA" },
      }),
      R("c_praklinik_efikasi_stat", "a. Uji praklinik efikasi (farmakodinamik)?", YA_TIDAK_LEGACY, {
        required: true,
      }),
      T("u_praklinik_efikasi_ref", "a. Referensi (nama, judul, jurnal)", {
        showIf: { field: "c_praklinik_efikasi_stat", is: "YA" },
      }),
      SEL("c_praklinik_efikasi_jenis", "a. Status penelitian", [
        ["INTERNAL", "Riset tim peneliti (internal)"],
        ["EKSTERNAL", "Riset peneliti lain (eksternal)"],
      ], { showIf: { field: "c_praklinik_efikasi_stat", is: "YA" } }),
      TA("u_praklinik_efikasi_resume", "a. Resume hasil", {
        showIf: { field: "c_praklinik_efikasi_stat", is: "YA" },
      }),
      R("c_praklinik_safety_stat", "b. Uji praklinik keamanan (safety)?", YA_TIDAK_LEGACY, { required: true }),
      T("u_praklinik_safety_ref", "b. Referensi", {
        showIf: { field: "c_praklinik_safety_stat", is: "YA" },
      }),
      SEL("c_praklinik_safety_jenis", "b. Status penelitian", [
        ["INTERNAL", "Riset tim peneliti (internal)"],
        ["EKSTERNAL", "Riset peneliti lain (eksternal)"],
      ], { showIf: { field: "c_praklinik_safety_stat", is: "YA" } }),
      TA("u_praklinik_safety_resume", "b. Resume hasil", {
        showIf: { field: "c_praklinik_safety_stat", is: "YA" },
      }),
      R("c_klinik_efikasi_stat", "c. Uji klinik efikasi?", YA_TIDAK_LEGACY, { required: true }),
      T("u_klinik_efikasi_ref", "c. Referensi", { showIf: { field: "c_klinik_efikasi_stat", is: "YA" } }),
      SEL("c_klinik_efikasi_jenis", "c. Status penelitian", [
        ["INTERNAL", "Riset tim peneliti (internal)"],
        ["EKSTERNAL", "Riset peneliti lain (eksternal)"],
      ], { showIf: { field: "c_klinik_efikasi_stat", is: "YA" } }),
      TA("u_klinik_efikasi_resume", "c. Resume hasil", {
        showIf: { field: "c_klinik_efikasi_stat", is: "YA" },
      }),
      R("c_klinik_safety_stat", "d. Uji klinik keamanan?", YA_TIDAK_LEGACY, { required: true }),
      T("u_klinik_safety_ref", "d. Referensi", { showIf: { field: "c_klinik_safety_stat", is: "YA" } }),
      SEL("c_klinik_safety_jenis", "d. Status penelitian", [
        ["INTERNAL", "Riset tim peneliti (internal)"],
        ["EKSTERNAL", "Riset peneliti lain (eksternal)"],
      ], { showIf: { field: "c_klinik_safety_stat", is: "YA" } }),
      TA("u_klinik_safety_resume", "d. Resume hasil", {
        showIf: { field: "c_klinik_safety_stat", is: "YA" },
      }),
      R("c_bahan_sama_stat", "e. Uji dengan bahan yang sama?", YA_TIDAK_LEGACY, { required: true }),
      T("u_bahan_sama_ref", "e. Referensi", { showIf: { field: "c_bahan_sama_stat", is: "YA" } }),
      SEL("c_bahan_sama_jenis", "e. Status penelitian", [
        ["INTERNAL", "Riset tim peneliti (internal)"],
        ["EKSTERNAL", "Riset peneliti lain (eksternal)"],
      ], { showIf: { field: "c_bahan_sama_stat", is: "YA" } }),
      TA("u_bahan_sama_resume", "e. Resume hasil", { showIf: { field: "c_bahan_sama_stat", is: "YA" } }),
      NUM("e_jumlah_partisipan", "Jumlah partisipan (orang)", { required: true }),
      TA("u_justifikasi_jumlah", "Justifikasi jumlah partisipan", { required: true }),
      R("c_partisipan_rentan_stat", "Jenis partisipan", [["RENTAN", "Rentan"], ["TIDAK_RENTAN", "Tidak rentan"]], {
        required: true,
      }),
      CB("c_subjek_rentan", "Jenis partisipan rentan", [
        ["ANAK", "Usia anak < 12 tahun"],
        ["NARAPIDANA", "Narapidana"],
        ["KOGNITIF", "Gangguan fungsi kognitif / tidak sadar"],
        ["HAMIL", "Ibu hamil"],
        ["TNI_POLRI", "TNI dan kepolisian"],
        ["LAINNYA", "Lainnya"],
      ], { showIf: { field: "c_partisipan_rentan_stat", is: "RENTAN" } }),
      T("n_rentan_lainnya", "Partisipan rentan lainnya", {
        showIf: { field: "c_subjek_rentan", includes: "LAINNYA" },
      }),
      TA("s_upaya_perlindungan", "Upaya perlindungan partisipan rentan", {
        showIf: { field: "c_partisipan_rentan_stat", is: "RENTAN" },
      }),
      TA("u_kriteria_inklusi", "Kriteria inklusi", { required: true }),
      TA("u_kriteria_eksklusi", "Kriteria eksklusi", { required: true }),
      TA("u_kriteria_dropout", "Kriteria drop out", { required: true }),
    ],
  },
  {
    key: "b_uji_klinis_proses",
    label: "10–12. Proses, Adverse Event, Pembiayaan",
    fields: [
      TA("u_proses_rekrutmen", "a. Proses rekrutmen (termasuk pemeriksaan laboratorium)", {
        required: true,
      }),
      TA("u_pemberian_intervensi", "b. Pemberian intervensi (regimen, tindakan, pembanding, plasebo)", {
        required: true,
      }),
      TA("u_indikator_outcome", "c. Penetapan indikator outcome", { required: true }),
      TA("u_instrumen_penelitian", "d. Instrumen penelitian (CRF, hasil lab, kuesioner)", {
        required: true,
      }),
      TA("u_interim_analisis", "e. Rencana interim analisis", { required: true }),
      TA("u_prosedur_penghentian", "f. Prosedur penghentian uji klinis", { required: true }),
      T("n_perkiraan_waktu", "g. Perkiraan waktu per partisipan per tindakan", { required: true }),
      TA("u_etik_respect", "h. Respect for person", { required: true }),
      TA("u_etik_beneficence", "h. Beneficence", { required: true }),
      TA("u_etik_nonmaleficence", "h. Non-maleficence", { required: true }),
      TA("u_etik_justice", "h. Justice", { required: true }),
      TA("u_tanggung_jawab_pasca", "i. Tanggung jawab peneliti pasca penelitian", { required: true }),
      TA("u_ae_pencatatan", "a. Pencatatan adverse event", { required: true }),
      TA("u_ae_analisis", "b. Analisis & prosedur tindakan", { required: true }),
      TA("u_ae_emergency", "c. Emergency rescue system", { required: true }),
      TA("u_ae_penghentian", "d. Penghentian partisipan akibat adverse event", { required: true }),
      R("c_biaya_efek_samping", "Biaya efek samping jadi tanggung jawab penelitian?", YA_TIDAK_LEGACY, {
        required: true,
      }),
      TA("u_biaya_efek_samping_detail", "Ruang lingkup penanggungan biaya efek samping", {
        showIf: { field: "c_biaya_efek_samping", is: "YA" },
      }),
      R("c_partisipan_asuransi", "Partisipan diasuransikan?", YA_TIDAK_LEGACY, { required: true }),
      T("n_lembaga_asuransi", "Lembaga asuransi", { showIf: { field: "c_partisipan_asuransi", is: "YA" } }),
      T("n_durasi_asuransi", "Durasi asuransi", { showIf: { field: "c_partisipan_asuransi", is: "YA" } }),
      R("c_spesimen_luar_negeri", "Spesimen biologis dikirim ke luar negeri?", YA_TIDAK_LEGACY, {
        required: true,
      }),
      T("n_negara_tujuan_mta", "Negara tujuan", {
        showIf: { field: "c_spesimen_luar_negeri", is: "YA" },
      }),
    ],
  },
];

const B_HEWAN = [
  {
    key: "b_hewan",
    label: "B. Metode Penelitian Penggunaan Hewan",
    fields: [
      TA("u_alasan_hewan_lit", "Alasan/motivasi penelitian", { required: true }),
      TA("u_ref_hewan_lit", "Referensi literatur (nama, judul, hasil)", { required: true }),
      TA("u_manfaat_hewan", "Manfaat penelitian", { required: true }),
      TA("u_risiko_cara_atasi", "Risiko yang mungkin timbul & cara mengatasinya", { required: true }),
      CB("c_jenis_desain", "Jenis dan desain penelitian", [
        ["STUDI_EKSPERIMEN", "Studi eksperimen"],
        ["DESAIN_PARALEL", "Desain paralel"],
        ["DESAIN_MENSILANG", "Desain menyilang / cross-over"],
        ["LAINNYA", "Lain-lain"],
      ], { required: true }),
      T("u_desain_lain", "Desain lainnya", { showIf: { field: "c_jenis_desain", includes: "LAINNYA" } }),
      R("c_bbt_stat", "Menggunakan BBT hewan?", [["TIDAK", "Tidak"], ["YA", "Ya"]], {
        locked: true,
        default: "TIDAK",
      }),
      R("c_bbt_cell_line", "Cell line", [
        ["PRIMER", "Cell line primer"],
        ["KOMERSIAL", "Cell line komersial"],
        ["TIDAK_ADA", "Tidak menggunakan"],
      ], { locked: true, default: "TIDAK_ADA" }),
      R("c_bahas_ahli_stat", "Pembahasan dengan penanggung jawab / ahli hewan percobaan", YA_TIDAK_LEGACY, {
        required: true,
      }),
      TA("u_rekomendasi_kpph", "Uraian rekomendasi KPPH", {
        showIf: { field: "c_bahas_ahli_stat", is: "YA" },
      }),
      {
        name: "n_file_kpph",
        type: "file",
        label: "File rekomendasi KPPH (PDF/DOCX)",
        showIf: { field: "c_bahas_ahli_stat", is: "YA" },
      },
      T("n_spesies", "Spesies hewan", { required: true }),
      T("n_umur", "Umur"),
      T("n_strain", "Strain/galur"),
      T("n_berat_badan", "Berat badan"),
      R("c_jenis_kelamin", "Jenis kelamin", [
        ["JANTAN", "Jantan"],
        ["BETINA", "Betina"],
        ["CAMPURAN", "Campuran"],
      ]),
      NUM("e_jumlah_hewan", "Jumlah ekor", { required: true }),
      TA("u_justifikasi_jumlah", "Justifikasi jumlah hewan", { required: true }),
      T("n_asal_hewan", "Asal / diperoleh dari", { required: true }),
      TA("u_kriteria_inklusi", "Kriteria inklusi", { required: true }),
      TA("u_kriteria_eksklusi", "Kriteria eksklusi", { required: true }),
      TA("u_pelihara_sebelum", "Pemeliharaan hewan coba - sebelum intervensi"),
      TA("u_pelihara_selama", "Pemeliharaan hewan coba - selama intervensi"),
      TA("u_pelihara_setelah", "Pemeliharaan hewan coba - setelah intervensi"),
      R("c_musnah_stat", "Ada hewan yang dimusnahkan setelah penelitian?", YA_TIDAK_LEGACY, { required: true }),
      TA("u_musnah_alasan", "Alasan pemusnahan", {
        showIf: { field: "c_musnah_stat", is: "YA" },
        required: true,
      }),
      TA("u_musnah_cara", "Cara hewan coba dimusnahkan / sacrificed"),
      T("n_anestesi_nama_1", "Obat penenang - nama 1"),
      T("n_anestesi_dosis_1", "Obat penenang - dosis 1"),
      T("n_anestesi_nama_2", "Obat penenang - nama 2"),
      T("n_anestesi_dosis_2", "Obat penenang - dosis 2"),
      T("n_obat_lain_nama_1", "Obat lain - nama 1"),
      T("n_obat_lain_dosis_1", "Obat lain - dosis 1"),
      T("n_obat_lain_nama_2", "Obat lain - nama 2"),
      T("n_obat_lain_dosis_2", "Obat lain - dosis 2"),
      R("c_klasifikasi_hewan", "Klasifikasi pemanfaatan hewan coba", [
        ["KLAS_1", "Kelas 1 - invertebrata, tumbuhan, bakteri, amuba"],
        ["KLAS_2", "Kelas 2 - vertebrata, nyaris tanpa ketidaknyamanan"],
        ["KLAS_3", "Kelas 3 - vertebrata, stres/nyeri singkat"],
        ["KLAS_4", "Kelas 4 - vertebrata, stres/nyeri tak terhindarkan"],
        ["KLAS_5", "Kelas 5 - vertebrata, nyeri di atas toleransi tanpa anestesi"],
      ], { required: true }),
    ],
  },
];

const B_BBT_HEWAN = [
  {
    key: "b_bbt_hewan",
    label: "B. Penelitian Pemanfaatan BBT Hewan",
    fields: [
      TA("u_alasan_hewan_lit", "Alasan/motivasi penelitian", { required: true }),
      TA("u_ref_hewan_lit", "Referensi literatur", { required: true }),
      TA("u_manfaat_hewan", "Manfaat penelitian", { required: true }),
      TA("u_risiko_cara_atasi", "Risiko & cara mengatasinya", { required: true }),
      CB("c_jenis_desain", "Jenis dan desain penelitian", [
        ["STUDI_EKSPERIMEN", "Studi eksperimen"],
        ["DESAIN_PARALEL", "Desain paralel"],
        ["DESAIN_MENSILANG", "Desain menyilang / cross-over"],
        ["LAINNYA", "Lain-lain"],
      ], { required: true }),
      T("u_desain_lain", "Desain lainnya", { showIf: { field: "c_jenis_desain", includes: "LAINNYA" } }),
      R("c_bbt_stat", "Menggunakan BBT hewan?", [["TIDAK", "Tidak"], ["YA", "Ya"]], { required: true }),
      T("u_bbt_detail", "Sebutkan BBT hewan", { showIf: { field: "c_bbt_stat", is: "YA" }, required: true }),
      CB("c_bbt_sumber", "Sumber BBT hewan", [
        ["ARCHIVED", "Spesimen arsip penelitian sebelumnya"],
        ["LEFTOVER", "Spesimen pemeriksaan klinis (left over)"],
        ["LAINNYA", "Lainnya"],
      ], { showIf: { field: "c_bbt_stat", is: "YA" }, required: true }),
      TA("u_bbt_sumber_lain", "Sumber BBT lainnya", {
        showIf: { field: "c_bbt_sumber", includes: "LAINNYA" },
      }),
      R("c_bbt_cell_line", "Cell line", [
        ["PRIMER", "Cell line primer"],
        ["KOMERSIAL", "Cell line komersial"],
        ["TIDAK_ADA", "Tidak menggunakan"],
      ]),
      TA("u_simpan_bbt", "Kondisi penyimpanan BBT", { required: true }),
      T("u_simpan_bbt_lab", "Nama laboratorium penyimpanan", { required: true }),
      T("u_simpan_bbt_lab_pj", "Penanggung jawab laboratorium", { required: true }),
      TA("u_kriteria_inklusi", "Kriteria inklusi", { required: true }),
      TA("u_kriteria_eksklusi", "Kriteria eksklusi", { required: true }),
      TA("u_justifikasi_jumlah", "Perhitungan jumlah sampel / justifikasi", { required: true }),
    ],
  },
  {
    key: "b_bbt_hewan_primer",
    label: "C. Penelitian Awal (Primer) Sumber BBT Hewan",
    fields: [
      TA("u_tujuan_hewan_lit_primer", "Tujuan penelitian pemanfaatan hewan coba", { required: true }),
      CB("c_jenis_desain_primer", "Jenis dan desain penelitian primer", [
        ["STUDI_EKSPERIMEN", "Studi eksperimen"],
        ["DESAIN_PARALEL", "Desain paralel"],
        ["DESAIN_MENSILANG", "Desain menyilang / cross-over"],
        ["LAINNYA", "Lain-lain"],
      ], { required: true }),
      T("u_desain_lain_primer", "Desain primer lainnya", {
        showIf: { field: "c_jenis_desain_primer", includes: "LAINNYA" },
      }),
      T("n_spesies_primer", "Spesies hewan", { required: true }),
      T("n_umur_primer", "Umur"),
      T("n_strain_primer", "Strain/galur"),
      T("n_berat_badan_primer", "Berat badan"),
      R("c_jenis_kelamin_primer", "Jenis kelamin", [
        ["JANTAN", "Jantan"],
        ["BETINA", "Betina"],
        ["CAMPURAN", "Campuran"],
      ]),
      NUM("e_jumlah_hewan_primer", "Jumlah ekor", { required: true }),
      T("n_asal_hewan_primer", "Asal / diperoleh dari", { required: true }),
      CB("c_kumpul_data_stat_primer", "Cara pengumpulan data", [
        ["LAB", "Pemeriksaan laboratorium"],
        ["BBT_PRIMER", "BBT / cell line primer"],
        ["LAINNYA", "Lain-lain"],
      ], { required: true }),
      TA("u_tujuan_bbt_primer", "Tujuan protokol primer & kesesuaian cakupan spesimen", {
        showIf: { field: "c_kumpul_data_stat_primer", includes: "BBT_PRIMER" },
        required: true,
      }),
      TA("u_prosedur_kumpul_bbt_awal_primer", "Prosedur pengumpulan BBT di awal", {
        showIf: { field: "c_kumpul_data_stat_primer", includes: "BBT_PRIMER" },
        required: true,
      }),
      TA("u_kumpul_data_lain_primer", "Pengumpulan data lainnya", {
        showIf: { field: "c_kumpul_data_stat_primer", includes: "LAINNYA" },
      }),
    ],
  },
];

const RINGKASAN_ROW = [
  TA("u_profil", "Profil", { required: true }),
  NUM("e_usia", "Usia (tahun)", { required: true }),
  SEL("c_jk", "Jenis kelamin", [["L", "Laki-laki"], ["P", "Perempuan"]], { required: true }),
  TA("u_anamnesis", "Anamnesis", { required: true }),
  TA("u_pemeriksaan_fisik", "Pemeriksaan fisik", { required: true }),
  TA("u_pemeriksaan_penunjang", "Pemeriksaan penunjang", { required: true }),
  TA("u_diagnosis", "Diagnosis", { required: true }),
  TA("u_tatalaksana", "Tatalaksana", { required: true }),
];

const B_LAP_KASUS = [
  {
    key: "b_lap_kasus",
    label: "B. Metode Laporan Kasus",
    fields: [
      R("c_lap_kasus", "Jenis laporan kasus", [
        ["PARTISIPAN_TUNGGAL", "Partisipan tunggal"],
        ["PARTISIPAN_JAMAK", "Partisipan jamak (lebih dari 1)"],
      ], { required: true }),
      TA("u_alasan_motivasi", "Alasan/motivasi dilakukannya laporan kasus", { required: true }),
      {
        name: "json_ringkasan_kasus",
        label: "Ringkasan kasus",
        type: "repeater",
        rows: RINGKASAN_ROW,
        itemLabel: "Kasus",
        hint: "Minimal 1 partisipan.",
      },
      TA("u_etik_respect", "Respect for person (menghormati harkat & martabat manusia)", {
        required: true,
      }),
      TA("u_etik_beneficence", "Beneficence & non-maleficence (bermanfaat & tidak merugikan)", {
        required: true,
      }),
      TA("u_etik_justice", "Justice (keadilan)", { required: true }),
    ],
  },
  {
    key: "c_lap_kasus_psp",
    label: "C. Proses Mendapatkan PSP / Informed Consent",
    fields: [
      CB("c_psp_penerima", "Kepada siapa PSP dijelaskan?", [
        ["INDIVIDU", "Individu"],
        ["WALI", "Wali (bila anak/individu dewasa yang tidak mampu mengambil keputusan)"],
      ], { required: true }),
      T("n_psp_penjelas", "Siapa yang memberikan penjelasan", { required: true }),
      R("c_psp_waktu", "Kapan akan dijelaskan", [
        ["SAAT_PEMERIKSAAN", "Saat pemeriksaan rutin RS"],
        ["SETELAH_PENGOBATAN", "Setelah selesai pengobatan"],
      ], { required: true }),
      R("c_psp_waktu_cukup", "Partisipan diberi waktu cukup?", YA_TIDAK, { required: true }),
      T("n_psp_tempat", "Tempat memberikan penjelasan", { required: true }),
      T("n_psp_penandatangan", "Siapa yang menandatangani PSP", { required: true }),
      T("n_psp_saksi", "Siapa yang menyaksikan penandatanganan PSP", { required: true }),
      R("c_risiko_norma", "Bertentangan dengan norma/adat setempat?", YA_TIDAK, { required: true }),
      R("c_risiko_kerugian", "Menimbulkan kerugian ekonomi/stigmatisasi?", YA_TIDAK, { required: true }),
      R("c_rahasia_gambar", "Menampilkan gambar/data kasus terkait identitas?", YA_TIDAK, { required: true }),
      R("c_rahasia_nyaman", "Potensi ketidaknyamanan kasus pada identitas pasien?", YA_TIDAK, { required: true }),
      CB(
        "c_biaya_pengobatan",
        "Biaya pengobatan efek samping",
        [["ASURANSI", "Asuransi"], ["PARTIAL_FUNDING", "Partial Funding"], ["LAINNYA", "Lain-lain"]],
        { required: true },
      ),
      T("n_biaya_lainnya", "Biaya lainnya"),
      R("c_hubungan_tim", "Hubungan ketua peneliti dengan partisipan", [
        ["DPJP", "DPJP"],
        ["LAINNYA", "Lainnya"],
      ], { required: true }),
      T("n_hubungan_lainnya", "Hubungan lainnya"),
    ],
  },
  {
    key: "d_lap_kasus_rahasia",
    label: "D. Kerahasiaan Partisipan",
    fields: [
      R("c_narasi_nama", "Kerahasiaan nama partisipan", YA_TIDAK, { required: true }),
      R("c_narasi_judul", "Kerahasiaan judul", YA_TIDAK, { required: true }),
      R("c_narasi_gambar", "Kerahasiaan gambar", YA_TIDAK, { required: true }),
      R("c_narasi_dpjp", "Kerahasiaan DPJP", YA_TIDAK, { required: true }),
      R("c_rahasia_partisipan", "Keterangan kerahasiaan partisipan", YA_TIDAK, { required: true }),
      R("c_rahasia_spesimen", "Keterangan kerahasiaan spesimen", YA_TIDAK, { required: true }),
      R("c_rahasia_data", "Keterangan kerahasiaan data", YA_TIDAK, { required: true }),
      TA("u_kontak_person", "Kontak person bagi responden", { required: true }),
    ],
  },
];

// ---------------------------------------------------------------- Poin C
const C_PSP = [
  {
    key: "c_psp",
    label: "C. Proses Mendapatkan Persetujuan Setelah Penjelasan (PSP) / Informed Consent",
    fields: [
      R("c_psp_kepada", "Kepada siapa PSP dijelaskan?", [
        ["INDIVIDU", "Individu"],
        ["KELOMPOK", "Kelompok"],
        ["WALI", "Wali"],
        ["PERWAKILAN", "Perwakilan kelompok"],
        ["LAINNYA", "Lainnya"],
        ["NOT_APPLICABLE", "Not applicable"],
      ], { required: true }),
      T("u_psp_kepada_lain", "Sebutkan lainnya", {
        showIf: { field: "c_psp_kepada", is: "LAINNYA" },
        required: true,
      }),
      T("u_psp_not_app_alasan", "Alasan not applicable", {
        showIf: { field: "c_psp_kepada", is: "NOT_APPLICABLE" },
        required: true,
      }),
      TA("u_cara_reconsent", "Bagaimana cara peneliti melakukan reconsent", { required: true }),
      T("u_pemberi_penjelasan", "a. Siapa yang memberikan penjelasan", { required: true }),
      T("u_waktu_penjelasan", "b. Kapan akan dijelaskan", { required: true }),
      R("c_waktu_cukup", "c. Partisipan diberi waktu cukup?", YA_TIDAK, { required: true }),
      T("u_tempat_penjelasan", "d. Tempat memberikan penjelasan", { required: true }),
      T("u_penandatangan_psp", "e. Siapa yang menandatangani PSP", { required: true }),
      T("u_saksi_psp", "f. Siapa yang menyaksikan penandatanganan PSP", { required: true }),
      R("c_risiko_layanan_rutin", "1. Mengganggu kegiatan pelayanan kesehatan rutin", YA_TIDAK, {
        required: true,
      }),
      R("c_risiko_efek_samping", "2. Menimbulkan efek samping terhadap partisipan", YA_TIDAK, {
        required: true,
      }),
      R("c_risiko_norma_adat", "3. Bertentangan dengan norma/adat istiadat setempat", YA_TIDAK, {
        required: true,
      }),
      R("c_risiko_rugi_ekonomi", "4. Kerugian ekonomi, stigmatisasi partisipan", YA_TIDAK, {
        required: true,
      }),
      R("c_manfaat_tambah_ilmu", "1. Bertambahnya pengetahuan baru", YA_TIDAK, { required: true }),
      R("c_manfaat_layanan_sehat", "2. Mendapatkan pelayanan kesehatan", YA_TIDAK, { required: true }),
      TA("u_manfaat_layanan_sehat_detail", "Uraian manfaat langsung partisipan", {
        showIf: { field: "c_manfaat_layanan_sehat", is: "Y" },
        required: true,
      }),
      R("c_manfaat_insentif", "3. Insentif", [
        ["UANG", "Uang tunai"],
        ["BARANG", "Barang / cenderamata"],
        ["TIDAK", "Tidak ada"],
      ], { required: true }),
      R("c_manfaat_kompensasi", "4. Kompensasi", [
        ["ASURANSI", "Asuransi"],
        ["UANG", "Uang tunai"],
        ["TIDAK", "Tidak"],
        ["LAINNYA", "Lain-lain"],
      ], { required: true }),
      TA("u_tanpa_insentif_alasan", "Alasan bila tidak ada insentif/kompensasi", {
        showIf: [
          { field: "c_manfaat_insentif", is: "TIDAK" },
          { field: "c_manfaat_kompensasi", is: "TIDAK" },
        ],
        required: true,
      }),
      R("c_coercion_hubungan", "Hubungan ketua peneliti dengan partisipan", [["T", "Tidak ada"], ["Y", "Ada"]], {
        required: true,
      }),
      R("c_coercion_jenis", "Jenis hubungan", [
        ["DOKTER_PASIEN", "Dokter – pasien"],
        ["DOSEN_MAHASISWA", "Guru/dosen – murid/mahasiswa"],
        ["ATASAN_BAWAHAN", "Atasan – bawahan"],
        ["LAINNYA", "Lain-lain"],
      ], { showIf: { field: "c_coercion_hubungan", is: "Y" }, required: true }),
      TA("u_coercion_upaya", "Upaya peneliti memperkecil coercion", {
        showIf: { field: "c_coercion_hubungan", is: "Y" },
        required: true,
      }),
      TA("u_pemeriksaan_orang_sehat", "Pemeriksaan bila memakai orang sehat"),
      TA("u_diagnosis_orang_sakit", "Cara diagnosis & dokter penanggung jawab"),
    ],
  },
];

// ---------------------------------------------------------------- Poin D
const D_RECONSENT = [
  {
    key: "d_isi_penjelasan",
    label: "D. Isi Penjelasan / Informasi ke Partisipan",
    fields: [
      R("c_ringkasan", "a. Keterangan ringkasan penelitian", YA_TIDAK, { required: true }),
      R("c_perlakuan", "b. Perlakuan yang diterapkan pada partisipan", YA_TIDAK_NA, { required: true }),
      R("c_manfaat", "c. Manfaat untuk partisipan", YA_TIDAK_NA, { required: true }),
      R("c_bahaya", "d. Bahaya potensial", YA_TIDAK_NA, { required: true }),
      R("c_hak_mundur", "e. Hak untuk mengundurkan diri", YA_TIDAK_NA, { required: true }),
      R("c_insentif", "f. Adanya insentif untuk partisipan", YA_TIDAK_NA, { required: true }),
      R("c_insentif_jenis", "g. Jenis insentif yang diberikan", YA_TIDAK_NA, { required: true }),
      R("c_kompensasi", "h. Jenis kompensasi", YA_TIDAK_NA, { required: true }),
      R("c_spesimen", "a. Ada spesimen yang diambil dari partisipan?", [["T", "Tidak"], ["Y", "Ya"]], {
        required: true,
      }),
      T("u_spesimen_ket", "Jenis spesimen", {
        showIf: { field: "c_spesimen", is: "Y" },
        required: true,
      }),
      R("c_spesimen_jumlah", "b. Keterangan jumlah spesimen", YA_TIDAK, {
        showIf: { field: "c_spesimen", is: "Y" },
        required: true,
      }),
      R("c_spesimen_frekuensi", "c. Keterangan frekuensi pengambilan", YA_TIDAK, {
        showIf: { field: "c_spesimen", is: "Y" },
        required: true,
      }),
      R("c_spesimen_cara", "d. Keterangan cara pengambilan", YA_TIDAK, {
        showIf: { field: "c_spesimen", is: "Y" },
        required: true,
      }),
      R("c_spesimen_penanganan", "e. Keterangan cara penanganan", YA_TIDAK, {
        showIf: { field: "c_spesimen", is: "Y" },
        required: true,
      }),
      R("c_spesimen_risiko", "f. Keterangan risiko potensial pengambilan", YA_TIDAK, {
        showIf: { field: "c_spesimen", is: "Y" },
        required: true,
      }),
      R("c_invasif", "g. Ada tindakan invasif pada partisipan?", [["T", "Tidak"], ["Y", "Ya"]], {
        required: true,
      }),
      T("u_invasif_ket", "Tindakan invasif", {
        showIf: { field: "c_invasif", is: "Y" },
        required: true,
      }),
      R("c_rahsia_partisipan", "a. Keterangan kerahasiaan partisipan", YA_TIDAK, { required: true }),
      R("c_rahsia_spesimen", "b. Keterangan kerahasiaan spesimen", YA_TIDAK, { required: true }),
      R("c_rahsia_data", "c. Keterangan kerahasiaan data", YA_TIDAK, { required: true }),
      TA("u_kontak_lokal", "a. Kontak person lokal bagi responden", { required: true }),
      TA("u_kontak_pusat", "b. Kontak person pusat bagi responden", { required: true }),
    ],
  },
];

// ------------------------------------------------------- Lembar Informasi
const LI = [
  {
    key: "li_identitas",
    label: "Identitas Lembar Informasi",
    fields: [
      T("c_versi", "Versi lembar informasi", { required: true, default: "1.0" }),
      T("n_peneliti_nama", "Nama peneliti"),
      T("n_peneliti_asal", "Institusi peneliti"),
    ],
  },
  {
    key: "li_isi",
    label: "Isi Lembar Informasi",
    fields: [
      TA("s_tujuan_penelitian", "1. Tujuan Penelitian", {
        required: true,
        hint: "Penjelasan mengenai tujuan penelitian secara singkat dan jelas kepada calon partisipan",
      }),
      TA("s_alasan_terpilih", "2. Mengapa Partisipan Terpilih", {
        required: true,
        hint: "Penjelasan mengenai alasan partisipan terpilih (sebutkan kriteria inklusi)",
      }),
      TA("s_prosedur", "3. Tata Cara / Prosedur", {
        required: true,
        hint: "Penjelasan tata cara/prosedur penelitian (sampaikan bila ada placebo)",
      }),
      TA("s_risiko_ketidaknyamanan", "4. Risiko dan Ketidaknyamanan", {
        required: true,
        hint: "Penjelasan risiko dan ketidaknyamanan yang dirasakan partisipan",
      }),
      TA("s_manfaat_langsung", "5. Manfaat Langsung", {
        required: true,
        hint: "Penjelasan manfaat langsung. Kompensasi tidak termasuk manfaat",
      }),
      TA("s_manfaat_umum", "Manfaat Umum", {
        required: true,
        hint: "Penjelasan manfaat umum. Kompensasi tidak termasuk manfaat",
      }),
      TA("s_prosedur_alternatif", "6. Prosedur Alternatif", {
        required: true,
        hint: 'Penjelasan prosedur alternatif (tulis "tidak ada" jika tidak ada)',
      }),
      TA("s_kerahasiaan_data", "7. Kerahasiaan Data", {
        required: true,
        hint: "Penjelasan kerahasiaan data, cara menjaga, pemusnahan, dan pihak yang mengakses",
        default:
          "Data dan informasi yang Anda berikan selama mengikuti penelitian ini akan dijaga kerahasiaannya. Data hanya akan digunakan untuk keperluan penelitian dan tidak akan dipublikasikan dengan mencantumkan identitas Anda.",
      }),
      TA("v_jumlah_partisipan", "8. Perkiraan Jumlah Partisipan", { required: true }),
      TA("s_kesukarelaan", "9. Kesukarelaan", {
        required: true,
        hint: "Penjelasan keikutsertaan sukarela & upaya mengurangi keterpaksaan jika partisipan murid/pasien/staf",
        default:
          "Keikutsertaan Anda dalam penelitian ini sepenuhnya bersifat sukarela dan tanpa paksaan. Anda bebas memutuskan untuk ikut atau tidak ikut serta, serta dapat mengundurkan diri kapan saja.",
      }),
      TA("s_periode_keikutsertaan", "10. Periode Keikutsertaan", {
        required: true,
        hint: "Penjelasan durasi dari screening hingga akhir pengamatan dan durasi intervensi",
      }),
      TA("s_kriteria_pengunduran", "11. Pengeluaran / Pengunduran Diri", {
        required: true,
        hint: "Kriteria dikeluarkan/hak mengundurkan diri tanpa sanksi & konsekuensi pemantauan efek samping",
        default:
          "Anda berhak mengundurkan diri dari penelitian ini kapan saja tanpa paksaan dan tanpa memberikan alasan. Keputusan untuk mengundurkan diri tidak akan memengaruhi hak atau pelayanan yang Anda terima.",
      }),
      {
        name: "li_mitigasi",
        type: "note",
        text: "12. Mitigasi Risiko Akibat Penelitian",
      },
      TA("s_mitigasi_medis", "a. Tindakan Medis / Psikososial", { required: true }),
      TA("s_mitigasi_ganti_rugi", "b. Ganti Rugi Efek Samping / Kerugian", { required: true }),
      TA("s_mitigasi_faskes_rujuk", "c. Rekomendasi Faskes Rujukan"),
      TA("s_mitigasi_penanggung_jawab", "d. Penanggung Jawab Pembiayaan (Asuransi/Peneliti)", {
        required: true,
      }),
      TA("s_insentif_kompensasi", "13. Insentif dan Kompensasi", {
        required: true,
        hint: 'Bentuk/jenis insentif/kompensasi (uang tunai/barang). Tulis "tidak ada" jika tidak ada',
      }),
      {
        name: "li_kontak",
        type: "note",
        text: "14. Contact Person / Penanggung Jawab",
      },
      {
        name: "li_pj_penelitian",
        type: "note",
        text: "1. Penanggung Jawab Penelitian",
      },
      T("n_pj_penelitian_nama", "Nama"),
      T("n_pj_penelitian_alamat", "Alamat"),
      T("n_pj_penelitian_hp", "No. HP / Telp"),
      {
        name: "li_pj_medik",
        type: "note",
        text: "2. Penanggung Jawab Medik",
      },
      T("n_pj_medik_nama", "Nama", { required: true }),
      T("n_pj_medik_alamat", "Alamat", { required: true }),
      T("n_pj_medik_hp", "No. HP / Telp", { required: true }),
    ],
  },
];

// ---------------------------------------------------------------- Biodata
// Legacy (ref/pengajuanbaru/biodata.phtml) edits A and B with a WYSIWYG and
// pre-fills A with a table template. Kelompok 3 (hewan hidup) also shows C,
// which the legacy form binds to the same biodata_pi field.
const escHtml = (value) =>
  String(value ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export function defaultBiodataHtml(nama) {
  const row = (label, value = "") =>
    `<tr><td style="width: 25%; vertical-align: top;"><strong>${label}</strong></td>` +
    `<td style="width: 3%; vertical-align: top;">:</td>` +
    `<td style="width: 72%; vertical-align: top;">${value}</td></tr>`;
  const blank = "<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>";
  return (
    `<table border="0" cellpadding="3" cellspacing="0" style="width: 100%; border-collapse: collapse;">` +
    row("Nama lengkap", escHtml(nama)) +
    row("NIP / NPM") +
    row("Tempat/tgl. lahir") +
    row("Jenis Kelamin") +
    row("Alamat &amp; No. Telp.") +
    `</table>` +
    `<p><strong>Pendidikan (dari Sarjana Muda/yang sederajat keatas)</strong></p>` +
    `<table border="1" cellpadding="5" cellspacing="0" style="width: 100%; border-collapse: collapse;">` +
    `<thead><tr><td><strong>Tempat Pendidikan</strong></td><td><strong>Kota/Negara</strong></td><td><strong>Tahun Lulus</strong></td><td><strong>Bidang Studi</strong></td></tr></thead>` +
    `<tbody>${blank}${blank}${blank}</tbody></table>` +
    `<p><strong>Pengalaman Penelitian</strong></p>` +
    `<table border="1" cellpadding="5" cellspacing="0" style="width: 100%; border-collapse: collapse;">` +
    `<thead><tr><td><strong>Judul Penelitian</strong></td><td><strong>Tahun</strong></td></tr></thead>` +
    `<tbody><tr><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td></tr></tbody></table>` +
    `<p>&nbsp;</p>`
  );
}

const biodataGroups = (fields = {}, kelompokKode) => [
  {
    key: "biodata_pi",
    label: "A. Biodata Peneliti Utama",
    fields: [
      {
        name: "biodata_pi",
        label: "Biodata peneliti utama (nama, NIP/NPM, lahir, alamat, pendidikan)",
        type: "rich",
        required: true,
      },
    ],
  },
  ...(fields?.c_peneliti_lain === "Y"
    ? [
        {
          key: "biodata_pembimbing",
          label: "B. Biodata Pembimbing / Peneliti Lain",
          fields: [
            {
              name: "pembimbing",
              label: "Biodata pembimbing / peneliti lain",
              type: "biodata-rows",
            },
          ],
        },
      ]
    : []),
  ...(String(kelompokKode ?? "") === "3"
    ? [
        {
          key: "biodata_pj_hewan",
          label: "C. Biodata Penanggung Jawab Lab Hewan",
          fields: [
            {
              name: "biodata_pj_hewan",
              label: "Biodata penanggung jawab lab hewan",
              type: "rich",
              mirror: "biodata_pi",
              required: true,
            },
          ],
        },
      ]
    : []),
];

// ---------------------------------------------------------------- Poin E
const E = [
  {
    key: "e_pernyataan",
    label: "E. Pernyataan",
    fields: [
      R(
        "c_kriminal",
        "Pernahkah ketua pelaksana terlibat/dihukum karena tindak kriminal/disiplin?",
        [["N", "Tidak"], ["Y", "Ya"]],
        { required: true },
      ),
      T("u_kriminal", "Jelaskan", { showIf: { field: "c_kriminal", is: "Y" }, required: true }),
      NUM("n_lama_simpan", "Lama data penelitian disimpan (tahun)", { required: true }),
      CB(
        "c_pencegahan",
        "Tindakan pencegahan menjaga kerahasiaan data kesehatan",
        [
          ["1", "Dokumen disimpan di lokasi aman, hanya diakses petugas terlibat"],
          ["2", "Data komputer hanya untuk petugas terlibat, diakses dengan password"],
          ["3", "Data di cloud, hanya diakses petugas tertentu via email pribadi"],
          ["4", "Petugas menandatangani pernyataan persetujuan sebelum mengakses data"],
          ["5", "Petugas menandatangani persetujuan menjaga kerahasiaan dokumen"],
          ["6", "Identitas partisipan dihapus (anonim) bila memungkinkan"],
          ["99", "Lainnya"],
        ],
        { required: true },
      ),
      T("u_pencegahan_lain", "Pencegahan lainnya", {
        showIf: { field: "c_pencegahan", includes: "99" },
        required: true,
      }),
      {
        name: "e_pertanggungjawaban",
        type: "note",
        text: "Isi formulir ini akan saya pertanggungjawabkan dan akan dilaksanakan sesuai dengan proposal/usulan penelitian yang diajukan serta sesuai dengan prinsip etika penelitian.",
      },
    ],
  },
];

// ---------------------------------------------------------------- wiring
export const SECTION_META = {
  b: { label: "Isian Poin B" },
  bcd: { label: "Isian Poin B,C,D" },
  c: { label: "Isian Poin C" },
  d: { label: "Isian Poin D" },
  li: { label: "Isian Lembar Informasi" },
  biodata: { label: "Isian Biodata" },
  e: { label: "Isian Poin E" },
};

const SECTION_LIST = {
  "1": ["b", "c", "d", "li", "biodata", "e"],
  "2": ["b", "c", "d", "li", "biodata", "e"],
  "3": ["b", "c", "d", "li", "biodata", "e"],
  "4": ["b", "c", "d", "li", "biodata", "e"],
  "5": ["b", "c", "d", "li", "biodata", "e"],
  "6": ["b", "biodata", "e"],
  "7": ["bcd", "biodata", "e"],
};

export function sectionsFor(kelompokKode) {
  return SECTION_LIST[String(kelompokKode ?? "")] ?? SECTION_LIST["1"];
}

export function sectionSchema(bagian, kelompokKode, fields = {}) {
  switch (bagian) {
    case "b":
      if (String(kelompokKode) === "2") return { title: "Isian Poin B - Uji Klinis", groups: B_UJI_KLINIS };
      if (String(kelompokKode) === "3") return { title: "Isian Poin B - Hewan", groups: B_HEWAN };
      if (String(kelompokKode) === "6") return { title: "Isian Poin B - BBT Hewan", groups: B_BBT_HEWAN };
      return { title: "Isian Poin B", groups: B_METODE };
    case "bcd":
      return { title: "Isian Poin B,C,D - Laporan Kasus", groups: B_LAP_KASUS };
    case "c":
      return { title: "Isian Poin C", groups: C_PSP };
    case "d":
      return { title: "Isian Poin D", groups: D_RECONSENT };
    case "li":
      return { title: "Isian Lembar Informasi", groups: LI };
    case "biodata":
      return { title: "Isian Biodata", groups: biodataGroups(fields, kelompokKode) };
    case "e":
      return { title: "Isian Poin E", groups: E };
    default:
      return null;
  }
}
