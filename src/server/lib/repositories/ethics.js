// Public status lookups over dbo.tm_penelitian_etik.
import { getPool } from "../db.js";

/** Escapes LIKE metacharacters so user input is matched literally. */
const likeTerm = (value) => `%${value.replace(/[%_[]/g, (c) => `[${c}]`)}%`;

/**
 * Unauthenticated lookup, so it excludes soft-deleted rows and caps the result set.
 */
export async function searchEthics({ category, query }) {
  const pool = await getPool();
  const column = {
    JUDUL: "e.n_judul",
    PENELITI: "e.n_peneliti_u",
    KODE: "e.kode",
  }[category];

  const result = await pool
    .request()
    .input("term", likeTerm(query))
    .query(`
      SELECT TOP (20)
        e.id,
        COALESCE(NULLIF(LTRIM(RTRIM(e.n_judul_final)), ''), NULLIF(LTRIM(RTRIM(e.n_judul_perubahan)), ''), e.n_judul) AS title,
        e.n_peneliti_u AS researcher,
        COALESCE(
          NULLIF(LTRIM(RTRIM(e.kode)), ''),
          NULLIF(LTRIM(RTRIM(e.c_app)), ''),
          NULLIF(CONCAT(NULLIF(LTRIM(RTRIM(e.n_app)), ''), CASE WHEN e.tahun_app IS NULL OR e.tahun_app = '' THEN '' ELSE CONCAT('/', e.tahun_app) END), ''),
          '-'
        ) AS ethics_number,
        COALESCE(s.n_status, NULLIF(LTRIM(RTRIM(e.c_status_aktif)), ''), '-') AS status
      FROM dbo.tm_penelitian_etik e
      LEFT JOIN dbo.tr_status_ajuan s ON s.id = CONVERT(varchar(2), COALESCE(e.c_status_aksi, e.c_status_protokol))
      WHERE ${column} LIKE @term
        AND (e.c_statusdelete IS NULL OR e.c_statusdelete <> 'Y')
      ORDER BY e.id DESC
    `);

  return result.recordset.map((r) => ({
    id: r.id,
    title: r.title ?? "",
    researcher: r.researcher ?? "",
    ethicsNumber: r.ethics_number,
    status: r.status,
  }));
}
