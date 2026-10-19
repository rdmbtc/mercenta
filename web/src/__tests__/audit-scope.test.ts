import { beforeEach, describe, expect, it } from "vitest";
import { getDb, resetDb } from "@/lib/db";
import { mintSession } from "@/lib/auth";
import { GET } from "@/app/api/audit/route";

const A = "0x" + "aa".repeat(20);
const B = "0x" + "bb".repeat(20);

function req(wallet?: string) {
  const headers: Record<string, string> = {};
  if (wallet) headers.cookie = "mercenta_session=" + mintSession(wallet, Date.now()).token;
  return new Request("https://app.test/api/audit", { headers });
}

function seed() {
  const db = getDb();
  const now = Date.now();
  for (const [id, wallet] of [["o-a", A], ["o-b", B]] as const) {
    db.prepare(
      "INSERT INTO orders (id, product_id, customer_wallet, sale_amount_usdc_units, status, delivery_status, expires_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)",
    ).run(id, "p1", wallet, 1000, "FULFILLED", "NONE", now + 1000, now, now);
  }
}

describe("audit trail is wallet scoped", () => {
  beforeEach(() => {
    resetDb();
    seed();
  });

  it("refuses anonymous reads", async () => {
    expect((await GET(req() as never)).status).toBe(401);
  });

  it("returns only the caller's orders and decisions", async () => {
    const res = await GET(req(A) as never);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { orders: Array<{ id: string }>; approvals: unknown[] };
    expect(data.orders.map((o) => o.id)).toEqual(["o-a"]);
    expect(data.approvals).toEqual([]);
  });

  it("clamps a negative limit instead of returning the table", async () => {
    const r = new Request("https://app.test/api/audit?limit=-1", {
      headers: { cookie: "mercenta_session=" + mintSession(A, Date.now()).token },
    });
    const data = (await (await GET(r as never)).json()) as { meta: { filters: { limit: number } } };
    expect(data.meta.filters.limit).toBe(0);
  });
});
