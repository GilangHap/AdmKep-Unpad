// SQL Server store for accounts and pending activations, backed by the legacy
// komitik_backup database. Accounts live in dbo.t_user (old rows included);
// activation tokens live in the additive dbo.t_user_activation table.
// ponytail: login emailâ†’account lookup scans t_user (small table, legacy schema has
// no email index). Add an index on email/userid when the table grows.
import { randomUUID } from "node:crypto";
import { getPool } from "./db.js";

/** @typedef {{ id: number, uid: string, email: string, name: string, gender: string, phone: string, institution: string, passwordHash: string, status: "PENDING" | "ACTIVE", createdAt: Date, activatedAt: Date | null }} Account */
/** @typedef {{ tokenHash: string, email: string, expiresAt: Date, usedAt: Date | null, createdAt: Date }} Activation */

const isActive = (status) => String(status ?? "").trim().toLowerCase() === "a";

// t_user.c_group â†’ tr_otoritas_user.id; 6 = "Anggota".
const USER_GROUP_ANGGOTA = 6;

// uid is the legacy 32-char audit id. It doubles as cuid on insert and muid on edit.
const newUid = () => randomUUID().replaceAll("-", "");
const actorUid = (account) => account.uid || (account.uid = newUid());

const toAccount = (r) => ({
  id: r.id,
  uid: (r.uid ?? "").trim(),
  email: r.email || r.userid,
  name: r.nama ?? "",
  gender: (r.c_gender ?? "").trim(),
  phone: r.no_kontak ?? "",
  institution: r.n_instansi ?? "",
  cGroup: r.c_group ?? null,
  passwordHash: r.password ?? "",
  status: isActive(r.status) ? "ACTIVE" : "PENDING",
  createdAt: r.cdate,
  activatedAt: isActive(r.status) ? r.cdate : null,
});

const toActivation = (r) =>
  r && {
    tokenHash: r.token_hash,
    email: r.email,
    expiresAt: r.expires_at,
    usedAt: r.used_at,
    createdAt: r.created_at,
  };

const ACCOUNT_COLUMNS =
  "id, uid, userid, nama, email, c_gender, c_group, n_instansi, password, status, no_kontak, cdate";

const ACCOUNT_COLUMNS_INSERTED = ACCOUNT_COLUMNS.split(", ")
  .map((c) => `INSERTED.${c}`)
  .join(", ");

export async function findByEmail(email) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("email", email.trim().toLowerCase())
    .query(`
      SELECT TOP (1) ${ACCOUNT_COLUMNS}
      FROM dbo.t_user
      WHERE LOWER(email) = @email OR LOWER(userid) = @email
      ORDER BY CASE WHEN status = 'a' THEN 0 ELSE 1 END, id DESC
    `);
  return result.recordset[0] ? toAccount(result.recordset[0]) : null;
}

export async function createAccount(data) {
  const pool = await getPool();
  const uid = newUid();
  const result = await pool
    .request()
    .input("uid", uid)
    .input("cGroup", USER_GROUP_ANGGOTA)
    .input("email", data.email.trim())
    .input("name", data.name.trim())
    .input("gender", data.gender)
    .input("institution", data.institution.trim())
    .input("phone", data.phone.trim())
    .input("passwordHash", data.passwordHash)
    .query(`
      INSERT INTO dbo.t_user
        (uid, userid, nama, email, c_group, c_gender, n_instansi, password, status, no_kontak, cdate, cuid, mdate, muid)
      OUTPUT ${ACCOUNT_COLUMNS_INSERTED}
      VALUES
        (@uid, @email, @name, @email, @cGroup, @gender,
         @institution, @passwordHash, 'n', @phone, GETDATE(), @uid, NULL, NULL)
    `);
  return toAccount(result.recordset[0]);
}

/** Persists edits to a still-unactivated registration. */
export async function updateAccount(account) {
  const pool = await getPool();
  const uid = actorUid(account);
  await pool
    .request()
    .input("id", account.id)
    .input("uid", uid)
    .input("name", account.name.trim())
    .input("gender", account.gender)
    .input("institution", account.institution.trim())
    .input("phone", account.phone.trim())
    .input("passwordHash", account.passwordHash)
    .query(`
      UPDATE dbo.t_user
      SET uid = @uid, nama = @name, c_gender = @gender, n_instansi = @institution,
          password = @passwordHash, no_kontak = @phone, mdate = GETDATE(), muid = @uid
      WHERE id = @id
    `);
  return account;
}

export async function activateAccount(account) {
  const pool = await getPool();
  const uid = actorUid(account);
  await pool
    .request()
    .input("id", account.id)
    .input("uid", uid)
    .query(`
      UPDATE dbo.t_user
      SET uid = @uid, status = 'a', mdate = GETDATE(), muid = @uid
      WHERE id = @id
    `);
  account.status = "ACTIVE";
  account.activatedAt = new Date();
  return account;
}

export async function saveActivation(record) {
  const pool = await getPool();
  await pool
    .request()
    .input("tokenHash", record.tokenHash)
    .input("email", record.email)
    .input("expiresAt", record.expiresAt)
    .input("usedAt", record.usedAt)
    .input("createdAt", record.createdAt)
    .query(`
      INSERT INTO dbo.t_user_activation (token_hash, email, expires_at, used_at, created_at)
      VALUES (@tokenHash, @email, @expiresAt, @usedAt, @createdAt)
    `);
  return record;
}

export async function findActivation(tokenHash) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("tokenHash", tokenHash)
    .query(`
      SELECT token_hash, email, expires_at, used_at, created_at
      FROM dbo.t_user_activation
      WHERE token_hash = @tokenHash
    `);
  return toActivation(result.recordset[0]);
}

export async function useActivation(tokenHash) {
  const pool = await getPool();
  await pool
    .request()
    .input("tokenHash", tokenHash)
    .query(`
      UPDATE dbo.t_user_activation SET used_at = SYSDATETIME()
      WHERE token_hash = @tokenHash AND used_at IS NULL
    `);
  return findActivation(tokenHash);
}

/** Invalidates any other pending activation for the same email (one live link at a time). */
export async function revokeActivationsFor(email) {
  const pool = await getPool();
  await pool
    .request()
    .input("email", email.trim().toLowerCase())
    .query(`
      UPDATE dbo.t_user_activation SET used_at = SYSDATETIME()
      WHERE LOWER(email) = @email AND used_at IS NULL
    `);
}

export async function countActivationsSince(email, since) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("email", email.trim().toLowerCase())
    .input("since", since)
    .query(`
      SELECT COUNT(*) AS n FROM dbo.t_user_activation
      WHERE LOWER(email) = @email AND created_at >= @since
    `);
  return result.recordset[0].n;
}

export async function latestActivationFor(email) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("email", email.trim().toLowerCase())
    .query(`
      SELECT TOP (1) token_hash, email, expires_at, used_at, created_at
      FROM dbo.t_user_activation
      WHERE LOWER(email) = @email
      ORDER BY created_at DESC
    `);
  return toActivation(result.recordset[0]);
}

export async function setPassword(account, passwordHash) {
  const pool = await getPool();
  const uid = actorUid(account);
  await pool
    .request()
    .input("id", account.id)
    .input("uid", uid)
    .input("passwordHash", passwordHash)
    .query(`
      UPDATE dbo.t_user
      SET uid = @uid, password = @passwordHash, mdate = GETDATE(), muid = @uid
      WHERE id = @id
    `);
}

/** Reviewer accounts are the ones listed in tm_reviewer (legacy reviewer registry). */
export async function isReviewerEmail(email) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("email", email.trim().toLowerCase())
    .query(`
      SELECT TOP (1) 1 AS found FROM dbo.tm_reviewer
      WHERE LOWER(LTRIM(RTRIM(n_email))) = @email
        AND (c_statusdelete IS NULL OR c_statusdelete <> 'Y')
    `);
  return result.recordset.length > 0;
}

export async function saveResetRequest({ email, reason, matched, requestedAt }) {
  const pool = await getPool();
  await pool
    .request()
    .input("email", email.trim().toLowerCase())
    .input("reason", reason)
    .input("matched", matched)
    .input("requestedAt", requestedAt)
    .query(`
      INSERT INTO dbo.t_user_password_reset (email, reason, matched, requested_at)
      VALUES (@email, @reason, @matched, @requestedAt)
    `);
}

export async function countResetsSince(email, since) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("email", email.trim().toLowerCase())
    .input("since", since)
    .query(`
      SELECT COUNT(*) AS n FROM dbo.t_user_password_reset
      WHERE LOWER(email) = @email AND requested_at >= @since
    `);
  return result.recordset[0].n;
}

/** Role label for a c_group id; falls back to the numeric group. */
export async function groupName(cGroup) {
  if (cGroup == null) return "Anggota";
  const pool = await getPool();
  const result = await pool
    .request()
    .input("id", cGroup)
    .query("SELECT TOP (1) nama FROM dbo.tr_otoritas_user WHERE id = @id");
  return result.recordset[0]?.nama?.trim() || `Grup ${cGroup}`;
}

export async function findById(id) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("id", id)
    .query(`SELECT TOP (1) ${ACCOUNT_COLUMNS} FROM dbo.t_user WHERE id = @id`);
  return result.recordset[0] ? toAccount(result.recordset[0]) : null;
}

/* ---------- sessions ---------- */

export async function createSession({ tokenHash, userId, expiresAt }) {
  const pool = await getPool();
  await pool
    .request()
    .input("tokenHash", tokenHash)
    .input("userId", userId)
    .input("expiresAt", expiresAt)
    .query(`
      INSERT INTO dbo.t_user_session (token_hash, user_id, expires_at)
      VALUES (@tokenHash, @userId, @expiresAt)
    `);
}

/** Returns the session row only when it exists and has not expired. */
export async function findSession(tokenHash) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("tokenHash", tokenHash)
    .query(`
      SELECT TOP (1) token_hash, user_id, expires_at, last_seen_at
      FROM dbo.t_user_session
      WHERE token_hash = @tokenHash AND expires_at > SYSDATETIME()
    `);
  return result.recordset[0] ?? null;
}

export async function touchSession(tokenHash) {
  const pool = await getPool();
  await pool
    .request()
    .input("tokenHash", tokenHash)
    .query("UPDATE dbo.t_user_session SET last_seen_at = SYSDATETIME() WHERE token_hash = @tokenHash");
}

export async function deleteSession(tokenHash) {
  const pool = await getPool();
  await pool
    .request()
    .input("tokenHash", tokenHash)
    .query("DELETE FROM dbo.t_user_session WHERE token_hash = @tokenHash");
}

export async function deleteExpiredSessions() {
  const pool = await getPool();
  await pool.request().query("DELETE FROM dbo.t_user_session WHERE expires_at <= SYSDATETIME()");
}
/** Escapes LIKE metacharacters so user input is matched literally. */
const likeTerm = (value) => `%${value.replace(/[%_[]/g, (c) => `[${c}]`)}%`;

/**
 * Public status lookup over dbo.tm_penelitian_etik. Excludes soft-deleted rows and
 * caps the result set: this endpoint is unauthenticated.
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

