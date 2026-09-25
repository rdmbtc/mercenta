/**
 * Single source of truth for every number the landing page shows.
 * The film, the terminal, the decision feed and the hero all read from here,
 * so an illustrative balance or floor cannot drift between sections.
 * Nothing here is live: it is a fixed, illustrative configuration evaluated in the browser.
 */

export type SupplierState = "verified" | "uncertain";
export type CheckState = "pass" | "fail" | "hold";
export type Decision = "Cleared" | "Policy blocked" | "Human approval required";
export type Tone = "ok" | "stop" | "hold";

export type PolicyCheck = {
  id: "balance" | "reserved" | "margin" | "supplier" | "limit";
  label: string;
  note: string;
  state: CheckState;
};

export type PolicyResult = {
  decision: Decision;
  margin: number;
  checks: PolicyCheck[];
};

export type PolicyCase = {
  label: string;
  amount: number;
  cost: number;
  supplier: SupplierState;
};

export const POLICY = {
  version: "policy v0.3 · illustrative",
  availableToSpend: 12_400,
  reserved: 3_150,
  grossMarginFloor: 0.15,
  autoApprovalLimit: 5_000,
  platformFee: 0.015,
} as const;

export const ORDER = {
  id: "MR-ORD-2481",
  listing: "Cloud Compute Vouchers",
  sku: "MR-CMP-250",
  units: 250,
  unit: "compute hours",
  supplier: "CloudCore Compute",
  wholesaleRate: 6.8,
} as const;

export const CASES = {
  order: { label: "This page\u2019s order", amount: 2_100, cost: 1_700, supplier: "verified" },
  thin: { label: "Thin margin", amount: 1_800, cost: 1_700, supplier: "verified" },
  uncertain: { label: "Supplier uncertain", amount: 2_100, cost: 1_700, supplier: "uncertain" },
  overLimit: { label: "Over approval limit", amount: 7_800, cost: 6_200, supplier: "verified" },
} satisfies Record<string, PolicyCase>;

const usdcFormat = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function usdc(value: number): string {
  return usdcFormat.format(Number.isFinite(value) ? value : 0) + " USDC";
}

export function percent(ratio: number): string {
  const safe = Number.isFinite(ratio) ? ratio : 0;
  return (safe * 100).toFixed(1) + "%";
}

export function tone(decision: Decision): Tone {
  if (decision === "Cleared") return "ok";
  if (decision === "Policy blocked") return "stop";
  return "hold";
}

export function grossMargin(amount: number, cost: number): number {
  if (!(amount > 0)) return 0;
  return (amount - cost) / amount;
}

/**
 * The five checks, always in this order. A failed check blocks the order; if nothing fails,
 * a held check escalates to a human; otherwise the order is cleared. No model is consulted.
 */
export function evaluatePolicy(amount: number, cost: number, supplier: SupplierState): PolicyResult {
  const free = POLICY.availableToSpend - POLICY.reserved;
  const margin = grossMargin(amount, cost);

  const checks: PolicyCheck[] = [
    {
      id: "balance",
      label: "Amount within Available to spend",
      state: amount > 0 && amount <= POLICY.availableToSpend ? "pass" : "fail",
      note:
        amount > 0
          ? usdc(amount) + " against " + usdc(POLICY.availableToSpend)
          : "Order amount must be above zero",
    },
    {
      id: "reserved",
      label: "Supplier cost covered after Reserved",
      state: cost <= free ? "pass" : "fail",
      note: usdc(cost) + " against " + usdc(free) + " free after Reserved",
    },
    {
      id: "margin",
      label: "Gross margin at or above the floor",
      state: margin >= POLICY.grossMarginFloor ? "pass" : "fail",
      note: percent(margin) + " projected · floor " + percent(POLICY.grossMarginFloor),
    },
    {
      id: "supplier",
      label: "Supplier status",
      state: supplier === "verified" ? "pass" : "fail",
      note:
        supplier === "verified"
          ? "Supplier verified · price and availability confirmed"
          : "Supplier uncertain · price or availability cannot be guaranteed",
    },
    {
      id: "limit",
      label: "Within the auto-approval limit",
      state: amount <= POLICY.autoApprovalLimit ? "pass" : "hold",
      note:
        amount <= POLICY.autoApprovalLimit
          ? usdc(amount) + " at or under " + usdc(POLICY.autoApprovalLimit)
          : usdc(amount) + " exceeds " + usdc(POLICY.autoApprovalLimit) + " · routed to a human",
    },
  ];

  const decision: Decision = checks.some((check) => check.state === "fail")
    ? "Policy blocked"
    : checks.some((check) => check.state === "hold")
      ? "Human approval required"
      : "Cleared";

  return { decision, margin, checks };
}
