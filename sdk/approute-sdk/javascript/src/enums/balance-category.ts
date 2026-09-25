/**
 * Balance transaction categories.
 */
export const BalanceCategory = {
  FUNDING: "funding",
  REFUND: "refund",
  WITHDRAW: "withdraw",
  SHOP: "shop",
  DIRECT_TOP_UP: "direct-top-up",
} as const;

export type BalanceCategory =
  (typeof BalanceCategory)[keyof typeof BalanceCategory];
