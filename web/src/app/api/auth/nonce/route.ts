import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { issueNonce, purgeExpiredNonces } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** POST /api/auth/nonce - issue one-time sign-in nonce. */
export async function POST(req: Request) {
  const nowMs = Date.now();
  const db = getDb();
  purgeExpiredNonces(db, nowMs);
  let address: unknown;
  try {
    const body = (await req.json()) as { address?: unknown };
    address = body.address;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (typeof address !== "string" || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return NextResponse.json({ error: "invalid_address" }, { status: 400 });
  }
  const { nonce, expiresAtMs } = issueNonce(db, nowMs);
  return NextResponse.json({ nonce, message: null, address, expiresAtMs });
}
