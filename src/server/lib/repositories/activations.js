// dbo.t_user_activation — email activation tokens (additive table).
import { getPool } from "../db.js";

/** @typedef {{ tokenHash: string, email: string, expiresAt: Date, usedAt: Date | null, createdAt: Date }} Activation */

const toActivation = (r) =>
  r && {
    tokenHash: r.token_hash,
    email: r.email,
    expiresAt: r.expires_at,
    usedAt: r.used_at,
    createdAt: r.created_at,
  };

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
