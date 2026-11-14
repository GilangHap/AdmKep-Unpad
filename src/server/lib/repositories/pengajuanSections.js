// Sub-form sections of a submission (Isian Poin B/C/D, Lembar Informasi,
// Biodata, Poin E). Columns come from sys.columns so the client schema and
// the stored row can drift without opening a SQL injection hole.
import { getPool } from "../db.js";
import { sanitizeRich } from "./pengajuanBaru.js";

const B_TABLE = {
  "2": "tm_penelitian_etik_metode_ujiklinis",
  "3": "tm_penelitian_etik_metode_hewan",
  "6": "tm_penelitian_etik_metode_hewan",
  "7": "tm_penelitian_etik_metode_lap_kasus",
};
const DEFAULT_B_TABLE = "tm_penelitian_etik_metode";

const SINGLE = {
  c: "tm_penelitian_etik_psp",
  d: "tm_penelitian_etik_reconsent",
  li: "tm_penelitian_etik_informasi",
  e: "tm_penelitian_etik_pernyataan",
  biodata: "tm_penelitian_etik",
};

const ID_COL = {
  tm_penelitian_etik: "id",
  tm_penelitian_etik_psp: "id_psp",
  tm_penelitian_etik_reconsent: "id_reconsent",
  tm_penelitian_etik_informasi: "id_lembar_info",
  tm_penelitian_etik_metode: "id_metode",
  tm_penelitian_etik_metode_ujiklinis: "id_metode_uk",
  tm_penelitian_etik_metode_hewan: "id_hewan_etik",
  tm_penelitian_etik_metode_lap_kasus: "id_lap_kasus",
  tm_penelitian_etik_pernyataan: "id",
};

const NUMERIC = new Set([
  "int", "bigint", "smallint", "tinyint", "bit", "float", "real", "decimal", "numeric", "money",
]);
const TEMPORAL = new Set(["datetime", "date", "datetime2", "smalldatetime", "datetimeoffset", "time"]);

const columnCache = new Map();

async function columns(table) {
  if (!columnCache.has(table)) {
    const pool = await getPool();
    const r = await pool.request().input("t", table).query(`
      SELECT c.name, ty.name AS type, c.max_length, c.is_nullable
      FROM sys.columns c JOIN sys.types ty ON ty.user_type_id = c.user_type_id
      WHERE c.object_id = OBJECT_ID('dbo.' + @t) ORDER BY c.column_id`);
    columnCache.set(table, r.recordset);
  }
  return columnCache.get(table);
}

async function ownedRow(pool, id, userId) {
  const r = await pool
    .request()
    .input("id", id)
    .input("uid", userId)
    .query(`
      SELECT TOP 1 id, c_kelompok, c_status_ver, d_kirim, id_user, n_judul, n_peneliti_u,
        n_kedudukan, n_institusi_pengusul, n_alamat_pengusul, n_hp, biodata_pi, c_peneliti_lain, d_ttd
      FROM dbo.tm_penelitian_etik
      WHERE id = @id AND id_user = @uid
        AND (c_statusdelete IS NULL OR c_statusdelete <> '1')`);
  return r.recordset[0] ?? null;
}

export function sectionTable(bagian, kelompok) {
  if (bagian === "b" || bagian === "bcd") return B_TABLE[kelompok] ?? DEFAULT_B_TABLE;
  return SINGLE[bagian] ?? null;
}

/** True for the one-page "Isian Poin B,C,D" used by laporan kasus. */
export function isCombined(bagian) {
  return bagian === "bcd";
}

function shape(row, cols) {
  const out = {};
  for (const c of cols) out[c.name] = row[c.name] ?? null;
  return out;
}

// Character budget of every bounded string column, in the same units the
// client counts (UTF-16 code units for nvarchar, bytes for varchar).
export function limitsFor(cols) {
  const out = {};
  for (const c of cols) {
    if (c.max_length <= 0) continue;
    if (c.type === "nvarchar" || c.type === "nchar") out[c.name] = c.max_length / 2;
    else if (c.type === "varchar" || c.type === "char") out[c.name] = c.max_length;
  }
  return out;
}

export async function mainFormLimits() {
  const [main, pembimbing, asing] = await Promise.all([
    columns("tm_penelitian_etik"),
    columns("tm_pembimbing"),
    columns("tm_peneliti_etik_asing"),
  ]);
  return { ...limitsFor(asing), ...limitsFor(pembimbing), ...limitsFor(main) };
}

export async function getSection(userId, id, bagian) {
  const pool = await getPool();
  const etik = await ownedRow(pool, id, userId);
  if (!etik) return null;

  const kelompok = etik.c_kelompok == null ? "" : String(etik.c_kelompok).trim();
  const table = sectionTable(bagian, kelompok);
  if (!table) return null;

  const cols = await columns(table);
  const idCol = ID_COL[table];
  const fk = table === "tm_penelitian_etik" ? "id" : "id_penelitian";
  const r = await pool
    .request()
    .input("id", id)
    .query(`SELECT TOP 1 * FROM dbo.${table} WHERE ${fk} = @id ORDER BY ${idCol} DESC`);

  const data = r.recordset[0] ? shape(r.recordset[0], cols) : {};

  const item = {
    id: etik.id,
    kelompokKode: kelompok || null,
    judul: etik.n_judul ?? "",
    peneliti: etik.n_peneliti_u ?? "",
    kedudukan: etik.n_kedudukan ?? "",
    institusi: etik.n_institusi_pengusul ?? "",
    alamat: etik.n_alamat_pengusul ?? "",
    hp: etik.n_hp ?? "",
    editable: String(etik.c_status_ver ?? "").trim() === "-1",
  };

  if (bagian === "e") {
    const p = await pool
      .request()
      .input("id", id)
      .query(`SELECT c_peran, n_nama, c_urutan, path_ttd FROM dbo.tm_penelitian_etik_pengesahan
        WHERE id_penelitian = @id ORDER BY c_urutan, id`);
    data.pengesahan = p.recordset.map((x) => ({
      c_peran: x.c_peran ?? "",
      n_nama: x.n_nama ?? "",
      path_ttd: x.path_ttd ?? "",
    }));
    data.d_pengesahan = etik.d_ttd ? new Date(etik.d_ttd).toISOString().slice(0, 10) : "";
  }

  if (bagian === "biodata") {
    const p = await pool
      .request()
      .input("id", id)
      .query(`SELECT id, n_nama, biodata_lain FROM dbo.tm_pembimbing
        WHERE id_penelitian = @id AND (c_statusdelete IS NULL OR c_statusdelete <> 'Y')
        ORDER BY id`);
    data.pembimbing = p.recordset.map((x) => ({
      id: x.id,
      n_nama: x.n_nama ?? "",
      biodata_lain: x.biodata_lain ?? "",
    }));
  }

  const limits = limitsFor(cols);
  if (bagian === "e") Object.assign(limits, limitsFor(await columns("tm_penelitian_etik_pengesahan")));
  if (bagian === "biodata") Object.assign(limits, limitsFor(await columns("tm_pembimbing")));

  return { item, data, limits };
}

function coerce(col, value) {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) {
    if (value.some((v) => v && typeof v === "object")) return JSON.stringify(value);
    return value.map((v) => String(v)).join(",");
  }
  if (value && typeof value === "object") return JSON.stringify(value);
  if (value === null) return null;
  const text = String(value);
  if (text === "") {
    if (NUMERIC.has(col.type) || TEMPORAL.has(col.type)) return null;
    return "";
  }
  if (NUMERIC.has(col.type)) {
    const n = Number(text);
    if (!Number.isFinite(n)) return null;
    return NUMERIC.has(col.type) && ["int", "bigint", "smallint", "tinyint", "bit"].includes(col.type)
      ? Math.trunc(n)
      : n;
  }
  if (col.max_length > 0 && (col.type === "nvarchar" || col.type === "nchar")) {
    const limit = col.max_length / 2;
    if (text.length > limit) {
      throw Object.assign(new Error(`Isian terlalu panjang (maksimal ${limit} karakter).`), {
        status: 400,
      });
    }
  } else if (col.max_length > 0 && (col.type === "varchar" || col.type === "char")) {
    if (text.length > col.max_length) {
      throw Object.assign(new Error(`Isian terlalu panjang (maksimal ${col.max_length} karakter).`), {
        status: 400,
      });
    }
  }
  return text;
}

async function upsert(tx, table, id, body, cols) {
  const byName = new Map(cols.map((c) => [c.name, c]));
  const fk = table === "tm_penelitian_etik" ? "id" : "id_penelitian";
  const values = {};
  for (const [rawKey, rawValue] of Object.entries(body)) {
    const key = rawKey.replace(/\[\]$/, "");
    const col = byName.get(key);
    if (!col || key === ID_COL[table] || key === fk) continue;
    const v = coerce(col, rawValue);
    if (v !== undefined) values[key] = v;
  }

  const idCol = ID_COL[table];
  const existing = await tx
    .request()
    .input("id", id)
    .query(`SELECT TOP 1 ${idCol} AS id FROM dbo.${table} WHERE ${fk} = @id`);
  const rowId = existing.recordset[0]?.id;

  const setStatus = byName.has("c_status_aktif") && !("c_status_aktif" in values);
  if (setStatus) values.c_status_aktif = "1";

  const req = tx.request().input("id", id);
  const keys = Object.keys(values);
  if (rowId != null) {
    if (byName.has("mdate")) values.mdate = new Date();
    if (!keys.length && !byName.has("mdate")) return;
    const sets = Object.keys(values).map((k, i) => {
      req.input(`v${i}`, values[k]);
      return `[${k}] = @v${i}`;
    });
    await req.query(`UPDATE dbo.${table} SET ${sets.join(", ")} WHERE ${fk} = @id`);
    return;
  }

  if (byName.has("cdate")) values.cdate = new Date();
  const allKeys = Object.keys(values);
  const colSql = [fk, ...allKeys].map((k) => `[${k}]`).join(", ");
  const valSql = ["@id", ...allKeys.map((k, i) => {
    req.input(`v${i}`, values[k]);
    return `@v${i}`;
  })].join(", ");
  await req.query(`INSERT INTO dbo.${table} (${colSql}) VALUES (${valSql})`);
}

export async function saveSection(userId, id, bagian, body) {
  const pool = await getPool();
  const etik = await ownedRow(pool, id, userId);
  if (!etik) return null;
  if (String(etik.c_status_ver ?? "").trim() !== "-1") {
    throw Object.assign(new Error("Pengajuan ini sudah dikirim dan tidak dapat diubah."), {
      status: 409,
    });
  }

  const kelompok = etik.c_kelompok == null ? "" : String(etik.c_kelompok).trim();
  const table = sectionTable(bagian, kelompok);
  if (!table) return null;

  const cols = await columns(table);
  if (bagian === "biodata" && body) {
    body = { ...body };
    if ("biodata_pi" in body) body.biodata_pi = sanitizeRich(body.biodata_pi) ?? "";
    if (Array.isArray(body.pembimbing)) {
      body.pembimbing = body.pembimbing.map((row) => ({
        ...row,
        biodata_lain: sanitizeRich(row?.biodata_lain) ?? "",
      }));
    }
  }

  const tx = pool.transaction();
  await tx.begin();
  try {
    await upsert(tx, table, id, body ?? {}, cols);

    if (bagian === "e") {
      await tx
        .request()
        .input("id", id)
        .input("d", body?.d_pengesahan || new Date().toISOString().slice(0, 10))
        .query(`UPDATE dbo.tm_penelitian_etik SET d_ttd = @d WHERE id = @id`);
    }

    if (bagian === "biodata" && Array.isArray(body?.pembimbing)) {
      for (const row of body.pembimbing) {
        const rowId = Number(row?.id);
        if (!Number.isInteger(rowId) || rowId <= 0) continue;
        await tx
          .request()
          .input("id", id)
          .input("rowId", rowId)
          .input("bio", String(row?.biodata_lain ?? ""))
          .query(`UPDATE dbo.tm_pembimbing SET biodata_lain = @bio
            WHERE id = @rowId AND id_penelitian = @id`);
      }
    }

    await tx
      .request()
      .input("id", id)
      .query(`UPDATE dbo.tm_penelitian_etik SET mdate = GETDATE() WHERE id = @id`);

    await tx.commit();
  } catch (err) {
    await tx.rollback().catch(() => {});
    throw err;
  }

  return getSection(userId, id, bagian);
}
