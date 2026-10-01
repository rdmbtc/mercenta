import { describe, it, expect } from "vitest";
import { evaluatePolicy, POLICY_VERSION } from "@/lib/policy-engine.js";
import type { PolicyInput } from "@/lib/policy-engine.js";

function baseInput(overrides: Partial<PolicyInput> = {}): PolicyInput {
  return {
    orderId: "test-order",
    saleAmountUnits: 10_000_000n,
    quotedCostUnits: 8_000_000n,
    skuEnabled: true,
    supplierAvailable: true,
    marginFloorBps: 1500n,
    maxAutoPurchaseUnits: 10_000_000n,
    dailySpentUnits: 0n,
    dailyLimitUnits: 2_500_000_000n,
    currentReserveUnits: 100_000_000_000n,
    reserveFloorUnits: 10_000_000_000n,
    quoteTimestamp: 1000,
    currentTimestamp: 1100,
    ...overrides,
  };
}

describe("policy-engine", () => {
  it("AUTO_APPROVED when all gates pass", () => {
    const r = evaluatePolicy(baseInput());
    expect(r.decision).toBe("AUTO_APPROVED");
    expect(r.reasonCodes).toEqual(["POLICY_PASSED_ALL_GATES"]);
    expect(r.policyVersion).toBe(POLICY_VERSION);
    expect(r.calculatedMarginBps).toBe(2000n);
  });

  it("BLOCKED: SKU_DISABLED", () => {
    const r = evaluatePolicy(baseInput({ skuEnabled: false }));
    expect(r.decision).toBe("BLOCKED");
    expect(r.reasonCodes).toContain("SKU_DISABLED");
  });

  it("BLOCKED: SUPPLIER_UNAVAILABLE", () => {
    const r = evaluatePolicy(baseInput({ supplierAvailable: false }));
    expect(r.decision).toBe("BLOCKED");
    expect(r.reasonCodes).toContain("SUPPLIER_UNAVAILABLE");
  });

  it("BLOCKED: STALE_SUPPLIER_QUOTE (>300s)", () => {
    const r = evaluatePolicy(baseInput({ currentTimestamp: 1401, quoteTimestamp: 1000 }));
    expect(r.decision).toBe("BLOCKED");
    expect(r.reasonCodes).toContain("STALE_SUPPLIER_QUOTE");
  });

  it("not blocked at exactly 300s", () => {
    const r = evaluatePolicy(baseInput({ currentTimestamp: 1300, quoteTimestamp: 1000 }));
    expect(r.decision).not.toBe("BLOCKED");
  });

  it("BLOCKED: MARGIN_NEGATIVE (cost > sale)", () => {
    const r = evaluatePolicy(baseInput({ quotedCostUnits: 11_000_000n }));
    expect(r.decision).toBe("BLOCKED");
    expect(r.reasonCodes).toContain("MARGIN_NEGATIVE");
  });

  it("BLOCKED: MARGIN_BELOW_FLOOR", () => {
    const r = evaluatePolicy(baseInput({ quotedCostUnits: 9_000_000n }));
    expect(r.decision).toBe("BLOCKED");
    expect(r.reasonCodes).toContain("MARGIN_BELOW_FLOOR");
    expect(r.calculatedMarginBps).toBe(1000n);
  });

  it("BLOCKED: DAILY_LIMIT_EXCEEDED", () => {
    const r = evaluatePolicy(baseInput({
      dailySpentUnits: 2_499_000_000n,
      quotedCostUnits: 8_000_000n,
      dailyLimitUnits: 2_500_000_000n,
    }));
    expect(r.decision).toBe("BLOCKED");
    expect(r.reasonCodes).toContain("DAILY_LIMIT_EXCEEDED");
  });

  it("BLOCKED: LIQUIDITY_FLOOR_BREACH", () => {
    const r = evaluatePolicy(baseInput({
      currentReserveUnits: 10_005_000_000n,
      reserveFloorUnits: 10_000_000_000n,
      quotedCostUnits: 8_000_000n,
    }));
    expect(r.decision).toBe("BLOCKED");
    expect(r.reasonCodes).toContain("LIQUIDITY_FLOOR_BREACH");
  });

  it("ESCALATED: ABOVE_AUTO_PURCHASE_LIMIT", () => {
    const r = evaluatePolicy(baseInput({ saleAmountUnits: 11_000_000n }));
    expect(r.decision).toBe("ESCALATED");
    expect(r.reasonCodes).toContain("ABOVE_AUTO_PURCHASE_LIMIT");
  });

  it("rule priority: SKU_DISABLED before margin check", () => {
    const r = evaluatePolicy(baseInput({
      skuEnabled: false,
      quotedCostUnits: 11_000_000n,
    }));
    expect(r.reasonCodes).toEqual(["SKU_DISABLED"]);
  });

  it("deterministic: same input → identical output", () => {
    const input = baseInput();
    const a = evaluatePolicy(input);
    const b = evaluatePolicy(input);
    expect(a.decision).toBe(b.decision); expect(a.reasonCodes).toEqual(b.reasonCodes); expect(a.calculatedMarginBps).toBe(b.calculatedMarginBps); expect(a.policyVersion).toBe(b.policyVersion);
  });

  it("zero sale amount → margin 0 bps", () => {
    const r = evaluatePolicy(baseInput({ saleAmountUnits: 0n, quotedCostUnits: 0n }));
    expect(r.calculatedMarginBps).toBe(0n);
  });

  it("policyVersion is correct", () => {
    expect(evaluatePolicy(baseInput()).policyVersion).toBe("2026.10-tameion");
  });
});
