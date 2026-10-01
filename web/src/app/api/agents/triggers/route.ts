import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import {
  processTrigger,
  type AgentTrigger,
  type AgentRunnerConfig,
  type TriggerKind,
} from "@/lib/agent-runner";

export const dynamic = "force-dynamic";

const TRIGGER_KINDS = ["LOW_API_CREDITS", "RECURRING_SUBSCRIPTION", "CONTRACTOR_MILESTONE"] as const;

const unitsSchema = z.string().regex(/^\d+$/, "bigint units as decimal string (6-dec USDC)");

const triggerSchema = z.object({
  id: z.string().min(6).max(80).optional(),
  kind: z.enum(TRIGGER_KINDS),
  category: z.string().min(1).max(64),
  merchantId: z.string().min(1).max(64),
  payerAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  recipientAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  amountUnits: unitsSchema,
  quotedCostUnits: unitsSchema,
  skuEnabled: z.boolean().default(true),
  supplierAvailable: z.boolean().default(true),
  quoteTimestamp: z.number().int().positive(),
  metadata: z.record(z.string(), z.string()).optional(),
});

function runnerConfig(): AgentRunnerConfig {
  return {
    marginFloorBps: BigInt(process.env.AGENT_MARGIN_FLOOR_BPS ?? "2500"),
    maxAutoPurchaseUnits: BigInt(process.env.AGENT_MAX_AUTO_PURCHASE_UNITS ?? "25000000"),
    dailyLimitUnits: BigInt(process.env.AGENT_DAILY_LIMIT_UNITS ?? "500000000"),
    reserveFloorUnits: BigInt(process.env.AGENT_RESERVE_FLOOR_UNITS ?? "0"),
    webhookUrl: process.env.AGENT_WEBHOOK_URL,
  };
}

/** POST /api/agents/triggers - session-gated: run one trigger through the policy pipeline. */
export async function POST(req: Request) {
  const nowMs = Date.now();
  const claims = requireSession(req, nowMs);
  if (!claims) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = triggerSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_failed", issues: parsed.error.issues }, { status: 400 });
  }
  const b = parsed.data;
  const trigger: AgentTrigger = {
    id: b.id ?? `trg-${nowMs}-${Math.random().toString(36).slice(2, 8)}`,
    kind: b.kind as TriggerKind,
    category: b.category,
    merchantId: b.merchantId,
    payerAddress: b.payerAddress as `0x${string}`,
    recipientAddress: b.recipientAddress as `0x${string}`,
    amountUnits: BigInt(b.amountUnits),
    quotedCostUnits: BigInt(b.quotedCostUnits),
    skuEnabled: b.skuEnabled,
    supplierAvailable: b.supplierAvailable,
    quoteTimestamp: b.quoteTimestamp,
    metadata: b.metadata,
  };

  try {
    // Wire live disbursement when ARC_DISBURSER_KEY is configured; otherwise
    // triggers that reach PURCHASING will fail closed (no silent auto-buy).
    const liveKey = process.env.ARC_DISBURSER_KEY;
    const disburse = liveKey
      ? (await import("@/lib/arc-wallet")).disburseUsdc
      : async () => {
          throw new Error("ARC_DISBURSER_KEY not configured; live disbursement disabled");
        };
    const outcome = await processTrigger(trigger, {
      db: getDb(),
      disburse,
      config: runnerConfig(),
      nowMs: () => Date.now(),
    });
    if (outcome.kind === "FAILED") {
      return NextResponse.json(outcome, { status: 502 });
    }
    return NextResponse.json({ session: claims.address, outcome });
  } catch (e) {
    return NextResponse.json({ error: "pipeline_failure", detail: (e as Error).message }, { status: 500 });
  }
}
