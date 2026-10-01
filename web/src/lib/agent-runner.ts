// Autonomous Agent Execution Loop — deterministic architecture Standard
// Ingests operational triggers, evaluates deterministic policy, executes or halts.
// Zero LLM authority over financial mutation. All money: BigInt 6-decimal USDC.

import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import { evaluatePolicy, type PolicyInput, type PolicyResult } from "./policy-engine";
import type { OrderState } from "./order-fsm";
import type { DisburseFn } from "./arc-wallet";

export type TriggerKind =
  | "LOW_API_CREDITS"
  | "RECURRING_SUBSCRIPTION"
  | "CONTRACTOR_MILESTONE";

export interface AgentTrigger {
  id: string;
  kind: TriggerKind;
  category: string;
  merchantId: string;
  payerAddress: `0x${string}`;
  recipientAddress: `0x${string}`;
  amountUnits: bigint;
  quotedCostUnits: bigint;
  skuEnabled: boolean;
  supplierAvailable: boolean;
  quoteTimestamp: number;
  metadata?: Record<string, string>;
}

export interface AgentRunnerConfig {
  marginFloorBps: bigint;
  maxAutoPurchaseUnits: bigint;
  dailyLimitUnits: bigint;
  reserveFloorUnits: bigint;
  webhookUrl?: string;
}

export interface RunnerDeps {
  db: Database.Database;
  disburse: DisburseFn;
  config: AgentRunnerConfig;
  nowMs: () => number;
  emitWebhook?: (payload: WebhookPayload) => Promise<void>;
}

export interface WebhookPayload {
  event: "order.pending_approval" | "order.blocked" | "order.fulfilled";
  orderId: string;
  triggerKind: TriggerKind;
  decision: string;
  reasonCodes: string[];
  reasonHash: string;
  policyVersion: string;
  amountUnits: string;
  recipient: string;
  timestamp: number;
}

export type RunnerOutcome =
  | { kind: "FULFILLED"; orderId: string; txHash: string; reasonHash: string }
  | { kind: "PENDING_APPROVAL"; orderId: string; reasonHash: string; webhookSent: boolean }
  | { kind: "BLOCKED"; orderId: string; reasonCodes: string[]; reasonHash: string }
  | { kind: "FAILED"; orderId: string; reason: string };

export function computeReasonHash(
  orderId: string,
  result: PolicyResult,
  trigger: AgentTrigger,
): string {
  const canonical = [
    orderId,
    result.decision,
    result.reasonCodes.join(","),
    result.calculatedMarginBps.toString(),
    result.policyVersion,
    trigger.amountUnits.toString(),
    trigger.quotedCostUnits.toString(),
    trigger.recipientAddress.toLowerCase(),
  ].join("|");
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

function buildPolicyInput(
  trigger: AgentTrigger,
  config: AgentRunnerConfig,
  dailySpentUnits: bigint,
  currentReserveUnits: bigint,
  nowMs: number,
): PolicyInput {
  return {
    orderId: trigger.id,
    saleAmountUnits: trigger.amountUnits,
    quotedCostUnits: trigger.quotedCostUnits,
    skuEnabled: trigger.skuEnabled,
    supplierAvailable: trigger.supplierAvailable,
    marginFloorBps: config.marginFloorBps,
    maxAutoPurchaseUnits: config.maxAutoPurchaseUnits,
    dailySpentUnits,
    dailyLimitUnits: config.dailyLimitUnits,
    currentReserveUnits,
    reserveFloorUnits: config.reserveFloorUnits,
    quoteTimestamp: trigger.quoteTimestamp,
    currentTimestamp: Math.floor(nowMs / 1000),
  };
}

function insertOrder(
  db: Database.Database,
  trigger: AgentTrigger,
  nowMs: number,
): void {
  db.prepare(
    `INSERT INTO orders (id, product_id, customer_wallet, sale_amount_usdc_units, status, payment_tx_hash, delivery_status, expires_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, NULL, 'NONE', ?, ?, ?)`,
  ).run(
    trigger.id,
    trigger.category,
    trigger.payerAddress,
    trigger.amountUnits.toString(),
    "CREATED",
    nowMs + 300_000,
    nowMs,
    nowMs,
  );
}

export function updateOrderState(
  db: Database.Database,
  orderId: string,
  state: OrderState,
  nowMs: number,
  txHash?: string,
): void {
  if (txHash !== undefined) {
    db.prepare(
      "UPDATE orders SET status = ?, payment_tx_hash = ?, updated_at = ? WHERE id = ?",
    ).run(state, txHash.toLowerCase(), nowMs, orderId);
  } else {
    db.prepare(
      "UPDATE orders SET status = ?, updated_at = ? WHERE id = ?",
    ).run(state, nowMs, orderId);
  }
}

function insertDecision(
  db: Database.Database,
  orderId: string,
  result: PolicyResult,
  reasonHash: string,
  input: PolicyInput,
  nowMs: number,
): string {
  const id = `dec-${orderId}-${nowMs}`;
  db.prepare(
    `INSERT INTO decisions (id, order_id, decision, reason_codes, policy_version, inputs_json, agent_summary, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    orderId,
    result.decision,
    JSON.stringify(result.reasonCodes),
    result.policyVersion,
    JSON.stringify({
      saleAmountUnits: input.saleAmountUnits.toString(),
      quotedCostUnits: input.quotedCostUnits.toString(),
      marginFloorBps: input.marginFloorBps.toString(),
      maxAutoPurchaseUnits: input.maxAutoPurchaseUnits.toString(),
      dailySpentUnits: input.dailySpentUnits.toString(),
      dailyLimitUnits: input.dailyLimitUnits.toString(),
      currentReserveUnits: input.currentReserveUnits.toString(),
      reserveFloorUnits: input.reserveFloorUnits.toString(),
      skuEnabled: input.skuEnabled,
      supplierAvailable: input.supplierAvailable,
      quoteTimestamp: input.quoteTimestamp,
      currentTimestamp: input.currentTimestamp,
    }),
    JSON.stringify({ reasonHash, triggerKind: orderId.split("-")[0] }),
    nowMs,
  );
  return id;
}

function insertApproval(
  db: Database.Database,
  decisionId: string,
  orderId: string,
  requiredLimitUnits: bigint,
  nowMs: number,
): void {
  db.prepare(
    `INSERT INTO approvals (id, decision_id, order_id, required_limit_units, status, approved_by, created_at)
     VALUES (?, ?, ?, ?, 'PENDING', NULL, ?)`,
  ).run(`apr-${orderId}-${nowMs}`, decisionId, orderId, requiredLimitUnits.toString(), nowMs);
}

function getDailySpent(db: Database.Database, nowMs: number): bigint {
  const dayStart = new Date(nowMs).setUTCHours(0, 0, 0, 0);
  const row = db
    .prepare(
      "SELECT COALESCE(SUM(CAST(sale_amount_usdc_units AS TEXT)), '0') as total FROM orders WHERE created_at >= ? AND status IN ('FULFILLED','PURCHASING','APPROVED')",
    )
    .get(dayStart) as { total: string } | undefined;
  return BigInt(row?.total ?? "0");
}

function getCurrentReserve(db: Database.Database): bigint {
  const row = db
    .prepare(
      "SELECT COALESCE(SUM(CAST(sale_amount_usdc_units AS TEXT)), '0') as total FROM orders WHERE status = 'FULFILLED'",
    )
    .get() as { total: string } | undefined;
  return BigInt(row?.total ?? "0");
}

async function sendWebhook(
  deps: RunnerDeps,
  payload: WebhookPayload,
): Promise<boolean> {
  if (!deps.emitWebhook) return false;
  try {
    await deps.emitWebhook(payload);
    return true;
  } catch {
    return false;
  }
}

/**
 * Process a single operational trigger through the full policy pipeline.
 * Deterministic, idempotent, zero LLM authority.
 */
export async function processTrigger(
  trigger: AgentTrigger,
  deps: RunnerDeps,
): Promise<RunnerOutcome> {
  const nowMs = deps.nowMs();
  const { db, config } = deps;

  insertOrder(db, trigger, nowMs);

  const dailySpent = getDailySpent(db, nowMs);
  const currentReserve = getCurrentReserve(db);
  const policyInput = buildPolicyInput(trigger, config, dailySpent, currentReserve, nowMs);

  const result = evaluatePolicy(policyInput);
  const reasonHash = computeReasonHash(trigger.id, result, trigger);
  const decisionId = insertDecision(db, trigger.id, result, reasonHash, policyInput, nowMs);

  if (result.decision === "BLOCKED") {
    updateOrderState(db, trigger.id, "BLOCKED", nowMs);
    await sendWebhook(deps, {
      event: "order.blocked",
      orderId: trigger.id,
      triggerKind: trigger.kind,
      decision: result.decision,
      reasonCodes: result.reasonCodes,
      reasonHash,
      policyVersion: result.policyVersion,
      amountUnits: trigger.amountUnits.toString(),
      recipient: trigger.recipientAddress,
      timestamp: nowMs,
    });
    return { kind: "BLOCKED", orderId: trigger.id, reasonCodes: result.reasonCodes, reasonHash };
  }

  if (result.decision === "ESCALATED") {
    updateOrderState(db, trigger.id, "ESCALATED", nowMs);
    insertApproval(db, decisionId, trigger.id, config.maxAutoPurchaseUnits, nowMs);
    const webhookSent = await sendWebhook(deps, {
      event: "order.pending_approval",
      orderId: trigger.id,
      triggerKind: trigger.kind,
      decision: result.decision,
      reasonCodes: result.reasonCodes,
      reasonHash,
      policyVersion: result.policyVersion,
      amountUnits: trigger.amountUnits.toString(),
      recipient: trigger.recipientAddress,
      timestamp: nowMs,
    });
    return { kind: "PENDING_APPROVAL", orderId: trigger.id, reasonHash, webhookSent };
  }

  // AUTO_APPROVED → disburse → FULFILLED
  try {
    updateOrderState(db, trigger.id, "PURCHASING", nowMs);
    const receipt = await deps.disburse(
      trigger.recipientAddress,
      trigger.amountUnits,
      trigger.id,
    );
    updateOrderState(db, trigger.id, "FULFILLED", nowMs, receipt.txHash);
    await sendWebhook(deps, {
      event: "order.fulfilled",
      orderId: trigger.id,
      triggerKind: trigger.kind,
      decision: result.decision,
      reasonCodes: result.reasonCodes,
      reasonHash,
      policyVersion: result.policyVersion,
      amountUnits: trigger.amountUnits.toString(),
      recipient: trigger.recipientAddress,
      timestamp: nowMs,
    });
    return { kind: "FULFILLED", orderId: trigger.id, txHash: receipt.txHash, reasonHash };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    updateOrderState(db, trigger.id, "PAYMENT_FAILED", nowMs);
    return { kind: "FAILED", orderId: trigger.id, reason: msg };
  }
}

/** Continuous autonomous loop — processes a queue of triggers sequentially. */
export class AgentRunner {
  private readonly deps: RunnerDeps;
  private readonly queue: AgentTrigger[] = [];
  private running = false;

  constructor(deps: RunnerDeps) {
    this.deps = deps;
  }

  enqueue(trigger: AgentTrigger): void {
    this.queue.push(trigger);
  }

  async runOnce(): Promise<RunnerOutcome | null> {
    const trigger = this.queue.shift();
    if (!trigger) return null;
    return processTrigger(trigger, this.deps);
  }

  async runAll(): Promise<RunnerOutcome[]> {
    const outcomes: RunnerOutcome[] = [];
    let r = await this.runOnce();
    while (r !== null) {
      outcomes.push(r);
      r = await this.runOnce();
    }
    return outcomes;
  }

  async start(intervalMs = 5000): Promise<void> {
    if (this.running) return;
    this.running = true;
    while (this.running) {
      await this.runOnce();
      if (this.queue.length === 0) {
        await new Promise((r) => setTimeout(r, intervalMs));
      }
    }
  }

  stop(): void {
    this.running = false;
  }

  get pending(): number {
    return this.queue.length;
  }
}
