import { NextResponse } from "next/server";
import { getDb, resetDb } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/health - liveness + db check. No auth (ops probes). */
export async function GET() {
  try {
    const db = getDb();
    let orders = 0;
    try {
      const row = db.prepare("SELECT COUNT(*) AS c FROM orders").get() as { c: number } | undefined;
      orders = row?.c ?? 0;
    } catch {}
    return NextResponse.json({ ok: true, orders, time: Date.now() });
  } catch (e) {
    resetDb();
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
