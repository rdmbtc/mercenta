/**
 * Supported funding method codes.
 */
export const FundingMethodCode = {
  USDT_TRC20: "USDT_TRC20",
  USDT_BEP20: "USDT_BEP20",
  USDT_TON: "USDT_TON",
  USDT_BYBIT: "USDT_BYBIT",
} as const;

export type FundingMethodCode =
  (typeof FundingMethodCode)[keyof typeof FundingMethodCode];

/**
 * Funding invoice statuses.
 */
export const FundingStatus = {
  PENDING: "pending",
  CONFIRMING: "confirming",
  SUCCESS: "success",
  FAIL: "fail",
  EXPIRED: "expired",
} as const;

export type FundingStatus =
  (typeof FundingStatus)[keyof typeof FundingStatus];
