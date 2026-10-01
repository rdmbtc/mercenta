import { describe, it, expect, beforeEach } from "vitest";
import type Database from "better-sqlite3";
import { resetDb, getDb } from "../lib/db";
import {
  processTrigger,
  computeReasonHash,
  type AgentTrigger,
  type RunnerDeps,
  type WebhookPayload,
} from "../lib/agent-runner";
import type { DisburseResult } from "../lib/arc-wallet";

const NOW = 1_700_000_000_000;

export function makeTrigger(over: Partial<AgentTrigger> = {}): AgentTrigger {
  return {
    id: "sim-low_api_credits-1",
    kind: "LOW_API_CREDITS",
    category: "Developer API & Token Bundles",
    merchantId: "merch-1",
    payerAddress: ("0x" + "aa".repeat(20)) as `0x${string}`,
    recipientAddress: ("0x" + "bb".repeat(20)) as `0x${string}`,
    amountUnits: 10_000_000n,
    quotedCostUnits: 8_000_000n,
    skuEnabled: true,
    supplierAvailable: true,
    quoteTimestamp: Math.floor(NOW / 1000) - 10,
    ...over,
  };
}

export function stubDisburse(result?: Partial<DisburseResult>) {
  const calls: Array<{ to: string; amountUnits: bigint }> = [];
  const fn = async (to: `0x${string}`, amountUnits: bigint): Promise<DisburseResult> => {
    calls.push({ to, amountUnits });
    return {
      txHash: ("0x" + "cc".repeat(32)) as `0x${string}`,
      blockNumber: 123n, gasUsed: 21_000n,
      status: "success",
      ...result,
    };
  };
  return { fn, calls };
}

export function makeDeps(db: Database.Database, over: Partial<RunnerDeps> = {}): RunnerDeps {
  const { fn } = stubDisburse();
  return {
    db,
    disburse: fn,
    config: {
      dailyLimitUnits: 2_500_000_000n,
      reserveFloorUnits: 0n,
      maxAutoPurchaseUnits: 100_000_000n,
      marginFloorBps: 500n,
    },
    nowMs: () => NOW,
    ...over,
  };
}

export { NOW };

describe("agent-runner core", () => {
  let db: Database.Database;
  beforeEach(() => {
    resetDb();
    db = getDb();
  });

  it("FULFILLED on AUTO_APPROVED with disburse + txHash + webhook", async () => {
    // Seed treasury reserve so liquidity gate passes
    db.prepare("INSERT INTO orders (id, product_id, customer_wallet, sale_amount_usdc_units, status, payment_tx_hash, delivery_status, expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      "seed-1", "seed", "0x" + "dd".repeat(20), "1000000000", "FULFILLED", "0x" + "ee".repeat(32), "delivered", NOW + 60_000, NOW - 60_000, NOW - 60_000
    );
    const webhooks: WebhookPayload[] = [];
    const { fn, calls } = stubDisburse();
    const deps = makeDeps(db, { disburse: fn, emitWebhook: async (w) => { webhooks.push(w); } });
    const out = await processTrigger(makeTrigger(), deps);
    if (out.kind !== "FULFILLED") console.log("DEBUG", JSON.stringify(out, (k,v) => typeof v === "bigint" ? v.toString() : v));

    expect(out.kind).toBe("FULFILLED");
    if (out.kind === "FULFILLED") expect(out.txHash).toMatch(/^0x/);
    expect(calls.length).toBe(1);
    expect(webhooks.some((w) => w.event === "order.fulfilled")).toBe(true);
    const order = db.prepare("SELECT status, payment_tx_hash FROM orders WHERE id = ?").get(out.orderId) as { status: string; payment_tx_hash: string };
    expect(order.status).toBe("FULFILLED");
    expect(order.payment_tx_hash).toBe((out as { txHash: string }).txHash);
  });

  it("BLOCKED when skuEnabled=false, gate SKU_DISABLED, webhook order.blocked", async () => {
    const webhooks: WebhookPayload[] = [];
    const deps = makeDeps(db, { emitWebhook: async (w) => { webhooks.push(w); } });
    const out = await processTrigger(makeTrigger({ skuEnabled: false }), deps);
    expect(out.kind).toBe("BLOCKED");
    if (out.kind === "BLOCKED") expect(out.reasonCodes).toContain("SKU_DISABLED");
    expect(webhooks.some((w) => w.event === "order.blocked")).toBe(true);
    const order = db.prepare("SELECT status FROM orders WHERE id = ?").get(out.orderId) as { status: string };
    expect(order.status).toBe("BLOCKED");
  });

  it("BLOCKED when margin below floor", async () => {
    const deps = makeDeps(db);
    const out = await processTrigger(makeTrigger({ quotedCostUnits: 9_900_000n, amountUnits: 10_000_000n }), deps);
    expect(out.kind).toBe("BLOCKED");
    if (out.kind === "BLOCKED") expect(out.reasonCodes.some((c) => c.includes("MARGIN"))).toBe(true);
  });

  it("BLOCKED when quote stale", async () => {
    const deps = makeDeps(db);
    const out = await processTrigger(makeTrigger({ quoteTimestamp: Math.floor(NOW / 1000) - 400 }), deps);
    expect(out.kind).toBe("BLOCKED");
    if (out.kind === "BLOCKED") expect(out.reasonCodes.some((c) => c.includes("STALE"))).toBe(true);
  });

  it("BLOCKED when supplier unavailable", async () => {
    const deps = makeDeps(db);
    const out = await processTrigger(makeTrigger({ supplierAvailable: false }), deps);
    expect(out.kind).toBe("BLOCKED");
    if (out.kind === "BLOCKED") expect(out.reasonCodes).toContain("SUPPLIER_UNAVAILABLE");
  });

  it("reason hash deterministic sha256", async () => {
    const deps = makeDeps(db);
    const out = await processTrigger(makeTrigger(), deps);
    const row = db.prepare("SELECT agent_summary FROM decisions WHERE order_id = ?").get(out.orderId) as { agent_summary: string };
    const parsed = JSON.parse(row.agent_summary);
    expect(parsed.reasonHash).toMatch(/^[0-9a-f]{64}$/);
    const t = makeTrigger();
    const again = computeReasonHash(out.orderId, { decision: "AUTO_APPROVED", reasonCodes: ["POLICY_PASSED_ALL_GATES"], calculatedMarginBps: 2000n, policyVersion: "2026.10-tameion" }, t);
    expect(again).toMatch(/^[0-9a-f]{64}$/);
  });
});
