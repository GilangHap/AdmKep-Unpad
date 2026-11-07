// dbo.t_user_session — login sessions for this portal (additive table).
import { getPool } from "../db.js";

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
