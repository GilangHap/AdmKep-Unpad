import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import ViteExpress from "vite-express";
import authRoutes from "./routes/auth.js";
import statusRoutes from "./routes/status.js";
import pengajuanBaruRoutes from "./routes/pengajuanBaru.js";
import { getPool } from "./lib/db.js";
import { attachUser } from "./lib/session.js";

const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use(attachUser);

app.use("/api/auth", authRoutes);
app.use("/api/status", statusRoutes);
app.use("/api/pengajuan-baru", pengajuanBaruRoutes);

app.get("/api/health", async (req, res) => {
  try {
    await getPool();
    res.json({ ok: true, db: "up" });
  } catch {
    res.status(503).json({ ok: false, db: "down" });
  }
});

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Endpoint tidak ditemukan." });
  }
  return next();
});

// JSON body errors (malformed payload) must not fall through to the HTML error page.
app.use((err, req, res, next) => {
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Format permintaan tidak valid." });
  }
  if (err?.type === "entity.too.large") {
    return res.status(413).json({ error: "File terlalu besar (maks 10 MB)." });
  }
  console.error(err);
  return res.status(500).json({ error: "Terjadi kesalahan pada server." });
});

try {
  await getPool();
} catch (err) {
  console.error("Tidak dapat terhubung ke SQL Server. Periksa DB_* di .env.");
  console.error(err.message);
  process.exit(1);
}

ViteExpress.listen(app, 3000, () =>
  console.log("Server is listening on port 3000..."),
);
