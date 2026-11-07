// Run against the real SQL Server: node --env-file=.env scripts/db-check.mjs
// Creates the additive schema, then verifies the t_user mapping is readable.
import assert from "node:assert/strict";
import { getPool } from "../src/server/lib/db.js";
import { findByEmail } from "../src/server/lib/repositories/users.js";
import { countActivationsSince } from "../src/server/lib/repositories/activations.js";
import { searchEthics } from "../src/server/lib/repositories/ethics.js";

const pool = await getPool();
const tables = await pool
  .request()
  .query(
    "SELECT name FROM sys.tables WHERE name IN ('t_user', 't_user_activation', 't_user_password_reset')",
  );
const names = tables.recordset.map((r) => r.name);
assert.ok(names.includes("t_user"), "t_user tidak ditemukan di DB_NAME ini");
assert.ok(names.includes("t_user_activation"), "t_user_activation gagal dibuat");
assert.ok(names.includes("t_user_password_reset"), "t_user_password_reset gagal dibuat");

const cols = await pool.request().query("SELECT 1 AS ok FROM sys.columns WHERE object_id = OBJECT_ID('dbo.t_user') AND name = 'c_gender'");
assert.equal(cols.recordset.length, 1, "kolom c_gender gagal ditambahkan");

const fk = await pool
  .request()
  .query("SELECT 1 AS ok FROM sys.foreign_keys WHERE name = 'FK_t_user_c_group'");
assert.equal(fk.recordset.length, 1, "FK t_user.c_group -> tr_otoritas_user belum aktif");

assert.equal(await findByEmail("nobody@example.invalid"), null);

const counts = await pool
  .request()
  .query("SELECT (SELECT COUNT(*) FROM dbo.t_user) AS users, (SELECT COUNT(*) FROM dbo.t_user_activation) AS activations");
assert.equal(await countActivationsSince("nobody@example.invalid", new Date(0)), 0);
assert.ok(Array.isArray(await searchEthics({ category: "JUDUL", query: "zzz-no-match" })));

console.log("OK", counts.recordset[0]);
await pool.close();
