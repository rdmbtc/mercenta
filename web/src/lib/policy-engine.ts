// Deterministic Financial Policy Engine — deterministic architecture Standard
// Pure function, zero side-effects, zero LLM authority.
// All arithmetic: native BigInt with 6-decimal USDC scaling.

export const POLICY_VERSION = "2026.10-tameion";

export type PolicyDecision = "AUTO_APPROVED" | "BLOCKED" | "ESCALATED";

export interface PolicyInput {
  orderId: string;
  saleAmountUnits: bigint;
  quotedCostUnits: bigint;
  skuEnabled: boolean;
  supplierAvailable: boolean;
  marginFloorBps: bigint;
  maxAutoPurchaseUnits: bigint;
  dailySpentUnits: bigint;
  dailyLimitUnits: bigint;
  currentReserveUnits: bigint;
  reserveFloorUnits: bigint;
  quoteTimestamp: number;
  currentTimestamp: number;
}

export interface PolicyResult {
  decision: PolicyDecision;
  reasonCodes: string[];
  calculatedMarginBps: bigint;
  policyVersion: string;
}

const MAX_QUOTE_AGE_SECONDS = 300;

/**
 * Evaluate order against deterministic policy rules.
 * First-match-wins for BLOCK rules. ESCALATE only if no block triggered.
 * Margin formula: ((sale - cost) * 10000n) / sale. Division by zero guarded.
 */
export function evaluatePolicy(input: PolicyInput): PolicyResult {
  // Gate 1: SKU disabled
  if (!input.skuEnabled) {
    return makeBlocked("SKU_DISABLED", input);
  }

  // Gate 2: Supplier unavailable
  if (!input.supplierAvailable) {
    return makeBlocked("SUPPLIER_UNAVAILABLE", input);
  }

  // Gate 3: Stale supplier quote (>300s)
  if (input.currentTimestamp - input.quoteTimestamp > MAX_QUOTE_AGE_SECONDS) {
    return makeBlocked("STALE_SUPPLIER_QUOTE", input);
  }

  // Gate 4: Negative margin (cost > sale)
  if (input.quotedCostUnits > input.saleAmountUnits) {
    return makeBlocked("MARGIN_NEGATIVE", input);
  }

  // Compute margin for remaining gates
  const marginBps = calcMarginBps(input.saleAmountUnits, input.quotedCostUnits);

  // Gate 5: Margin below floor
  if (marginBps < input.marginFloorBps) {
    return makeBlockedWithMargin("MARGIN_BELOW_FLOOR", marginBps);
  }

  // Gate 6: Daily limit exceeded
  if (input.dailySpentUnits + input.quotedCostUnits > input.dailyLimitUnits) {
    return makeBlockedWithMargin("DAILY_LIMIT_EXCEEDED", marginBps);
  }

  // Gate 7: Liquidity floor breach
  if (input.currentReserveUnits - input.quotedCostUnits < input.reserveFloorUnits) {
    return makeBlockedWithMargin("LIQUIDITY_FLOOR_BREACH", marginBps);
  }

  // Gate 8: Above auto-purchase limit → ESCALATE
  if (input.saleAmountUnits > input.maxAutoPurchaseUnits) {
    return {
      decision: "ESCALATED",
      reasonCodes: ["ABOVE_AUTO_PURCHASE_LIMIT"],
      calculatedMarginBps: marginBps,
      policyVersion: POLICY_VERSION,
    };
  }

  // Gate 9: All gates passed
  return {
    decision: "AUTO_APPROVED",
    reasonCodes: ["POLICY_PASSED_ALL_GATES"],
    calculatedMarginBps: marginBps,
    policyVersion: POLICY_VERSION,
  };
}

function calcMarginBps(saleUnits: bigint, costUnits: bigint): bigint {
  if (saleUnits === 0n) return 0n;
  return ((saleUnits - costUnits) * 10_000n) / saleUnits;
}

function makeBlocked(code: string, input: PolicyInput): PolicyResult {
  const marginBps = calcMarginBps(input.saleAmountUnits, input.quotedCostUnits);
  return {
    decision: "BLOCKED",
    reasonCodes: [code],
    calculatedMarginBps: marginBps,
    policyVersion: POLICY_VERSION,
  };
}

function makeBlockedWithMargin(code: string, marginBps: bigint): PolicyResult {
  return {
    decision: "BLOCKED",
    reasonCodes: [code],
    calculatedMarginBps: marginBps,
    policyVersion: POLICY_VERSION,
  };
}
