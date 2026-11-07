import { createHash, randomBytes } from "node:crypto";
import { findSession, touchSession, deleteSession } from "./repositories/sessions.js";
import { findById, groupName } from "./repositories/users.js";

export const SESSION_COOKIE = "kepadm_sid";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const REMEMBER_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const hash = (token) => createHash("sha256").update(token).digest("hex");
const isProd = () => process.env.NODE_ENV === "production";

/** Reads the session cookie without adding a dependency. */
export function parseCookies(header = "") {
  return header.split(";").reduce((acc, part) => {
    const i = part.indexOf("=");
    if (i < 0) return acc;
    const k = part.slice(0, i).trim();
    if (k) acc[k] = decodeURIComponent(part.slice(i + 1).trim());
    return acc;
  }, {});
}

export function newSessionToken() {
  return randomBytes(32).toString("base64url");
}

export const sessionHash = hash;

export function sessionTtl(remember) {
  return remember ? REMEMBER_TTL_MS : SESSION_TTL_MS;
}

export function setSessionCookie(res, token, maxAgeMs) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd(),
    path: "/",
    maxAge: maxAgeMs,
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, { path: "/", sameSite: "lax", secure: isProd() });
}

/** Shape sent to the browser: never includes the password hash or internal ids. */
export function publicUser(account, roleName) {
  return {
    email: account.email,
    name: account.name,
    institution: account.institution,
    phone: account.phone,
    gender: account.gender,
    cGroup: account.cGroup,
    role: roleName,
    initials: initialsOf(account.name, account.email),
  };
}

export function initialsOf(name, email) {
  const clean = String(name ?? "").trim();
  if (clean) {
    const parts = clean.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase() || clean.slice(0, 1).toUpperCase();
  }
  return String(email ?? "?").slice(0, 2).toUpperCase();
}

/**
 * Attaches req.user when a valid session cookie is present. Never throws:
 * a DB hiccup must degrade to "not logged in", not a 500 on every request.
 */
export async function attachUser(req, res, next) {
  req.user = null;
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (!token) return next();

  try {
    const tokenHash = hash(token);
    const session = await findSession(tokenHash);
    if (!session) {
      clearSessionCookie(res);
      return next();
    }

    const account = await findById(session.user_id);
    if (!account || account.status !== "ACTIVE") {
      await deleteSession(tokenHash);
      clearSessionCookie(res);
      return next();
    }

    req.user = account;
    req.sessionTokenHash = tokenHash;
    res.locals.roleName = await groupName(account.cGroup);
    // Cheap freshness stamp; a failure here must not block the request.
    touchSession(tokenHash).catch(() => {});
  } catch (err) {
    console.error("session lookup failed:", err.message);
  }
  return next();
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Sesi Anda sudah berakhir. Silakan masuk kembali." });
  }
  return next();
}
