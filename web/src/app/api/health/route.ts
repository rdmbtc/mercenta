import { NextResponse } from "next/server";
import { getDb, resetDb } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/health - liveness + db check. No auth (ops probes). */
export async function GET() {
  try {
    const db = getDb();
    const row = db.prepare("SELECT COUNT(*) AS c FROM orders").get() as { c: number };
    return NextResponse.json({ ok: true, orders: row.c, time: Date.now() });
  } catch (e) {
    resetDb();
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
