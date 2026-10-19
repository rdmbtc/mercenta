// Audit Trail API — Euthyna continuous audit viewer
// GET /api/audit?state=FULFILLED&decision=AUTO_APPROVED&from=1700000000000&to=1700000100000&limit=100
// Append-only decisions + orders log, scoped to the signed-in wallet. BigInt serialized as strings.

import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

function serializeBigInt(obj: unknown): unknown {
  return JSON.parse(
    JSON.stringify(obj, (_k, v) => (typeof v === "bigint" ? v.toString() : v)),
  );
}

function boundInt(raw: string | null, fallback: number, max: number): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, 0), max);
}

export async function GET(req: Request) {
  // Order/decision history is per-wallet data: never serve it anonymous.
  const claims = requireSession(req, Date.now());
  if (!claims) return NextResponse.json({ error: "SIGN_IN_REQUIRED" }, { status: 401 });
  const wallet = claims.address;

  const db = getDb();
  const sp = new URL(req.url).searchParams;

  const state = sp.get("state");
  const decision = sp.get("decision");
  const from = sp.get("from");
  const to = sp.get("to");
  const limit = boundInt(sp.get("limit"), 100, 1000);

  const owned = "SELECT id FROM orders WHERE customer_wallet = ?";

  const orderConds: string[] = ["customer_wallet = ?"];
  const orderParams: (string | number)[] = [wallet];
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
  const orderWhere = "WHERE " + orderConds.join(" AND ");
  const orders = db
    .prepare(`SELECT * FROM orders ${orderWhere} ORDER BY created_at DESC LIMIT ?`)
    .all(...orderParams, limit);

  const decConds: string[] = ["order_id IN (" + owned + ")"];
  const decParams: (string | number)[] = [wallet];
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
  const decWhere = "WHERE " + decConds.join(" AND ");
  const decisions = db
    .prepare(`SELECT * FROM decisions ${decWhere} ORDER BY created_at DESC LIMIT ?`)
    .all(...decParams, limit);

  const approvals = db
    .prepare(
      "SELECT * FROM approvals WHERE order_id IN (" + owned + ") ORDER BY created_at DESC LIMIT ?",
    )
    .all(wallet, limit);

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
