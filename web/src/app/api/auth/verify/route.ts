import { NextResponse } from "next/server";
import { verifyMessage } from "viem";
import { getDb } from "@/lib/db";
import {
  buildAuthMessage,
  consumeNonce,
  mintSession,
  SESSION_COOKIE,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

/** POST /api/auth/verify - prove wallet ownership, get session cookie. */
export async function POST(req: Request) {
  const nowMs = Date.now();
  let body: { address?: unknown; nonce?: unknown; signature?: unknown; issuedAt?:unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const { address, nonce, signature, issuedAt } = body;
  if (typeof address !== "string" || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return NextResponse.json({ error: "invalid_address" }, { status: 400 });
  }
  if (typeof nonce !== "string" || nonce.length < 16) {
    return NextResponse.json({ error: "invalid_nonce" }, { status: 400 });
  }
  if (typeof signature !== "string" || !/^0x[0-9a-fA-F]+$/.test(signature)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }
  if (typeof issuedAt !== "number" || !Number.isSafeInteger(issuedAt) || issuedAt > nowMs+30000 || nowMs-issuedAt > 600000 || req.headers.get("origin") !== new URL(req.url).origin) return NextResponse.json({ error: "invalid_signin_context" }, { status: 400 });
  const message = buildAuthMessage(address, nonce, issuedAt);
  let valid = false;
  try {
    valid = await verifyMessage({ address: address as `0x${string}`, message, signature: signature as `0x${string}` });
  } catch {
    valid = false;
  }
  if (!valid) {
    return NextResponse.json({ error: "signature_mismatch" }, { status: 401 });
  }
  if (!consumeNonce(getDb(), nonce, address, nowMs)) {
    return NextResponse.json({ error: "nonce_invalid_or_replayed" }, { status: 401 });
  }
  const { token, expiresAtMs } = mintSession(address, nowMs);
  const res = NextResponse.json({ ok: true, address: address.toLowerCase(), expiresAtMs });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(req.url).protocol === "https:",
    path: "/",
    maxAge: Math.floor((expiresAtMs - nowMs) / 1000),
  });
  return res;
}
