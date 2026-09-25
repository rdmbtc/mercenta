/**
 * A key/value field submitted with a purchase order.
 */
export interface PurchaseField {
  key: string;
  value: string;
}

/**
 * Input for a single order item in a batch purchase.
 */
export interface OrderItemInput {
  denominationId?: string;
  itemId?: string;
  quantity?: number;
  fields?: PurchaseField[];
  amountCurrencyCode?: string;
  isLongOrder?: boolean;
}

/**
 * Request body for creating a purchase order.
 */
export interface OrderCreateRequest {
  ordersType: string;
  referenceId?: string;
  reference?: string;
  checkOnly?: boolean;
  orders?: OrderItemInput[];
  itemId?: string;
  productId?: string;
  quantity?: number;
  amount?: number;
  currency?: string;
  clientTime?: string;
  fields?: PurchaseField[];
  directOrder?: boolean;
  accountId?: number;
}

/**
 * A voucher code delivered as part of a purchase result.
 */
export interface Voucher {
  pin: string;
  serialNumber?: string;
  expiration?: string;
}

/**
 * An eSIM profile delivered as part of a purchase result.
 */
export interface Esim {
  matchingId: string;
  qrCodeText: string;
  smdpAddress: string;
  iccid?: string;
}

/**
 * The result payload of a completed purchase.
 */
export interface PurchaseResult {
  vouchers?: Voucher[];
  esim?: Esim;
  attributes?: Record<string, string>;
}

/**
 * Response returned after creating a purchase order.
 */
export interface PurchaseResponse {
  transactionUuid?: string;
  orderId?: string;
  status: string;
  price: number;
  currency: string;
  result?: PurchaseResult;
}

/**
 * Response returned for a DTU check (checkOnly=true).
 */
export interface DtuCheckResponse {
  canRecharge?: boolean;
  price?: number;
  currency?: string;
  providerStatus?: string;
  providerMessage?: string;
  attributes?: Record<string, string>;
}

/**
 * A single transaction in the order history.
 */
export interface TransactionListItem {
  transactionUuid?: string;
  orderId?: string;
  reference?: string;
  serverTime?: string;
  clientTime?: string;
  status: string;
  productId?: string;
  itemId?: string;
  productName?: string;
  itemName?: string;
  quantity: number;
  amount?: number;
  currency?: string;
  accountNumber?: string;
  vouchers?: Voucher[];
}

/**
 * A page of transaction results.
 */
export interface TransactionPage {
  items: TransactionListItem[];
  hasNext: boolean;
}

/**
 * Top-level response wrapping a transaction page.
 */
export interface TransactionListResponse {
  page: TransactionPage;
}
