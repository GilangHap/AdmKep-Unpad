// dbo.t_user_password_reset — audit + throttle log for password resets (additive table).
import { getPool } from "../db.js";

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
