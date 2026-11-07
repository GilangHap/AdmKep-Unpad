// dbo.tm_penelitian_etik + tm_pembimbing + tm_peneliti_etik_asing.
// Mirrors the legacy insert (Pengajuanbaru_Service::pengajuanbaruInsert) but uses
// parameterised SQL and takes the researcher from the session, not the payload.
import { getPool } from "../db.js";

// The wizard collects gate answers and a protocol version that the legacy UI derived
// but never stored. They ride along in n_asal so a reopened draft is identical to what
// the researcher left behind. Format: "KEPADM|p1=Y|p1tdk=N|p1tdk2=N|fokus=4|ver=1.0"
const META_MARK = "KEPADM";
const META_KEYS = { fetik_p1: "p1", fetik_p1_tdk: "p1tdk", fetik_p1_tdk_tdk: "p1tdk2", fetik_fokus: "fokus", ver_pro: "ver" };

const clean = (value) => String(value ?? "").trim();

// The WYSIWYG (Quill) keeps a small HTML subset. Every other tag and every unreviewed
// attribute is dropped, so no event handler or javascript: URL can reach the database.
const RICH_TAGS = new Set([
  "p", "br", "b", "strong", "i", "em", "u", "s", "strike",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "blockquote", "pre", "code", "a", "span", "sub", "sup", "img", "div",
]);
const SAFE_STYLE = /^(color|background-color):\s*(#[0-9a-f]{3,8}|rgba?\([\d.,\s%]+\)|[a-z-]+)$|^text-align:\s*(left|center|right|justify)$/i;
const SAFE_CLASS = /^ql-[a-z0-9-]+$/i;
const SAFE_SRC = /^(https?:\/\/|data:image\/(png|jpe?g|gif|webp);base64,)/i;

const sanitizeAttrs = (raw) => {
  const out = [];
  for (const match of raw.matchAll(/([a-z-]+)\s*=\s*"([^"]*)"/gi)) {
    const name = match[1].toLowerCase();
    const value = match[2];
    if (name === "href" && /^(https?:\/\/|mailto:)/i.test(value)) {
      out.push(`href="${value}" target="_blank" rel="noopener noreferrer"`);
    } else if (name === "src" && SAFE_SRC.test(value)) {
      out.push(`src="${value}"`);
    } else if (name === "alt") {
      out.push(`alt="${value.replaceAll('"', "&quot;")}"`);
    } else if (name === "class" && value.split(/\s+/).every((c) => SAFE_CLASS.test(c))) {
      out.push(`class="${value}"`);
    } else if (name === "style") {
      const declarations = value.split(";").map((d) => d.trim()).filter((d) => SAFE_STYLE.test(d));
      if (declarations.length) out.push(`style="${declarations.join("; ")}"`);
    } else if (name === "data-list" && ["bullet", "ordered", "checked"].includes(value)) {
      out.push(`data-list="${value}"`);
    }
  }
  return out.length ? ` ${out.join(" ")}` : "";
};

const sanitizeRich = (value) => {
  const text = clean(value);
  if (!text) return null;
  const html = text
    // Quill's list bullets are an empty presentational span; drop it on the way in.
    .replace(/<span[^>]*class="[^"]*ql-ui[^"]*"[^>]*>\s*<\/span>/gi, "")
    .replace(/<\s*(\/?)\s*([a-z][a-z0-9]*)([^>]*)>/gi, (full, closing, name, rest) => {
      const tag = name.toLowerCase();
      if (!RICH_TAGS.has(tag)) return "";
      return closing ? `</${tag}>` : `<${tag}${sanitizeAttrs(rest)}>`;
    })
    .trim();
  return html || null;
};

const encodeMeta = (input) => {
  const parts = [META_MARK];
  for (const [field, key] of Object.entries(META_KEYS)) {
    const value = clean(input[field]).replaceAll("|", "");
    if (value) parts.push(`${key}=${value}`);
  }
  return parts.length > 1 ? parts.join("|").slice(0, 50) : null;
};

const decodeMeta = (raw) => {
  const text = clean(raw);
  const out = { fetik_p1: "", fetik_p1_tdk: "", fetik_p1_tdk_tdk: "", fetik_fokus: "", ver_pro: "" };
  if (!text.startsWith(`${META_MARK}|`)) return out;
  const byKey = Object.fromEntries(
    text.split("|").slice(1).map((pair) => {
      const i = pair.indexOf("=");
      return i < 0 ? [pair, ""] : [pair.slice(0, i), pair.slice(i + 1)];
    }),
  );
  for (const [field, key] of Object.entries(META_KEYS)) out[field] = byKey[key] ?? "";
  return out;
};

const toDate = (value) => {
  const s = clean(value);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Non-empty string or null: the legacy table stores blanks as NULL. */
const orNull = (value) => {
  const s = clean(value);
  return s ? s : null;
};

function mapFields(input) {
  return {
    c_jenis_subjek: orNull(input.c_jenis_subjek),
    c_kelompok: orNull(input.c_kelompok),
    n_peneliti_u: orNull(input.n_peneliti_u),
    n_keahlian: orNull(input.n_keahlian),
    n_kedudukan: orNull(input.n_kedudukan),
    n_telp_rumah: orNull(input.n_telp_rumah),
    n_hp: orNull(input.n_hp),
    n_cp: orNull(input.n_cp),
    hp_cp: orNull(input.hp_cp),
    n_email: orNull(input.n_email),
    civitas_unpad: orNull(input.civitas_unpad),
    n_judul: clean(input.n_judul) || null,
    ver_pro: orNull(input.ver_pro),
    c_peruntukan: orNull(input.c_peruntukan),
    c_jenjang: orNull(input.c_jenjang),
    n_institusi_pengusul: orNull(input.n_institusi_pengusul),
    n_alamat_pengusul: orNull(input.n_alamat_pengusul),
    hp_pengusul: orNull(input.hp_pengusul),
    fax_pengusul: orNull(input.fax_pengusul),
    n_email_pengusul: orNull(input.n_email_pengusul),
    c_dana: orNull(input.c_dana),
    s_dana: orNull(input.s_dana),
    c_peneliti_lain: orNull(input.c_peneliti_lain),
    bidang_ilmu: orNull(input.bidang_ilmu),
    ringkasan_penelitian: sanitizeRich(input.ringkasan_penelitian),
    tujuan_penelitian: orNull(input.tujuan_penelitian),
    jum_partisipan: orNull(input.jum_partisipan),
    c_kerjasama: orNull(input.c_kerjasama),
    v_jum_negara: orNull(input.v_jum_negara),
    c_peneliti_asing_stat: orNull(input.c_peneliti_asing_stat),
    file_izin_asing: orNull(input.file_izin_asing),
    file_mou: orNull(input.file_mou),
    file_mta: orNull(input.file_mta),
    c_etik_lain: orNull(input.c_etik_lain),
    c_status_etik_lain: orNull(input.c_status_etik_lain),
    file_etik_lain: orNull(input.file_etik_lain),
    c_multisenter: orNull(input.c_multisenter),
    c_spu: orNull(input.c_spu),
    c_sps: orNull(input.c_sps),
    c_coi: orNull(input.c_coi),
    u_coi: orNull(input.u_coi),
    n_tempat_penelitian: orNull(input.n_tempat_penelitian),
    s_rincian_dana: sanitizeRich(input.s_rincian_dana),
    d_awal: toDate(input.d_awal),
    d_akhir: toDate(input.d_akhir),
    d_rekrutmen: toDate(input.d_rekrutmen),
    n_asal: encodeMeta(input) ?? "",
  };
}

/** Active (not soft-deleted) submissions owned by one account, newest first. */
const JENIS_DATA = { 1: "Data Primer", 2: "Data Sekunder", 3: "Data Primer dan Sekunder" };
// ponytail: tr_peruntukan tidak ada di DB backup; label disalin dari legacy.
const PERUNTUKAN = {
  D: "Disertasi",
  K: "Kerjasama",
  H: "Hibah",
  L: "Lainnya",
  S: "Skripsi",
  T: "Tesis",
  P: "PKM",
};

export async function listByUser(userId, { limit = 50 } = {}) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("userId", userId)
    .input("limit", Math.min(Math.max(Number(limit) || 50, 1), 200))
    .query(`
      SELECT TOP (@limit)
        e.id, e.kode, e.n_judul, e.c_jenjang, e.c_kelompok, e.c_dana, e.c_peruntukan,
        e.c_status_ver, e.c_status_aksi, e.d_kirim, e.cdate, e.mdate,
        e.n_peneliti_u, e.n_cp, e.hp_cp, e.n_institusi_pengusul, e.jenis_data,
        k.v_kelompok AS kelompok,
        s.n_status AS status_ajuan,
        a.n_status AS status_aksi
      FROM dbo.tm_penelitian_etik e
      LEFT JOIN dbo.tr_kelompok k ON k.id = e.c_kelompok
      LEFT JOIN dbo.tr_status_ajuan s ON s.id = CONVERT(varchar(2), e.c_status_ver)
      LEFT JOIN dbo.tr_status_aksi a ON a.id = e.c_status_aksi
      WHERE e.id_user = @userId
        AND (e.c_statusdelete IS NULL OR e.c_statusdelete <> 'Y')
      ORDER BY e.id DESC
    `);
  return result.recordset.map((r) => {
    const jenis = String(r.jenis_data ?? "").trim();
    const peruntukan = String(r.c_peruntukan ?? "").trim();
    return {
      id: r.id,
      kode: (r.kode ?? "").trim() || null,
      judul: r.n_judul ?? "",
      peneliti: (r.n_peneliti_u ?? "").trim() || null,
      cp: (r.n_cp ?? "").trim() || null,
      hp: (r.hp_cp ?? "").trim() || null,
      institusi: (r.n_institusi_pengusul ?? "").trim() || null,
      jenisData: JENIS_DATA[jenis] ?? null,
      jenjang: (r.c_jenjang ?? "").trim() || null,
      kelompok: r.kelompok ?? null,
      dana: r.c_dana ?? null,
      peruntukan: (PERUNTUKAN[peruntukan] ?? peruntukan) || null,
      status: r.status_ajuan ?? "Inputan",
      statusKode: (r.c_status_ver ?? "").toString().trim() || null,
      statusAksi: (r.status_aksi ?? "").trim() || null,
      dikirimPada: r.d_kirim ?? null,
      dibuatPada: r.cdate ?? null,
      diubahPada: r.mdate ?? null,
    };
  });
}

/** One submission owned by the account: header + researcher rows. */
export async function findByIdForUser(id, userId) {
  const pool = await getPool();
  const header = await pool
    .request()
    .input("id", id)
    .input("userId", userId)
    .query(`
      SELECT e.*, k.v_kelompok AS kelompok, s.n_status AS status_ajuan,
             j.n_jenjang AS jenjang, p.n_peruntukan AS peruntukan
      FROM dbo.tm_penelitian_etik e
      LEFT JOIN dbo.tr_kelompok k ON k.id = e.c_kelompok
      LEFT JOIN dbo.tr_status_ajuan s ON s.id = CONVERT(varchar(2), e.c_status_ver)
      LEFT JOIN dbo.tr_jenjang j ON j.c_jenjang = e.c_jenjang
      LEFT JOIN dbo.tr_peruntukan p ON p.c_peruntukan = e.c_peruntukan
      WHERE e.id = @id AND e.id_user = @userId
        AND (e.c_statusdelete IS NULL OR e.c_statusdelete <> 'Y')
    `);
  const row = header.recordset[0];
  if (!row) return null;

  const [pembimbing, asing] = await Promise.all([
    pool.request().input("id", id).query(`
      SELECT id, n_nama FROM dbo.tm_pembimbing
      WHERE id_penelitian = @id AND (c_statusdelete IS NULL OR c_statusdelete <> 'Y')
      ORDER BY id
    `),
    pool.request().input("id", id).query(`
      SELECT id_peneliti_asing AS id, n_nama_asing, n_tugas_asing, n_kontak_asing
      FROM dbo.tm_peneliti_etik_asing
      WHERE id_penelitian = @id
      ORDER BY id_peneliti_asing
    `),
  ]);

  // SQL Server DATETIME has no zone; the legacy portal stores local dates, so keep local.
  const isoDate = (d) => {
    if (!d) return "";
    const date = new Date(d);
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };

  return {
    id: row.id,
    kode: (row.kode ?? "").trim() || null,
    status: row.status_ajuan ?? "Inputan",
    statusKode: (row.c_status_ver ?? "").toString().trim() || null,
    kelompok: row.kelompok ?? null,
    jenjang: (row.jenjang ?? "").trim() || null,
    peruntukan: (row.peruntukan ?? "").trim() || null,
    dibuatPada: row.cdate ?? null,
    diubahPada: row.mdate ?? null,
    fields: {
      ...mapFields(row),
      // Meta only fills the gate answers; empty meta keys must not wipe stored columns.
      ...Object.fromEntries(
        Object.entries(decodeMeta(row.n_asal)).filter(([, value]) => value),
      ),
      d_awal: isoDate(row.d_awal),
      d_akhir: isoDate(row.d_akhir),
      d_rekrutmen: isoDate(row.d_rekrutmen),
    },
    pembimbing: pembimbing.recordset.map((r) => ({ id: r.id, n_nama: r.n_nama ?? "" })),
    penelitiAsing: asing.recordset.map((r) => ({
      id: r.id,
      n_nama_asing: r.n_nama_asing ?? "",
      n_tugas_asing: r.n_tugas_asing ?? "",
      n_kontak_asing: r.n_kontak_asing ?? "",
    })),
  };
}

/** Drops every child row and re-inserts it: the wizard always sends the full set. */
async function replaceChildren(tx, id, { pembimbing, asing }) {
  await tx.request().input("id", id).query(`
    UPDATE dbo.tm_pembimbing SET c_statusdelete = 'Y' WHERE id_penelitian = @id AND (c_statusdelete IS NULL OR c_statusdelete <> 'Y');
    DELETE FROM dbo.tm_peneliti_etik_asing WHERE id_penelitian = @id;
  `);
  for (const n_nama of pembimbing) {
    await tx
      .request()
      .input("id", id)
      .input("n_nama", n_nama)
      .query(`
        INSERT INTO dbo.tm_pembimbing (id_penelitian, n_nama, c_statusdelete, biodata_lain)
        VALUES (@id, @n_nama, 'N', NULL)
      `);
  }
  for (const r of asing) {
    await tx
      .request()
      .input("id", id)
      .input("n_nama_asing", r.n_nama_asing)
      .input("n_tugas_asing", r.n_tugas_asing)
      .input("n_kontak_asing", r.n_kontak_asing)
      .query(`
        INSERT INTO dbo.tm_peneliti_etik_asing
          (id_penelitian, n_nama_asing, n_tugas_asing, n_kontak_asing, d_entry)
        VALUES (@id, @n_nama_asing, @n_tugas_asing, @n_kontak_asing, GETDATE())
      `);
  }
}

function childRows(input) {
  const pembimbing = (Array.isArray(input.pembimbing) ? input.pembimbing : [])
    .map((r) => clean(r?.n_nama))
    .filter(Boolean);
  const asing = (Array.isArray(input.peneliti_asing) ? input.peneliti_asing : [])
    .map((r) => ({
      n_nama_asing: clean(r?.n_nama_asing),
      n_tugas_asing: orNull(r?.n_tugas_asing),
      n_kontak_asing: orNull(r?.n_kontak_asing),
    }))
    .filter((r) => r.n_nama_asing);
  return { pembimbing, asing };
}

export async function createForUser(userId, input, { uid } = {}) {
  const fields = mapFields(input);
  const children = childRows(input);

  const pool = await getPool();
  const tx = pool.transaction();
  await tx.begin();
  try {
    const req = tx.request();
    req.input("idUser", userId);
    req.input("uid", uid ?? null);
    for (const [key, value] of Object.entries(fields)) req.input(key, value);
    // Same starting state as the legacy portal: an unsent draft.
    req.input("statusVer", "-1");
    const inserted = await req.query(`
      INSERT INTO dbo.tm_penelitian_etik
        (${Object.keys(fields).join(", ")},
         id_user, c_status_ver, c_statusdelete, cuid, cdate)
      OUTPUT INSERTED.id
      VALUES
        (${Object.keys(fields).map((k) => `@${k}`).join(", ")},
         @idUser, @statusVer, 'N', @uid, GETDATE())
    `);
    const id = inserted.recordset[0].id;
    await replaceChildren(tx, id, children);
    await tx.commit();
    return id;
  } catch (err) {
    await tx.rollback().catch(() => {});
    throw err;
  }
}

/** Updates an unsent draft; a draft already sent (c_status_ver <> '-1') is read-only. */
export async function updateForUser(id, userId, input, { uid } = {}) {
  const fields = mapFields(input);
  const children = childRows(input);

  const pool = await getPool();
  const tx = pool.transaction();
  await tx.begin();
  try {
    const childrenActive = fields.c_peneliti_lain === "Y";
    const asingActive = fields.c_peneliti_asing_stat === "Y";
    const req = tx.request();
    req.input("id", id);
    req.input("idUser", userId);
    req.input("uid", uid ?? null);
    for (const [key, value] of Object.entries(fields)) req.input(key, value);
    const assignments = Object.keys(fields)
      .map((key) => `${key} = @${key}`)
      .join(", ");
    const updated = await req.query(`
      UPDATE dbo.tm_penelitian_etik
      SET ${assignments}, muid = @uid, mdate = GETDATE()
      WHERE id = @id AND id_user = @idUser
        AND c_status_ver = '-1'
        AND (c_statusdelete IS NULL OR c_statusdelete <> 'Y')
    `);
    if (updated.rowsAffected[0] === 0) {
      throw Object.assign(new Error("Draf tidak ditemukan atau sudah dikirim."), { status: 404 });
    }
    await replaceChildren(tx, id, {
      pembimbing: childrenActive ? children.pembimbing : [],
      asing: asingActive ? children.asing : [],
    });
    await tx.commit();
    return true;
  } catch (err) {
    // rollback is safe even after a partial failure; a second call is a no-op error we ignore.
    await tx.rollback().catch(() => {});
    throw err;
  }
}

/** Hard delete is never used: mark the draft soft-deleted, like the legacy service. */
export async function deleteDraft(id, userId, { uid } = {}) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("id", id)
    .input("userId", userId)
    .input("uid", uid ?? null)
    .query(`
      UPDATE dbo.tm_penelitian_etik
      SET c_statusdelete = 'Y', muid = @uid, mdate = GETDATE()
      WHERE id = @id AND id_user = @userId
        AND c_status_ver = '-1'
        AND (c_statusdelete IS NULL OR c_statusdelete <> 'Y')
    `);
  return result.rowsAffected[0] > 0;
}

const FILE_SLOTS = new Set(["file_etik_lain", "file_izin_asing", "file_mou", "file_mta"]);

/** Stores an uploaded filename in its column; slot is whitelisted and never interpolated raw. */
export async function setFileForUser(id, userId, slot, filename) {
  if (!FILE_SLOTS.has(slot)) return false;
  const pool = await getPool();
  const result = await pool
    .request()
    .input("id", id)
    .input("userId", userId)
    .input("filename", filename)
    .query(`
      UPDATE dbo.tm_penelitian_etik
      SET ${slot} = @filename, mdate = GETDATE()
      WHERE id = @id AND id_user = @userId
        AND c_status_ver = '-1'
        AND (c_statusdelete IS NULL OR c_statusdelete <> 'Y')
    `);
  return result.rowsAffected[0] > 0;
}

/** Moves a draft into the petugas queue: status 1 (Masih Ajuan), protocol type 1 (baru). */
export async function submitForUser(id, userId, { uid } = {}) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("id", id)
    .input("userId", userId)
    .input("uid", uid ?? null)
    .query(`
      UPDATE dbo.tm_penelitian_etik
      SET c_status_ver = '1', c_status_protokol = '1', d_kirim = GETDATE(),
          muid = @uid, mdate = GETDATE()
      WHERE id = @id AND id_user = @userId
        AND c_status_ver = '-1'
        AND (c_statusdelete IS NULL OR c_statusdelete <> 'Y')
    `);
  return result.rowsAffected[0] > 0;
}
