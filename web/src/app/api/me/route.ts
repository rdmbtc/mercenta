import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** GET /api/me - current session identity (or null). */
export async function GET(req: Request) {
  const claims = requireSession(req, Date.now());
  if (!claims) return NextResponse.json({ authenticated: false, address: null }, { status: 401 });
  return NextResponse.json({ authenticated: true, address: claims.address, expiresAtMs: claims.exp });
}
