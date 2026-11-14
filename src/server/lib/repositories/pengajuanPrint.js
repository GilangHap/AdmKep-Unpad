// Everything a printed document needs: the main protocol row plus the
// sub-form rows, assembled once so the print page does not fan out requests.
import { getPool } from "../db.js";
import { getSection } from "./pengajuanSections.js";
import { sanitizeRich } from "./pengajuanBaru.js";

const MAIN_FIELDS = [
  "n_judul",
  "ver_pro",
  "c_jenis_subjek",
  "jenis_subjek",
  "n_peneliti_u",
  "n_keahlian",
  "n_kedudukan",
  "n_hp",
  "n_telp_rumah",
  "n_cp",
  "hp_cp",
  "n_email",
  "civitas_unpad",
  "c_jenjang",
  "c_peruntukan",
  "n_institusi_pengusul",
  "n_alamat_pengusul",
  "hp_pengusul",
  "fax_pengusul",
  "n_email_pengusul",
  "c_dana",
  "s_dana",
  "n_judul_payung",
  "n_peneliti_payung",
  "n_peran",
  "bidang_ilmu",
  "ringkasan_penelitian",
  "tujuan_penelitian",
  "jum_partisipan",
  "c_multisenter",
  "c_spu",
  "c_sps",
  "c_kerjasama",
  "v_jum_negara",
  "c_peneliti_asing_stat",
  "c_etik_lain",
  "c_status_etik_lain",
  "n_tempat_penelitian",
  "d_awal",
  "d_akhir",
  "d_rekrutmen",
  "s_rincian_dana",
  "c_coi",
  "u_coi",
  "biodata_pi",
  "c_peneliti_lain",
  "d_ttd",
];

const DATE_FIELDS = ["d_awal", "d_akhir", "d_rekrutmen", "d_ttd"];

export async function getPrintData(userId, id) {
  const pool = await getPool();
  const plain = MAIN_FIELDS.filter((f) => !DATE_FIELDS.includes(f));
  const dates = DATE_FIELDS.map((f) => `CONVERT(varchar(10), e.${f}, 23) AS ${f}`).join(", ");
  const r = await pool
    .request()
    .input("id", id)
    .input("uid", userId)
    .query(`SELECT TOP 1 e.${plain.join(", e.")}, ${dates}, c_kelompok, v_kelompok, id_user
      FROM dbo.tm_penelitian_etik e
      OUTER APPLY (
        SELECT TOP 1 v_kelompok FROM dbo.tr_kelompok k
        WHERE k.id = TRY_CONVERT(int, e.c_kelompok)
      ) k
      WHERE e.id = @id AND e.id_user = @uid
        AND (e.c_statusdelete IS NULL OR e.c_statusdelete <> '1')`);
  const main = r.recordset[0];
  if (!main) return null;

  const kelompok = main.c_kelompok == null ? "" : String(main.c_kelompok).trim();
  const wanted =
    kelompok === "7"
      ? ["bcd", "e", "biodata"]
      : kelompok === "6"
        ? ["b", "e", "biodata"]
        : ["b", "c", "d", "li", "e", "biodata"];

  const asing = await pool.request().input("id", id).query(`
      SELECT n_nama_asing, n_tugas_asing, n_kontak_asing
      FROM dbo.tm_peneliti_etik_asing
      WHERE id_penelitian = @id
      ORDER BY id_peneliti_asing
    `);

  const loaded = await Promise.all(wanted.map((bagian) => getSection(userId, id, bagian)));
  const sections = {};
  wanted.forEach((bagian, i) => {
    sections[bagian] = loaded[i]?.data ?? {};
  });

  const etik = {};
  for (const key of MAIN_FIELDS) etik[key] = main[key] ?? "";
  etik.biodata_pi = sanitizeRich(etik.biodata_pi) ?? "";


  return {
    item: {
      id,
      kelompokKode: kelompok,
      kelompokLabel: main.v_kelompok ?? "",
      judul: main.n_judul ?? "",
      peneliti: main.n_peneliti_u ?? "",
    },
    etik,
    sections,
    // Legacy prints the pengesah table under E for every kelompok.
    pengesahan: sections.e?.pengesahan ?? [],
    pembimbing: (sections.biodata?.pembimbing ?? []).map((row) => ({
      ...row,
      biodata_lain: sanitizeRich(row.biodata_lain) ?? "",
    })),
    penelitiAsing: asing.recordset ?? [],
  };
}
