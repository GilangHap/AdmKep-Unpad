import { Router } from "express";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import {
  findByEmail,
  createAccount,
  updateAccount,
  updateProfile,
  activateAccount,
  isReviewerEmail,
  setPassword,
  groupName,
} from "../lib/repositories/users.js";
import {
  saveActivation,
  findActivation,
  useActivation,
  revokeActivationsFor,
  countActivationsSince,
  latestActivationFor,
} from "../lib/repositories/activations.js";
import { saveResetRequest, countResetsSince } from "../lib/repositories/passwordResets.js";
import { createSession, deleteSession, deleteExpiredSessions } from "../lib/repositories/sessions.js";
import {
  SESSION_COOKIE,
  newSessionToken,
  sessionHash,
  sessionTtl,
  setSessionCookie,
  clearSessionCookie,
  publicUser,
  requireAuth,
} from "../lib/session.js";
import { generateToken, hashToken } from "../lib/tokens.js";
import { sendActivationEmail, sendPasswordResetEmail } from "../lib/mailer.js";

const router = Router();

const TOKEN_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours
const RESEND_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RESEND_LIMIT = 3; // per hour, per email
const BCRYPT_ROUNDS = 12;

const registerBody = z
  .object({
    email: z.string().trim().email().max(50),
    name: z.string().trim().min(1).max(50),
    gender: z.enum(["L", "P"]),
    phone: z.string().trim().min(1).max(20),
    institution: z.string().trim().min(1).max(100),
    password: z.string().min(8).max(30),
    confirmPassword: z.string().min(1),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi kata sandi tidak sama",
  });

const emailBody = z.object({ email: z.string().trim().email().max(50) });

const loginBody = z.object({
  email: z.string().trim().email().max(100),
  password: z.string().min(1).max(200),
});

const resetBody = z.object({
  email: z.string().trim().email().max(100),
  phone: z.string().trim().min(1).max(50),
  institution: z.string().trim().min(1).max(200),
  reason: z.string().trim().max(100).optional().default(""),
  group: z.enum(["PEMOHON", "REVIEWER"]),
});

const profileBody = z.object({
  name: z.string().trim().min(1).max(50),
  gender: z.enum(["L", "P"]),
  phone: z.string().trim().min(1).max(20),
  institution: z.string().trim().min(1).max(100),
});

const changePasswordBody = z
  .object({
    currentPassword: z.string().min(1).max(200),
    password: z.string().min(8).max(30),
    confirmPassword: z.string().min(1),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi kata sandi tidak sama",
  });

const digits = (value) => String(value ?? "").replace(/\D/g, "");
const looseText = (value) => String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();

/** One message for every register outcome â€” never reveals whether the email exists. */
const GENERIC_SENT =
  "Jika email tersebut belum terdaftar, kami sudah mengirim tautan aktivasi. Periksa kotak masuk Anda.";

async function issueActivation(account) {
  await revokeActivationsFor(account.email);

  const token = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await saveActivation({
    tokenHash: hashToken(token),
    email: account.email,
    expiresAt,
    usedAt: null,
    createdAt: new Date(),
  });

  await sendActivationEmail({
    to: account.email,
    name: account.name,
    token,
    expiresAt,
  });

  return expiresAt;
}

// POST /api/auth/login  â€” verifies against dbo.t_user (legacy bcrypt hashes included).
router.post("/login", async (req, res) => {
  const parsed = loginBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Masukkan email dan kata sandi yang valid." });
  }

  const { email, password } = parsed.data;
  const account = await findByEmail(email);

  // bcryptjs verifies both $2a$/$2b$ and the legacy PHP $2y$ prefix.
  // ponytail: assumes legacy hashes are bcrypt (t_user.password is varchar(60)).
  // If old rows turn out to be MD5/other, add a fallback + rehash on success.
  const valid = Boolean(account?.passwordHash) && (await bcrypt.compare(password, account.passwordHash));

  if (!valid) {
    return res.status(401).json({ error: "Email atau kata sandi salah." });
  }
  if (account.status !== "ACTIVE") {
    return res.status(403).json({
      error: "Akun Anda belum aktif. Periksa tautan aktivasi di email Anda.",
      reason: "pending",
    });
  }

  // Session replaces the old "trust the client" flow: an opaque token in an httpOnly
  // cookie, stored as a hash, so the browser never holds anything replayable.
  const token = newSessionToken();
  const ttl = sessionTtl(Boolean(req.body?.remember));
  await createSession({
    tokenHash: sessionHash(token),
    userId: account.id,
    expiresAt: new Date(Date.now() + ttl),
  });
  setSessionCookie(res, token, ttl);
  deleteExpiredSessions().catch(() => {});

  const roleName = await groupName(account.cGroup);
  return res.json({ user: publicUser(account, roleName) });
});

// GET /api/auth/me — who am I (used on app load and after refresh)
router.get("/me", requireAuth, async (req, res) => {
  const roleName = await groupName(req.user.cGroup);
  return res.json({ user: publicUser(req.user, roleName) });
});

// PATCH /api/auth/profile — the signed-in account edits its own contact details.
router.patch("/profile", requireAuth, async (req, res) => {
  const parsed = profileBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Periksa kembali data profil Anda.",
      fields: parsed.error.flatten().fieldErrors,
    });
  }

  const account = req.user;
  Object.assign(account, parsed.data);
  await updateProfile(account);

  const roleName = res.locals.roleName ?? (await groupName(account.cGroup));
  return res.json({ user: publicUser(account, roleName) });
});

// POST /api/auth/change-password — requires the current password, never emails a new one.
router.post("/change-password", requireAuth, async (req, res) => {
  const parsed = changePasswordBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Periksa kembali kata sandi Anda.",
      fields: parsed.error.flatten().fieldErrors,
    });
  }

  const { currentPassword, password } = parsed.data;
  const valid = await bcrypt.compare(currentPassword, req.user.passwordHash);
  if (!valid) {
    return res.status(400).json({
      error: "Kata sandi saat ini salah.",
      fields: { currentPassword: ["Kata sandi saat ini salah"] },
    });
  }

  await setPassword(req.user, await bcrypt.hash(password, BCRYPT_ROUNDS));
  return res.json({ message: "Kata sandi berhasil diperbarui." });
});

// POST /api/auth/logout
router.post("/logout", async (req, res) => {
  if (req.sessionTokenHash) await deleteSession(req.sessionTokenHash).catch(() => {});
  clearSessionCookie(res);
  return res.status(204).end();
});

// POST /api/auth/request-password-reset
// Verifies identity against registration data, then emails a fresh temporary password.
// Always answers the same way so the endpoint cannot be used to probe accounts.
const RESET_LIMIT = 3;
const RESET_WINDOW_MS = 60 * 60 * 1000;
const RESET_MESSAGE =
  "Jika data cocok dengan akun terdaftar, kata sandi baru sudah dikirim ke email tersebut.";

router.post("/request-password-reset", async (req, res) => {
  const parsed = resetBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Lengkapi data verifikasi terlebih dahulu." });
  }

  const { email, phone, institution, reason, group } = parsed.data;
  const now = Date.now();

  const recent = await countResetsSince(email, new Date(now - RESET_WINDOW_MS));
  if (recent >= RESET_LIMIT) {
    return res.status(429).json({
      error: "Terlalu banyak permintaan. Coba lagi dalam satu jam.",
    });
  }

  const account = await findByEmail(email);
  const reviewer = account ? await isReviewerEmail(email) : false;

  const matches =
    Boolean(account) &&
    account.status === "ACTIVE" &&
    digits(account.phone) === digits(phone) &&
    looseText(account.institution) === looseText(institution) &&
    (group === "REVIEWER") === reviewer;

  // Log every attempt (matched or not) so the throttle cannot be bypassed.
  await saveResetRequest({ email, reason, matched: matches, requestedAt: new Date(now) });

  if (!matches) return res.status(202).json({ message: RESET_MESSAGE, email });

  const temporary = randomBytes(9).toString("base64url"); // 12 chars, url-safe
  await setPassword(account, await bcrypt.hash(temporary, BCRYPT_ROUNDS));
  await sendPasswordResetEmail({ to: account.email, name: account.name, password: temporary });

  return res.status(202).json({ message: RESET_MESSAGE, email: account.email });
});

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const parsed = registerBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Data pendaftaran belum lengkap.",
      fields: parsed.error.flatten().fieldErrors,
    });
  }

  const data = parsed.data;
  const existing = await findByEmail(data.email);

  if (existing?.status === "ACTIVE") {
    // Do not confirm the account exists; point the person at the login page instead.
    return res.status(409).json({
      error:
        "Email ini sudah terdaftar. Silakan masuk, atau gunakan â€œLupa kata sandiâ€ bila Anda tidak ingat kata sandinya.",
    });
  }

  // A pending duplicate re-issues a link rather than creating a second record.
  // Keep the record's details and password in sync when someone re-registers.
  let account = existing;
  if (account) {
    account.passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    account.name = data.name;
    account.gender = data.gender;
    account.phone = data.phone;
    account.institution = data.institution;
    await updateAccount(account);
  } else {
    account = await createAccount({
      ...data,
      passwordHash: await bcrypt.hash(data.password, BCRYPT_ROUNDS),
    });
  }

  const recent = await countActivationsSince(
    account.email,
    new Date(Date.now() - RESEND_WINDOW_MS),
  );
  if (recent >= RESEND_LIMIT) {
    return res.status(429).json({
      error: "Terlalu banyak permintaan aktivasi. Coba lagi dalam satu jam.",
    });
  }

  const expiresAt = await issueActivation(account);

  return res.status(201).json({
    message:
      "Pendaftaran berhasil. Kami mengirim tautan aktivasi ke email Anda â€” periksa kotak masuk (dan folder spam).",
    email: account.email,
    status: account.status,
    expiresAt,
  });
});

// POST /api/auth/resend-activation
router.post("/resend-activation", async (req, res) => {
  const parsed = emailBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Masukkan alamat email yang valid." });
  }

  const account = await findByEmail(parsed.data.email);

  // Same answer either way, so the endpoint cannot be used to probe for accounts.
  if (!account || account.status === "ACTIVE") {
    return res.status(202).json({ message: GENERIC_SENT });
  }

  const recent = await countActivationsSince(
    account.email,
    new Date(Date.now() - RESEND_WINDOW_MS),
  );
  if (recent >= RESEND_LIMIT) {
    return res.status(429).json({
      error: "Terlalu banyak permintaan aktivasi. Coba lagi dalam satu jam.",
    });
  }

  const expiresAt = await issueActivation(account);
  return res.status(202).json({ message: GENERIC_SENT, expiresAt });
});

// POST /api/auth/activate  { token }
router.post("/activate", async (req, res) => {
  const token = typeof req.body?.token === "string" ? req.body.token : "";
  if (!token) {
    return res.status(400).json({ error: "Tautan aktivasi tidak valid.", reason: "missing" });
  }

  const record = await findActivation(hashToken(token));

  if (!record) {
    return res.status(400).json({ error: "Tautan aktivasi tidak valid.", reason: "invalid" });
  }

  const account = await findByEmail(record.email);
  if (!account) {
    return res.status(400).json({ error: "Akun tidak ditemukan.", reason: "invalid" });
  }

  // Idempotent: a second visit (React StrictMode, a browser retry, a reload) must not
  // turn a successful activation into an error.
  if (record.usedAt) {
    if (account.status === "ACTIVE") {
      return res.json({
        message: "Akun Anda sudah aktif. Silakan masuk.",
        email: account.email,
        name: account.name,
      });
    }
    return res.status(409).json({
      error: "Tautan ini sudah pernah dipakai. Silakan masuk, atau minta tautan baru.",
      reason: "used",
    });
  }

  if (record.expiresAt < new Date()) {
    return res.status(410).json({
      error: "Tautan aktivasi sudah kedaluwarsa. Minta tautan baru di bawah.",
      reason: "expired",
      email: record.email,
    });
  }

  await useActivation(record.tokenHash);
  if (account.status !== "ACTIVE") await activateAccount(account);

  return res.json({
    message: "Akun Anda sudah aktif. Silakan masuk.",
    email: account.email,
    name: account.name,
  });
});

// GET /api/auth/activation-status?email=  â€” used by the "check your email" screen
router.get("/activation-status", async (req, res) => {
  const parsed = emailBody.safeParse({ email: req.query.email ?? "" });
  if (!parsed.success) return res.status(400).json({ error: "Email tidak valid." });

  const account = await findByEmail(parsed.data.email);
  if (!account) return res.json({ status: "unknown" });

  const latest = await latestActivationFor(account.email);
  return res.json({
    status: account.status,
    expiresAt: latest?.expiresAt ?? null,
    canResend:
      (await countActivationsSince(account.email, new Date(Date.now() - RESEND_WINDOW_MS))) <
      RESEND_LIMIT,
  });
});

export default router;
