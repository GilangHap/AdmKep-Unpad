import express, { Router } from "express";
import path from "node:path";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { z } from "zod";
import { requireAuth } from "../lib/session.js";
import {
  listByUser,
  findByIdForUser,
  createForUser,
  updateForUser,
  deleteDraft,
  submitForUser,
  setFileForUser,
} from "../lib/repositories/pengajuanBaru.js";
import { getSection, saveSection, mainFormLimits } from "../lib/repositories/pengajuanSections.js";
import {
  DOKUMEN_URUTAN,
  DOKUMEN_JENIS,
  listDokumen,
  putDokumen,
  deleteDokumen,
} from "../lib/repositories/pengajuanDokumen.js";
import { getPrintData } from "../lib/repositories/pengajuanPrint.js";
import { getPool } from "../lib/db.js";
const router = Router();

const SECTION_BAGIAN = new Set(["b", "bcd", "c", "d", "li", "biodata", "e"]);

const UPLOAD_DIR = path.join(process.cwd(), process.env.UPLOAD_DIR || "var/uploads");
const FILE_SLOTS = new Set(["file_etik_lain", "file_izin_asing", "file_mou", "file_mta"]);
const PROPOSAL_DIR = path.join(UPLOAD_DIR, "proposal");
const MAX_FILE_BYTES = 10 * 1024 * 1024;

// Trust bytes, not the filename: the extension is derived from the signature.
function sniffImage(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return null;
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return "pdf";
  }
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "png";
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return "jpg";
  return null;
}

const idFrom = (req) => {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
};

router.use(requireAuth);

// A draft is saved half-finished: NULL and "" both mean "not answered yet".
// ponytail: only the format of a filled date is checked here; "required" belongs to submit.
const text = (max) =>
  z
    .union([z.string().trim().max(max), z.null()])
    .optional()
    .transform((v) => v ?? "");
const dateOnly = z
  .union([z.literal(""), z.null(), z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")])
  .optional()
  .transform((v) => v ?? "");
const pick = (values) =>
  z
    .union([z.enum(values), z.null()])
    .optional()
    .transform((v) => v ?? "");

const pembimbingRow = z.object({ n_nama: text(150) });
const asingRow = z.object({
  n_nama_asing: text(255),
  n_tugas_asing: text(4000),
  n_kontak_asing: text(255),
});

const body = z.object({
  c_jenis_subjek: pick(["", "1", "2", "3"]),
  c_kelompok: pick(["", "1", "2", "3", "4", "5", "6", "7"]),
  fetik_p1: pick(["", "Y", "N"]),
  fetik_p1_tdk: pick(["", "Y", "N"]),
  fetik_p1_tdk_tdk: pick(["", "Y", "N"]),
  fetik_fokus: text(2),
  hwn_hidup_mati: text(2),
  n_peneliti_u: text(150),
  n_keahlian: text(250),
  n_kedudukan: text(150),
  n_hp: text(50),
  n_telp_rumah: text(50),
  n_cp: text(150),
  hp_cp: text(50),
  n_email: text(100),
  civitas_unpad: text(1),
  c_jenjang: text(2),
  c_dana: text(50),
  s_dana: text(50),
  c_peruntukan: pick(["", "D", "K", "H", "L", "S", "T", "P"]),
  n_institusi_pengusul: text(150),
  n_alamat_pengusul: text(350),
  hp_pengusul: text(30),
  fax_pengusul: text(30),
  n_email_pengusul: text(80),
  c_peneliti_lain: pick(["", "Y", "N"]),
  n_judul: text(950),
  ver_pro: text(80),
  bidang_ilmu: text(250),
  ringkasan_penelitian: text(20000),
  tujuan_penelitian: text(10000),
  jum_partisipan: text(4000),
  c_multisenter: pick(["", "Y", "N"]),
  c_spu: text(50),
  c_sps: text(50),
  c_kerjasama: pick(["", "1", "2", "3"]),
  v_jum_negara: text(80),
  c_peneliti_asing_stat: pick(["", "Y", "N"]),
  file_izin_asing: text(255),
  file_mou: text(255),
  file_mta: text(255),
  n_tempat_penelitian: text(2000),
  d_awal: dateOnly,
  d_akhir: dateOnly,
  d_rekrutmen: dateOnly,
  c_etik_lain: pick(["", "Y", "N"]),
  c_status_etik_lain: pick(["", "Diterima", "Ditolak"]),
  file_etik_lain: text(255),
  s_rincian_dana: text(20000),
  c_coi: pick(["", "Y", "N"]),
  u_coi: text(4000),
  pembimbing: z.array(pembimbingRow).max(50).optional().default([]),
  peneliti_asing: z.array(asingRow).max(50).optional().default([]),
});

// Required only when the draft is finalised; a half-filled draft may skip them.
const SUBMIT_REQUIRED = {
  c_jenis_subjek: "Jenis subjek",
  c_kelompok: "Kelompok formulir",
  n_peneliti_u: "Nama peneliti utama",
  n_keahlian: "Keahlian",
  n_kedudukan: "Jabatan",
  n_hp: "No HP peneliti utama",
  n_cp: "Nama kontak person",
  hp_cp: "No HP kontak person",
  n_email: "Email kontak person",
  civitas_unpad: "Status civitas Unpad",
  c_jenjang: "Jenjang",
  c_dana: "Sumber dana",
  c_peruntukan: "Peruntukan",
  n_institusi_pengusul: "Asal instansi",
  n_alamat_pengusul: "Alamat instansi",
  n_email_pengusul: "Email instansi",
  c_peneliti_lain: "Status pembimbing",
  n_judul: "Judul penelitian",
  ver_pro: "Versi protokol",
  bidang_ilmu: "Bidang ilmu",
  ringkasan_penelitian: "Ringkasan penelitian",
  tujuan_penelitian: "Tujuan penelitian",
  jum_partisipan: "Jumlah partisipan",
  c_multisenter: "Status multisenter",
  c_kerjasama: "Status kerjasama",
  n_tempat_penelitian: "Tempat penelitian",
  d_awal: "Tanggal mulai",
  d_akhir: "Tanggal selesai",
  d_rekrutmen: "Tanggal rekrutmen",
  c_etik_lain: "Status pengajuan ke komite etik lain",
  s_rincian_dana: "Rincian dana",
  c_coi: "Status conflict of interest",
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(\+62|62|0)8[1-9][0-9]{6,11}$/;

function missingForSubmit(fields) {
  const errors = {};
  for (const [key, label] of Object.entries(SUBMIT_REQUIRED)) {
    if (!String(fields[key] ?? "").trim()) errors[key] = `${label} wajib diisi`;
  }
  for (const key of ["n_email", "n_email_pengusul"]) {
    if (!errors[key] && !EMAIL_RE.test(String(fields[key] ?? "").trim())) {
      errors[key] = "Format email tidak valid";
    }
  }
  for (const key of ["n_hp", "hp_cp"]) {
    if (!errors[key] && !PHONE_RE.test(String(fields[key] ?? "").replace(/[\s-]/g, ""))) {
      errors[key] = "Nomor HP tidak valid (contoh: 08123456789)";
    }
  }
  if (!errors.n_judul && String(fields.n_judul).includes("'")) {
    errors.n_judul = "Jangan gunakan tanda petik tunggal (')";
  }
  return Object.keys(errors).length ? errors : null;
}

// GET /api/pengajuan-baru — the signed-in researcher's submissions.
router.get("/", async (req, res) => {
  const items = await listByUser(req.user.id, { limit: req.query.limit });
  return res.json({ items });
});

// GET /api/pengajuan-baru/limits — column budgets for the main form inputs.
router.get("/limits", async (_req, res) => {
  return res.json({ limits: await mainFormLimits() });
});

// GET /api/pengajuan-baru/:id — one submission (only if it belongs to the caller).
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "ID pengajuan tidak valid." });
  }
  const item = await findByIdForUser(id, req.user.id);
  if (!item) return res.status(404).json({ error: "Pengajuan tidak ditemukan." });
  return res.json({ item });
});

// GET /api/pengajuan-baru/:id/cetak — everything the printable documents show.
router.get("/:id/cetak", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "ID pengajuan tidak valid." });
  }
  const data = await getPrintData(req.user.id, id);
  if (!data) return res.status(404).json({ error: "Pengajuan tidak ditemukan." });
  return res.json(data);
});

// GET /api/pengajuan-baru/:id/sections/:bagian — one sub-form of the submission.
router.get("/:id/sections/:bagian", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "ID pengajuan tidak valid." });
  }
  if (!SECTION_BAGIAN.has(req.params.bagian)) {
    return res.status(404).json({ error: "Bagian formulir tidak dikenal." });
  }
  const data = await getSection(req.user.id, id, req.params.bagian);
  if (!data) return res.status(404).json({ error: "Pengajuan tidak ditemukan." });
  return res.json(data);
});

// PUT /api/pengajuan-baru/:id/sections/:bagian — save one sub-form.
router.put("/:id/sections/:bagian", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "ID pengajuan tidak valid." });
  }
  if (!SECTION_BAGIAN.has(req.params.bagian)) {
    return res.status(404).json({ error: "Bagian formulir tidak dikenal." });
  }
  try {
    const data = await saveSection(req.user.id, id, req.params.bagian, req.body);
    if (!data) return res.status(404).json({ error: "Pengajuan tidak ditemukan." });
    return res.json(data);
  } catch (err) {
    return res.status(err.status ?? 500).json({ error: err.message ?? "Gagal menyimpan isian." });
  }
});

// POST /api/pengajuan-baru — create an unsent draft owned by the caller.
router.post("/", async (req, res) => {
  const parsed = body.safeParse(req.body);
  if (!parsed.success) {
    const fields = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key && !fields[key]) fields[key] = issue.message;
    }
    return res.status(400).json({ error: "Periksa kembali isian formulir.", fields });
  }

  const id = await createForUser(req.user.id, parsed.data, { uid: req.user.uid });
  return res.status(201).json({ id, item: await findByIdForUser(id, req.user.id) });
});

// PUT /api/pengajuan-baru/:id — update a draft that has not been sent yet.
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "ID pengajuan tidak valid." });
  }
  const parsed = body.safeParse(req.body);
  if (!parsed.success) {
    const fields = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key && !fields[key]) fields[key] = issue.message;
    }
    return res.status(400).json({ error: "Periksa kembali isian formulir.", fields });
  }

  try {
    await updateForUser(id, req.user.id, parsed.data, { uid: req.user.uid });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message, fields: err.fields });
    throw err;
  }
  return res.json({ id, item: await findByIdForUser(id, req.user.id) });
});

// POST /api/pengajuan-baru/:id/submit — finalise a draft and put it in the petugas queue.
router.post("/:id/submit", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "ID pengajuan tidak valid." });
  }

  const draft = await findByIdForUser(id, req.user.id);
  if (!draft) return res.status(404).json({ error: "Pengajuan tidak ditemukan." });
  if (draft.statusKode !== "-1") {
    return res.status(409).json({ error: "Pengajuan ini sudah dikirim." });
  }

  const fields = missingForSubmit(draft.fields);
  if (fields) {
    return res.status(400).json({ error: "Lengkapi isian yang wajib sebelum mengirim.", fields });
  }

  const submitted = await submitForUser(id, req.user.id, { uid: req.user.uid });
  if (!submitted) {
    return res.status(409).json({ error: "Pengajuan tidak dapat dikirim. Muat ulang halaman." });
  }
  return res.json({ item: await findByIdForUser(id, req.user.id) });
});

// POST /api/pengajuan-baru/:id/files/:slot — raw binary upload, replaces any existing file.
router.post(
  "/:id/files/:slot",
  express.raw({ type: () => true, limit: MAX_FILE_BYTES }),
  async (req, res) => {
    const id = idFrom(req);
    const { slot } = req.params;
    if (!id) return res.status(400).json({ error: "ID pengajuan tidak valid." });
    if (!FILE_SLOTS.has(slot)) return res.status(400).json({ error: "Jenis dokumen tidak dikenal." });

    const draft = await findByIdForUser(id, req.user.id);
    if (!draft) return res.status(404).json({ error: "Pengajuan tidak ditemukan." });
    if (draft.statusKode !== "-1") {
      return res.status(409).json({ error: "Pengajuan sudah dikirim; dokumen tidak dapat diubah." });
    }

    const ext = sniffImage(req.body);
    if (!ext) return res.status(400).json({ error: "File harus PDF, JPG, atau PNG." });

    const dir = path.join(UPLOAD_DIR, "dokumenpendukung");
    await mkdir(dir, { recursive: true });
    const filename = `${id}-${slot}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    await writeFile(path.join(dir, filename), req.body);

    const saved = await setFileForUser(id, req.user.id, slot, filename);
    if (!saved) return res.status(409).json({ error: "Pengajuan tidak dapat diubah." });

    const previous = String(draft.fields[slot] ?? "").trim();
    if (previous && previous !== filename) {
      await unlink(path.join(dir, path.basename(previous))).catch(() => {});
    }
    return res.json({ filename });
  },
);

// GET /api/pengajuan-baru/:id/files/:slot — stream a stored attachment to its owner.
router.get("/:id/files/:slot", async (req, res) => {
  const id = idFrom(req);
  const { slot } = req.params;
  if (!id) return res.status(400).json({ error: "ID pengajuan tidak valid." });
  if (!FILE_SLOTS.has(slot)) return res.status(400).json({ error: "Jenis dokumen tidak dikenal." });

  const item = await findByIdForUser(id, req.user.id);
  if (!item) return res.status(404).json({ error: "Pengajuan tidak ditemukan." });
  const name = String(item.fields[slot] ?? "").trim();
  if (!name) return res.status(404).json({ error: "Belum ada file." });

  return res.sendFile(
    path.join(UPLOAD_DIR, "dokumenpendukung", path.basename(name)),
    (err) => {
      if (err && !res.headersSent) res.status(404).json({ error: "File tidak ditemukan." });
    },
  );
});

const KPPH_EXT = (buffer) => {
  const image = sniffImage(buffer);
  if (image && image !== "png" && image !== "jpg") return image;
  if (buffer?.[0] === 0x50 && buffer?.[1] === 0x4b) return "docx";
  if (buffer?.[0] === 0xd0 && buffer?.[1] === 0xcf) return "doc";
  return null;
};

// POST /api/pengajuan-baru/:id/kpph — KPPH recommendation file for the animal form.
router.post(
  "/:id/kpph",
  express.raw({ type: () => true, limit: MAX_FILE_BYTES }),
  async (req, res) => {
    const id = idFrom(req);
    if (!id) return res.status(400).json({ error: "ID pengajuan tidak valid." });
    const draft = await findByIdForUser(id, req.user.id);
    if (!draft) return res.status(404).json({ error: "Pengajuan tidak ditemukan." });
    if (draft.statusKode !== "-1") {
      return res.status(409).json({ error: "Pengajuan sudah dikirim; file tidak dapat diubah." });
    }
    const ext = KPPH_EXT(req.body);
    if (!ext) return res.status(400).json({ error: "File harus PDF, DOC, atau DOCX." });

    const dir = path.join(UPLOAD_DIR, "dokumenpendukung");
    await mkdir(dir, { recursive: true });
    const filename = `${id}-kpph-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    await writeFile(path.join(dir, filename), req.body);

    const pool = await getPool();
    const before = await pool
      .request()
      .input("id", id)
      .query(`SELECT TOP 1 n_file_kpph AS name FROM dbo.tm_penelitian_etik_metode_hewan WHERE id_penelitian = @id`);
    if (!before.recordset.length) {
      await unlink(path.join(dir, filename)).catch(() => {});
      return res.status(409).json({ error: "Simpan isian Poin B terlebih dahulu." });
    }
    await pool
      .request()
      .input("id", id)
      .input("name", filename)
      .query(`UPDATE dbo.tm_penelitian_etik_metode_hewan SET n_file_kpph = @name WHERE id_penelitian = @id`);
    const previous = String(before.recordset[0]?.name ?? "").trim();
    if (previous && previous !== filename) {
      await unlink(path.join(dir, path.basename(previous))).catch(() => {});
    }
    return res.json({ filename });
  },
);

// GET /api/pengajuan-baru/:id/kpph — download the KPPH recommendation file.
router.get("/:id/kpph", async (req, res) => {
  const id = idFrom(req);
  if (!id) return res.status(400).json({ error: "ID pengajuan tidak valid." });
  const item = await findByIdForUser(id, req.user.id);
  if (!item) return res.status(404).json({ error: "Pengajuan tidak ditemukan." });
  const pool = await getPool();
  const r = await pool
    .request()
    .input("id", id)
    .query(`SELECT TOP 1 n_file_kpph AS name FROM dbo.tm_penelitian_etik_metode_hewan WHERE id_penelitian = @id`);
  const name = String(r.recordset[0]?.name ?? "").trim();
  if (!name) return res.status(404).json({ error: "Belum ada file." });
  return res.sendFile(
    path.join(UPLOAD_DIR, "dokumenpendukung", path.basename(name)),
    (err) => {
      if (err && !res.headersSent) res.status(404).json({ error: "File tidak ditemukan." });
    },
  );
});

// GET /api/pengajuan-baru/:id/dokumen — the upload-documents form (legacy PROPOSAL slots).
router.get("/:id/dokumen", async (req, res) => {
  const id = idFrom(req);
  if (!id) return res.status(400).json({ error: "ID pengajuan tidak valid." });
  const item = await findByIdForUser(id, req.user.id);
  if (!item) return res.status(404).json({ error: "Pengajuan tidak ditemukan." });
  return res.json({
    item: { id: item.id, kode: item.kode, judul: item.fields.n_judul, peneliti: item.fields.n_peneliti_u },
    dokumen: await listDokumen(id),
  });
});

// POST /api/pengajuan-baru/:id/dokumen/:urutan — replace one document (PDF/JPG/PNG).
router.post(
  "/:id/dokumen/:urutan",
  express.raw({ type: () => true, limit: MAX_FILE_BYTES }),
  async (req, res) => {
    const id = idFrom(req);
    const urutan = Number(req.params.urutan);
    if (!id || !DOKUMEN_URUTAN.has(urutan)) {
      return res.status(400).json({ error: "Jenis dokumen tidak dikenal." });
    }
    const item = await findByIdForUser(id, req.user.id);
    if (!item) return res.status(404).json({ error: "Pengajuan tidak ditemukan." });

    const ext = sniffImage(req.body);
    if (!ext) return res.status(400).json({ error: "File harus PDF, JPG, atau PNG." });

    await mkdir(PROPOSAL_DIR, { recursive: true });
    const filename = `${id}-${urutan}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    await writeFile(path.join(PROPOSAL_DIR, filename), req.body);

    const previous = (await listDokumen(id)).find((d) => d.urutan === urutan)?.file ?? "";
    await putDokumen(id, urutan, {
      n_judul: String(req.query.nama ?? "").trim() || `${DOKUMEN_JENIS[urutan]}.${ext}`,
      n_file: filename,
      ukuran: req.body.length,
    });
    if (previous && previous !== filename) {
      await unlink(path.join(PROPOSAL_DIR, path.basename(previous))).catch(() => {});
    }
    return res.json({ urutan, file: filename });
  },
);

// GET /api/pengajuan-baru/:id/dokumen/:urutan/file — download one stored document.
router.get("/:id/dokumen/:urutan/file", async (req, res) => {
  const id = idFrom(req);
  const urutan = Number(req.params.urutan);
  if (!id || !DOKUMEN_URUTAN.has(urutan)) {
    return res.status(400).json({ error: "Jenis dokumen tidak dikenal." });
  }
  const item = await findByIdForUser(id, req.user.id);
  if (!item) return res.status(404).json({ error: "Pengajuan tidak ditemukan." });
  const doc = (await listDokumen(id)).find((d) => d.urutan === urutan);
  if (!doc?.file) return res.status(404).json({ error: "Belum ada file." });
  return res.download(
    path.join(PROPOSAL_DIR, path.basename(doc.file)),
    path.basename(doc.nama || doc.file),
    (err) => {
      if (err && !res.headersSent) res.status(404).json({ error: "File tidak ditemukan." });
    },
  );
});

// DELETE /api/pengajuan-baru/:id/dokumen/:urutan — drop one document.
router.delete("/:id/dokumen/:urutan", async (req, res) => {
  const id = idFrom(req);
  const urutan = Number(req.params.urutan);
  if (!id || !DOKUMEN_URUTAN.has(urutan)) {
    return res.status(400).json({ error: "Jenis dokumen tidak dikenal." });
  }
  const item = await findByIdForUser(id, req.user.id);
  if (!item) return res.status(404).json({ error: "Pengajuan tidak ditemukan." });
  const removed = await deleteDokumen(id, urutan);
  if (removed) {
    await unlink(path.join(PROPOSAL_DIR, path.basename(removed))).catch(() => {});
  }
  return res.status(204).end();
});

// DELETE /api/pengajuan-baru/:id — soft-delete a draft (status -1), sent or not.
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "ID pengajuan tidak valid." });
  }
  const draft = await findByIdForUser(id, req.user.id);
  const removed = await deleteDraft(id, req.user.id, { uid: req.user.uid });
  if (!removed) {
    return res.status(404).json({ error: "Draf tidak ditemukan atau sudah dikirim." });
  }
  await Promise.all(
    Array.from(FILE_SLOTS).map((slot) => {
      const name = draft?.fields?.[slot];
      if (!name) return null;
      return unlink(path.join(UPLOAD_DIR, "dokumenpendukung", path.basename(name))).catch(() => {});
    }),
  );
  return res.status(204).end();
});

export default router;
