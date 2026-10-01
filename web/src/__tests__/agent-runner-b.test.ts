import { describe, it, expect, beforeEach } from "vitest";
import type Database from "better-sqlite3";
import { resetDb, getDb } from "../lib/db";
import {
  processTrigger,
  AgentRunner,
  type WebhookPayload,
} from "../lib/agent-runner";
import { makeTrigger, makeDeps, stubDisburse } from "./agent-runner-a.test";

describe("agent-runner flows", () => {
  let db: Database.Database;
  beforeEach(() => {
    resetDb();
    db = getDb();
    // Seed treasury reserve so liquidity gate passes
    db.prepare("INSERT INTO orders (id, product_id, customer_wallet, sale_amount_usdc_units, status, payment_tx_hash, delivery_status, expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      "seed-1", "seed", "0x" + "dd".repeat(20), "1000000000", "FULFILLED", "0x" + "ee".repeat(32), "delivered", 1_700_000_060_000, 1_700_000_000_000, 1_700_000_000_000
    );
  });

  it("PENDING_APPROVAL when amount above auto limit, approval row + webhook", async () => {
    const webhooks: WebhookPayload[] = [];
    const deps = makeDeps(db, { emitWebhook: async (w) => { webhooks.push(w); } });
    const out = await processTrigger(makeTrigger({ amountUnits: 200_000_000n, quotedCostUnits: 160_000_000n }), deps);
    expect(out.kind).toBe("PENDING_APPROVAL");
    expect(webhooks.some((w) => w.event === "order.pending_approval")).toBe(true);
    const appr = db.prepare("SELECT status FROM approvals WHERE order_id = ?").get(out.orderId) as { status: string };
    expect(appr.status).toBe("PENDING");
  });

  it("FAILED when disburse throws, state PAYMENT_FAILED", async () => {
    const deps = makeDeps(db, {
      disburse: async () => { throw new Error("rpc down"); },
    });
    const out = await processTrigger(makeTrigger(), deps);
    expect(out.kind).toBe("FAILED");
    if (out.kind === "FAILED") expect(out.reason).toMatch(/rpc down/);
  });

  it("decision row persisted with policy version", async () => {
    const deps = makeDeps(db);
    const out = await processTrigger(makeTrigger(), deps);
    const row = db.prepare("SELECT policy_version, decision FROM decisions WHERE order_id = ?").get(out.orderId) as { policy_version: string; decision: string };
    expect(row.policy_version).toBe("2026.10-tameion");
    expect(["AUTO_APPROVED", "BLOCKED", "ESCALATED"]).toContain(row.decision);
  });

  it("AgentRunner runAll processes queue with mixed outcomes", async () => {
    const webhooks: WebhookPayload[] = [];
    const deps = makeDeps(db, { emitWebhook: async (w) => { webhooks.push(w); } });
    const runner = new AgentRunner(deps);
    runner.enqueue(makeTrigger({ id: "t1" }));
    runner.enqueue(makeTrigger({ id: "t2", skuEnabled: false }));
    runner.enqueue(makeTrigger({ id: "t3", amountUnits: 200_000_000n, quotedCostUnits: 160_000_000n }));
    const results = await runner.runAll();
    expect(results.length).toBe(3);
    expect(results.map((r) => r.kind).sort()).toEqual(["BLOCKED", "FULFILLED", "PENDING_APPROVAL"]);
  });

  it("runOnce returns null on empty queue", async () => {
    const runner = new AgentRunner(makeDeps(db));
    const r = await runner.runOnce();
    expect(r).toBeNull();
  });

  it("disburse receives recipient and amount", async () => {
    const { fn, calls } = stubDisburse();
    const deps = makeDeps(db, { disburse: fn });
    const t = makeTrigger();
    await processTrigger(t, deps);
    expect(calls[0].to).toBe(t.recipientAddress);
    expect(calls[0].amountUnits).toBe(t.amountUnits);
  });
});
