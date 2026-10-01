/**
 * Auth for Mercenta hub - wallet-based (SIWx-style), no external auth deps.
 * deterministic architecture: auth grants API access ONLY. It never grants ledger/policy authority.
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { Database } from "better-sqlite3";

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const NONCE_TTL_MS = 10 * 60 * 1000; // 10 min

function sessionSecret(): string {
  const s = process.env.ARC_SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("Missing or weak ARC_SESSION_SECRET env (min 16 chars)");
  }
  return s;
}

export function issueNonce(db: Database, nowMs: number): { nonce: string; expiresAtMs: number } {
  const nonce = randomBytes(16).toString("hex");
  const expiresAtMs = nowMs + NONCE_TTL_MS;
  db.prepare(
    "INSERT INTO auth_nonces (nonce, address, expires_at_ms) VALUES (?, NULL, ?)"
  ).run(nonce, expiresAtMs);
  return { nonce, expiresAtMs };
}

/** Message the wallet is asked to sign. Deterministic, includes nonce + issuedAt. */
export function buildAuthMessage(address: string, nonce: string, nowMs: number): string {
  return [
    "Mercenta wants you to sign in.",
    "",
    "Address: " + address.toLowerCase(),
    "Nonce: " + nonce,
    "Issued: " + new Date(nowMs).toISOString(),
    "",
    "Signing proves wallet ownership. It does NOT authorize any payment or transfer.",
  ].join("\n");
}

export interface SessionClaims {
  address: string; // lowercase
  iat: number;
  exp: number;
}

function signPayload(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function mintSession(address: string, nowMs: number): { token: string; expiresAtMs: number } {
  const claims: SessionClaims = {
    address: address.toLowerCase(),
    iat: nowMs,
    exp: nowMs + SESSION_TTL_MS,
  };
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const token = payload + "." + signPayload(payload);
  return { token, expiresAtMs: claims.exp };
}

export function verifySession(token: string | undefined | null, nowMs: number): SessionClaims | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = signPayload(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  let claims: SessionClaims;
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionClaims;
  } catch {
    return null;
  }
  if (typeof claims.address !== "string" || typeof claims.exp !== "number") return null;
  if (claims.exp <= nowMs) return null;
  return claims;
}

/** Validate + consume a nonce for an address. Returns false if unknown/expired/replayed. */
export function consumeNonce(
  db: Database,
  nonce: string,
  address: string,
  nowMs: number
): boolean {
  const row = db
    .prepare("SELECT address, expires_at_ms FROM auth_nonces WHERE nonce = ?")
    .get(nonce) as { address: string | null; expires_at_ms: number } | undefined;
  if (!row) return false;
  if (row.address !== null) return false; // replay
  if (row.expires_at_ms <= nowMs) {
    db.prepare("DELETE FROM auth_nonces WHERE nonce = ?").run(nonce);
    return false;
  }
  // Bind to address and mark consumed (single UPDATE, atomic)
  const res = db
    .prepare("UPDATE auth_nonces SET address = ? WHERE nonce = ? AND address IS NULL")
    .run(address.toLowerCase(), nonce);
  if (res.changes !== 1) return false;
  return true;
}

/** Purge expired nonces (call opportunistically). */
export function purgeExpiredNonces(db: Database, nowMs: number): void {
  db.prepare("DELETE FROM auth_nonces WHERE expires_at_ms <= ?").run(nowMs);
}

/** Extract session claims from a Request via cookie header. */
export function requireSession(req: Request, nowMs: number): SessionClaims | null {
  const cookie = req.headers.get("cookie") ?? "";
  const m = /(?:^|;\s*)mercenta_session=([^;]+)/.exec(cookie);
  if (!m) return null;
  return verifySession(decodeURIComponent(m[1]), nowMs);
}

export const SESSION_COOKIE = "mercenta_session";
export const SESSION_TTL_MS_CONST = SESSION_TTL_MS;
