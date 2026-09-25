/**
 * A supported funding method (e.g. USDT TRC-20).
 */
export interface FundingMethod {
  code: string;
  name: string;
  minAmount: number;
  commission: number;
  address: string;
  ttlMinutes: number;
  confirmationsRequired: number;
}

/**
 * Response containing available funding methods.
 */
export interface FundingMethodsResponse {
  items: FundingMethod[];
}

/**
 * A funding invoice.
 */
export interface FundingInvoice {
  id: string;
  methodCode: string;
  amountExpected: number;
  commission: number;
  credited: number;
  memoTag?: string;
  address: string;
  txHash?: string;
  status: string;
  confirmationsRequired?: number;
  confirmations?: number;
  createdAt: string;
  expiresAt: string;
  direction: string;
}

/**
 * Paginated list of funding invoices.
 */
export interface FundingInvoiceList {
  items: FundingInvoice[];
  total: number;
}

/**
 * Request body for creating a funding invoice.
 */
export interface FundingInvoiceCreateRequest {
  methodCode: string;
  amount: number;
}

/**
 * Time remaining before a funding invoice expires.
 */
export interface FundingInvoiceTimeLeft {
  invoiceId: string;
  expiresAt: string;
  secondsLeft: number;
  expired: boolean;
}

/**
 * TON deposit address and memo tag.
 */
export interface TonDepositState {
  address: string;
  memoTag: string;
}

/**
 * Bybit UID linkage state.
 */
export interface BybitState {
  recipientUid: string;
  linked: boolean;
  yourUid?: string;
}

/**
 * Request body for attaching a Bybit UID.
 */
export interface BybitAttachRequest {
  uid: string;
}
