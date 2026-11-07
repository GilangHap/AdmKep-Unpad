import { Router } from "express";
import { z } from "zod";
import { searchEthics } from "../lib/repositories/ethics.js";

const router = Router();

const searchQuery = z.object({
  category: z.enum(["JUDUL", "PENELITI", "KODE"]),
  query: z.string().trim().min(3).max(100),
});

// GET /api/status/search?category=JUDUL&query=...  (public status check)
router.get("/search", async (req, res) => {
  const parsed = searchQuery.safeParse({
    category: req.query.category,
    query: req.query.query ?? "",
  });
  if (!parsed.success) {
    return res.status(400).json({ error: "Masukkan minimal 3 karakter untuk mencari." });
  }

  const results = await searchEthics(parsed.data);
  return res.json({ results, total: results.length, ...parsed.data });
});

export default router;
