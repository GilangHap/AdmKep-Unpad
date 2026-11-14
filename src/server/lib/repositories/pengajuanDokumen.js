import { getPool } from "../db.js";

/** Dokumen pengajuan legacy: 1 Protokol/Proposal, 3 Surat Pengantar, 4 Bukti Pembayaran. */
export const DOKUMEN_URUTAN = new Set([1, 3, 4]);

export const DOKUMEN_JENIS = {
  1: "Proposal",
  3: "Surat Pengantar",
  4: "Bukti Pembayaran",
};

export async function listDokumen(idPenelitian) {
  const pool = await getPool();
  const r = await pool
    .request()
    .input("id", idPenelitian)
    .query(`
      SELECT urutan, n_judul, n_file, ukuran
      FROM dbo.tm_pen_proposal
      WHERE id_penelitian = @id AND (c_statusdelete IS NULL OR c_statusdelete <> 'Y')
      ORDER BY urutan
    `);
  return r.recordset.map((row) => ({
    urutan: row.urutan,
    nama: row.n_judul ?? "",
    file: row.n_file ?? "",
    ukuran: Number(row.ukuran ?? 0),
  }));
}

/** Stores the new file for one slot; replaces the row when it already exists. */
export async function putDokumen(idPenelitian, urutan, { n_judul, n_file, ukuran }) {
  const pool = await getPool();
  const existing = await pool
    .request()
    .input("id", idPenelitian)
    .input("urutan", urutan)
    .query(`
      SELECT TOP 1 id FROM dbo.tm_pen_proposal
      WHERE id_penelitian = @id AND urutan = @urutan
        AND (c_statusdelete IS NULL OR c_statusdelete <> 'Y')
      ORDER BY id DESC
    `);
  const row = existing.recordset[0];
  if (row) {
    await pool
      .request()
      .input("rowId", row.id)
      .input("n_judul", n_judul)
      .input("n_file", n_file)
      .input("ukuran", ukuran)
      .query(`
        UPDATE dbo.tm_pen_proposal
        SET n_judul = @n_judul, n_file = @n_file, ukuran = @ukuran,
            c_status_protokol = '1', mdate = GETDATE()
        WHERE id = @rowId
      `);
  } else {
    await pool
      .request()
      .input("id", idPenelitian)
      .input("urutan", urutan)
      .input("n_judul", n_judul)
      .input("n_file", n_file)
      .input("ukuran", ukuran)
      .query(`
        INSERT INTO dbo.tm_pen_proposal
          (id_penelitian, c_status_protokol, urutan, n_judul, n_file, ukuran, cdate)
        VALUES (@id, '1', @urutan, @n_judul, @n_file, @ukuran, GETDATE())
      `);
  }
  await pool
    .request()
    .input("id", idPenelitian)
    .query(`UPDATE dbo.tm_penelitian_etik SET d_upload_dok = GETDATE() WHERE id = @id`);
}

/** Removes the slot row and hands back the stored filename so the caller can unlink it. */
export async function deleteDokumen(idPenelitian, urutan) {
  const pool = await getPool();
  const r = await pool
    .request()
    .input("id", idPenelitian)
    .input("urutan", urutan)
    .query(`
      DELETE FROM dbo.tm_pen_proposal
      OUTPUT deleted.n_file
      WHERE id_penelitian = @id AND urutan = @urutan
    `);
  return r.recordset[0]?.n_file ?? null;
}
