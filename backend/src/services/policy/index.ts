export type PolicyInput = {
  confirmations: bigint;
  paid: bigint;
  sale: bigint;
  cost: bigint;
  replay: boolean;
  active: boolean;
  supplierReady: boolean;
  dailySpent: bigint;
  available: bigint;
  quoteAt: number;
  now: number;
  humanApproved?: boolean;
};
export const LIMITS = {
  marginBps: 1500n,
  auto: 10_000_000n,
  daily: 2_500_000_000n,
  reserve: 10_000_000_000n,
};
export function evaluate(i: PolicyInput) {
  const margin = i.sale > 0n ? ((i.sale - i.cost) * 10000n) / i.sale : 0n;
  const checks = [
    ["P1", "PAYMENT_NOT_FINAL", i.confirmations >= 2n],
    ["P2", "PAYMENT_UNDERPAID", i.sale > 0n && i.paid >= i.sale],
    ["P3", "PAYMENT_ALREADY_USED", !i.replay],
    ["P4", "SKU_DISABLED", i.active],
    ["P5", "SUPPLIER_UNAVAILABLE", i.supplierReady],
    ["P6", "NEGATIVE_MARGIN", i.cost >= 0n && i.sale > i.cost],
    ["P7", "MARGIN_BELOW_FLOOR", margin >= LIMITS.marginBps],
    [
      "P8",
      "ABOVE_AUTO_LIMIT",
      i.sale <= LIMITS.auto || i.humanApproved === true,
    ],
    [
      "P9",
      "DAILY_LIMIT_EXCEEDED",
      i.dailySpent >= 0n && i.dailySpent + i.cost <= LIMITS.daily,
    ],
    ["P10", "RESERVE_FLOOR_BREACH", i.available - i.cost >= LIMITS.reserve],
    [
      "P11",
      "STALE_SUPPLIER_QUOTE",
      i.quoteAt <= i.now && i.now - i.quoteAt <= 300000,
    ],
  ] as const;
  const hardBlock = checks.some(([id, , ok]) => id !== "P8" && !ok);
  return {
    decision: hardBlock
      ? "BLOCKED"
      : checks[7]?.[2]
        ? "AUTO_APPROVED"
        : "ESCALATED",
    marginBps: margin.toString(),
    policyVersion: "2026.10-p1-p11",
    checks: checks.map(([id, reason, pass]) => ({ id, reason, pass })),
  };
}
