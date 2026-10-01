#!/usr/bin/env vite-node
// Automated Dogfooding Simulation — Mercenta Treasury
// Generates 10 realistic agent purchase events across 5 Mercenta categories.
// Proves automated execution on Arc Testnet: passes + deliberate policy blocks.
// Run: npx vite-node scripts/simulate-treasury.ts

import { getDb, resetDb } from "../web/src/lib/db";
import { processTrigger, type AgentTrigger, type RunnerDeps } from "../web/src/lib/agent-runner";
import { disburseUsdc } from "../web/src/lib/arc-wallet";
import type { DisburseFn } from "../web/src/lib/arc-wallet";

const CATEGORIES = [
  "Gaming Keys & Platform Vouchers",
  "Streaming & Media Subscriptions",
  "Creator & Game Micro-Donations",
  "Developer API & Token Bundles",
  "Cloud Compute & GPU Vouchers",
] as const;

const NOW = Date.now();
const RECIPIENT = "0x1dBD2507b68368E10E3d32240E326eaaF063dA6b" as `0x${string}`;
const PAYER = "0x" + "aa".repeat(20) as `0x${string}`;

function makeTrigger(
  i: number,
  kind: AgentTrigger["kind"],
  category: string,
  amountUnits: bigint,
  quotedCostUnits: bigint,
  overrides?: Partial<AgentTrigger>,
): AgentTrigger {
  return {
    id: `sim-${kind.toLowerCase()}-${i}`,
    kind,
    category,
    merchantId: "merch-sim",
    payerAddress: PAYER,
    recipientAddress: RECIPIENT,
    amountUnits,
    quotedCostUnits,
    skuEnabled: true,
    supplierAvailable: true,
    quoteTimestamp: Math.floor(NOW / 1000) - 30,
    ...overrides,
  };
}

const TRIGGERS: AgentTrigger[] = [
  // 1. Gaming Keys — small pass
  makeTrigger(1, "LOW_API_CREDITS", CATEGORIES[0], 5_000_000n, 4_500_000n),
  // 2. Streaming — pass
  makeTrigger(2, "RECURRING_SUBSCRIPTION", CATEGORIES[1], 12_000_000n, 11_000_000n),
  // 3. Micro-donations — pass
  makeTrigger(3, "CONTRACTOR_MILESTONE", CATEGORIES[2], 2_000_000n, 1_800_000n),
  // 4. API tokens — pass
  makeTrigger(4, "LOW_API_CREDITS", CATEGORIES[3], 25_000_000n, 23_000_000n),
  // 5. GPU vouchers — pass
  makeTrigger(5, "CONTRACTOR_MILESTONE", CATEGORIES[4], 50_000_000n, 47_000_000n),
  // 6. Gaming — BLOCKED: SKU disabled
  makeTrigger(6, "LOW_API_CREDITS", CATEGORIES[0], 10_000_000n, 9_000_000n, { skuEnabled: false }),
  // 7. Streaming — BLOCKED: supplier unavailable
  makeTrigger(7, "RECURRING_SUBSCRIPTION", CATEGORIES[1], 15_000_000n, 14_000_000n, { supplierAvailable: false }),
  // 8. API tokens — BLOCKED: stale quote (>300s old)
  makeTrigger(8, "LOW_API_CREDITS", CATEGORIES[3], 20_000_000n, 19_000_000n, { quoteTimestamp: Math.floor(NOW / 1000) - 400 }),
  // 9. GPU — ESCALATED: above auto-purchase limit
  makeTrigger(9, "CONTRACTOR_MILESTONE", CATEGORIES[4], 200_000_000n, 190_000_000n),
  // 10. Micro-donations — BLOCKED: margin below floor
  makeTrigger(10, "CONTRACTOR_MILESTONE", CATEGORIES[2], 10_000_000n, 9_999_000n),
];

async function main() {
  console.log("=== Mercenta Treasury Simulation — Arc Testnet ===\n");

  const db = getDb(":memory:");
  resetDb(db);

  const config = {
    marginFloorBps: 100n, // 1%
    maxAutoPurchaseUnits: 100_000_000n, // 100 USDC
    dailyLimitUnits: 500_000_000n, // 500 USDC
    reserveFloorUnits: 10_000_000n, // 10 USDC
  };

  // Use live disbursement if ARC_DISBURSER_KEY is set, otherwise stub
  const useLive = !!process.env.ARC_DISBURSER_KEY;
  const disburse: DisburseFn = useLive
    ? (to, amount, orderId) => disburseUsdc(to, amount, orderId)
    : async (to, amount, orderId) => ({
        txHash: `0x${Buffer.from(orderId).toString("hex").padEnd(64, "0").slice(0, 64)}` as `0x${string}`,
        blockNumber: 1n,
        gasUsed: 21_000n,
        status: "success" as const,
      });

  const deps: RunnerDeps = {
    db,
    disburse,
    config,
    nowMs: () => NOW,
    emitWebhook: async (p) => {
      console.log(`  [WEBHOOK] ${p.event} → ${p.orderId} (${p.decision})`);
    },
  };

  console.log(`Mode: ${useLive ? "LIVE ARC TESTNET" : "STUBBED (set ARC_DISBURSER_KEY for live)"}\n`);

  const results = [];
  for (const t of TRIGGERS) {
    console.log(`Processing ${t.id} [${t.kind}] ${t.category}...`);
    const outcome = await processTrigger(t, deps);
    results.push({ trigger: t, outcome });
    const icon = outcome.kind === "FULFILLED" ? "✓" : outcome.kind === "BLOCKED" ? "✗" : outcome.kind === "PENDING_APPROVAL" ? "⏸" : "!";
    console.log(`  ${icon} ${outcome.kind}${outcome.kind === "BLOCKED" ? ` (${outcome.reasonCodes.join(", ")})` : ""}${outcome.kind === "FULFILLED" ? ` tx=${outcome.txHash.slice(0, 18)}...` : ""}\n`);
  }

  const fulfilled = results.filter((r) => r.outcome.kind === "FULFILLED").length;
  const blocked = results.filter((r) => r.outcome.kind === "BLOCKED").length;
  const escalated = results.filter((r) => r.outcome.kind === "PENDING_APPROVAL").length;

  console.log("=== Summary ===");
  console.log(`Fulfilled: ${fulfilled} | Blocked: ${blocked} | Escalated: ${escalated}`);
  console.log(`Total volume: ${results.filter((r) => r.outcome.kind === "FULFILLED").reduce((s, r) => s + r.trigger.amountUnits, 0n)} units`);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
