// dbo.t_user — legacy accounts plus the registration fields added by this portal.
// ponytail: email lookup scans t_user (small legacy table, no email index).
// Add an index on email/userid when the table grows.
import { randomUUID } from "node:crypto";
import { getPool } from "../db.js";

/** @typedef {{ id: number, uid: string, email: string, name: string, gender: string, phone: string, institution: string, cGroup: number | null, passwordHash: string, status: "PENDING" | "ACTIVE", createdAt: Date, activatedAt: Date | null }} Account */

// t_user.c_group → tr_otoritas_user.id; 6 = "Anggota".
const USER_GROUP_ANGGOTA = 6;

const isActive = (status) => String(status ?? "").trim().toLowerCase() === "a";

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

export async function findById(id) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("id", id)
    .query(`SELECT TOP (1) ${ACCOUNT_COLUMNS} FROM dbo.t_user WHERE id = @id`);
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

/** Persists edits an active account makes to its own profile (never the password). */
export async function updateProfile(account) {
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
    .query(`
      UPDATE dbo.t_user
      SET uid = @uid, nama = @name, c_gender = @gender, n_instansi = @institution,
          no_kontak = @phone, mdate = GETDATE(), muid = @uid
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
