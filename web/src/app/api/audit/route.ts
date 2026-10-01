// Audit Trail API — Euthyna continuous audit viewer
// GET /api/audit?state=FULFILLED&decision=AUTO_APPROVED&from=1700000000000&to=1700000100000&limit=100
// Exposes append-only decisions + orders log. BigInt serialized as strings.

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

function serializeBigInt(obj: unknown): unknown {
  return JSON.parse(
    JSON.stringify(obj, (_k, v) => (typeof v === "bigint" ? v.toString() : v)),
  );
}

export async function GET(req: NextRequest) {
  const db = getDb();
  const sp = req.nextUrl.searchParams;

  const state = sp.get("state");
  const decision = sp.get("decision");
  const from = sp.get("from");
  const to = sp.get("to");
  const limit = Math.min(parseInt(sp.get("limit") ?? "100", 10), 1000);

  // Build filtered queries
  const orderConds: string[] = [];
  const orderParams: (string | number)[] = [];
  if (state) {
    orderConds.push("status = ?");
    orderParams.push(state);
  }
  if (from) {
    orderConds.push("created_at >= ?");
    orderParams.push(Number(from));
  }
  if (to) {
    orderConds.push("created_at <= ?");
    orderParams.push(Number(to));
  }
  const orderWhere = orderConds.length > 0 ? `WHERE ${orderConds.join(" AND ")}` : "";
  const orders = db
    .prepare(`SELECT * FROM orders ${orderWhere} ORDER BY created_at DESC LIMIT ?`)
    .all(...orderParams, limit);

  const decConds: string[] = [];
  const decParams: (string | number)[] = [];
  if (decision) {
    decConds.push("decision = ?");
    decParams.push(decision);
  }
  if (from) {
    decConds.push("created_at >= ?");
    decParams.push(Number(from));
  }
  if (to) {
    decConds.push("created_at <= ?");
    decParams.push(Number(to));
  }
  const decWhere = decConds.length > 0 ? `WHERE ${decConds.join(" AND ")}` : "";
  const decisions = db
    .prepare(`SELECT * FROM decisions ${decWhere} ORDER BY created_at DESC LIMIT ?`)
    .all(...decParams, limit);

  const approvals = db
    .prepare("SELECT * FROM approvals ORDER BY created_at DESC LIMIT ?")
    .all(limit);

  return NextResponse.json(
    serializeBigInt({
      orders,
      decisions,
      approvals,
      meta: {
        filters: { state, decision, from, to, limit },
        counts: {
          orders: orders.length,
          decisions: decisions.length,
          approvals: approvals.length,
        },
      },
    }),
  );
}
