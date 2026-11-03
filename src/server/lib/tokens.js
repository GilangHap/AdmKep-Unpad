import { createHash, randomBytes } from "node:crypto";

/** 32 random bytes, base64url — the token that goes into the email link. */
export function generateToken() {
  return randomBytes(32).toString("base64url");
}

/**
 * Only the SHA-256 of the token is stored: a leaked store cannot be replayed.
 * SHA-256 is right here (not bcrypt) because the token is already 256-bit random —
 * there is nothing to brute-force, and we must be able to look it up by hash.
 */
export function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}
