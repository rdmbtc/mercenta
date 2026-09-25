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

export type Scenario = PolicyCase & {
  id: string;
  agent: string;
  listing: string;
  quantity: string;
  supplierName: string;
};

/** Persona-flavoured presets for the terminal. Generic agent names on purpose: no third-party products are implied. */
export const SCENARIOS: Scenario[] = [
  {
    id: "compute",
    label: "Research agent buys GPU hours",
    agent: "research-agent",
    listing: ORDER.listing,
    quantity: ORDER.units + " " + ORDER.unit,
    supplierName: ORDER.supplier,
    amount: CASES.order.amount,
    cost: CASES.order.cost,
    supplier: "verified",
  },
  {
    id: "seats",
    label: "Ops agent books 100 seats",
    agent: "ops-agent",
    listing: "Enterprise SaaS Seats",
    quantity: "100 seat-months",
    supplierName: "Northwind Licensing",
    amount: CASES.overLimit.amount,
    cost: CASES.overLimit.cost,
    supplier: "verified",
  },
  {
    id: "thin",
    label: "Pricing agent quotes too low",
    agent: "pricing-agent",
    listing: ORDER.listing,
    quantity: ORDER.units + " " + ORDER.unit,
    supplierName: ORDER.supplier,
    amount: CASES.thin.amount,
    cost: CASES.thin.cost,
    supplier: "verified",
  },
  {
    id: "uncertain",
    label: "Buyer agent picks an unverified supplier",
    agent: "buyer-agent",
    listing: "API Credit Bundles",
    quantity: "1,000 credits",
    supplierName: "Unlisted reseller",
    amount: 860,
    cost: 720,
    supplier: "uncertain",
  },
  {
    id: "rogue",
    label: "Rogue scraper attempts a runaway spend",
    agent: "scraper-bot",
    listing: "API Credit Bundles",
    quantity: "60,000 credits",
    supplierName: "Vertex Credit Desk",
    amount: 50_000,
    cost: 42_000,
    supplier: "verified",
  },
];

const usdcFormat = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function usdc(value: number): string {
  return usdcFormat.format(Number.isFinite(value) ? value : 0) + " USDC";
}

export function usdcPlain(value: number): string {
  return usdcFormat.format(Number.isFinite(value) ? value : 0);
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

/* FNV-1a, 32-bit. Purely presentational: gives the terminal a stable, order-specific looking token and seal. */
function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** Illustrative settlement credential for a given intent. Deterministic, so the same inputs always show the same token. */
export function credential(amount: number, cost: number, supplier: SupplierState) {
  const seed = [amount, cost, supplier].join("|");
  const a = fnv1a(seed);
  const b = fnv1a(seed + "#seal");
  return {
    tail: String(a % 10_000).padStart(4, "0"),
    seal: (a.toString(16).padStart(8, "0") + b.toString(16).padStart(8, "0")).slice(0, 16),
  };
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
