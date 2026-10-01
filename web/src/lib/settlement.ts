// Settlement Orchestrator — deterministic architecture Standard
// Wires FSM + arc-verifier + policy-engine. Zero LLM authority.
// All money: BigInt 6-decimal USDC. Immutable snapshots.

import { transition, type OrderSnapshot, type OrderState } from "./order-fsm.js";
import { verifyArcPayment, type VerifyResult } from "./arc-verifier.js";
import { evaluatePolicy, type PolicyInput, type PolicyResult } from "./policy-engine.js";
import type { Hex, Address, PublicClient } from "viem";

export interface SettlementDeps {
  client?: PublicClient;
  merchantWallet: Address;
  isTxConsumed: (txHash: Hex) => boolean;
  buildPolicyInput: (orderId: string, amountUnits: bigint) => PolicyInput;
}

export interface OrderContext {
  orderId: string;
  txHash: Hex;
  expectedAmountUnits: bigint;
  orderExpiresAt: number;
}

export type SettlementOutcome =
  | { kind: "ADVANCED"; snapshot: OrderSnapshot; policy?: PolicyResult }
  | { kind: "HALTED"; snapshot: OrderSnapshot; reason: string };

/**
 * Run payment verification + policy evaluation, advancing FSM accordingly.
 * Pure orchestration — caller handles DB persistence.
 */
export async function settleOrder(
  current: OrderSnapshot,
  ctx: OrderContext,
  deps: SettlementDeps,
): Promise<SettlementOutcome> {
  const snap = current;

  // Only AWAITING_PAYMENT can enter settlement pipeline
  if (snap.state !== "AWAITING_PAYMENT") {
    return { kind: "HALTED", snapshot: snap, reason: `state ${snap.state} outside settlement pipeline` };
  }

  // Step 1: Verify on-chain payment
  const verifyResult: VerifyResult = await verifyArcPayment(
    {
      txHash: ctx.txHash,
      expectedAmountUnits: ctx.expectedAmountUnits,
      merchantWallet: deps.merchantWallet,
      orderExpiresAt: ctx.orderExpiresAt,
      isTxConsumed: deps.isTxConsumed,
    },
    deps.client,
  );

  if (verifyResult.outcome === "REJECTED") {
    return { kind: "HALTED", snapshot: snap, reason: verifyResult.reason };
  }

  if (verifyResult.outcome === "UNDERPAID") {
    const next = transition(snap, "UNDERPAID");
    return { kind: "HALTED", snapshot: next, reason: "UNDERPAID" };
  }

  // VALID → advance through PAYMENT_DETECTED → PAYMENT_CONFIRMED → POLICY_CHECK
  let s = transition(snap, "PAYMENT_DETECTED");
  s = transition(s, "PAYMENT_CONFIRMED");
  s = transition(s, "POLICY_CHECK");

  // Step 2: Evaluate policy
  const policyInput = deps.buildPolicyInput(ctx.orderId, ctx.expectedAmountUnits);
  const policyResult = evaluatePolicy(policyInput);

  // Map policy decision to FSM state
  const targetState: OrderState =
    policyResult.decision === "AUTO_APPROVED" ? "APPROVED"
    : policyResult.decision === "BLOCKED" ? "BLOCKED"
    : policyResult.decision === "ESCALATED" ? "ESCALATED"
    : "BLOCKED"; // defensive fallback

  s = transition(s, targetState);

  // If approved, advance to PURCHASING
  if (targetState === "APPROVED") {
    s = transition(s, "PURCHASING");
  }

  return { kind: "ADVANCED", snapshot: s, policy: policyResult };
}
