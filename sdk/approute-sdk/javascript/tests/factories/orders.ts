import type {
  Voucher,
  PurchaseResult,
  PurchaseResponse,
  DtuCheckResponse,
  TransactionListItem,
  TransactionPage,
  TransactionListResponse,
} from '../../src/models/index.js';

/**
 * Helper: JSON responses use `null` for absent optional fields.
 */
type Nullable<T> = { [K in keyof T]: T[K] | null };

export function makeVoucher(overrides?: Partial<Voucher>): Voucher {
  return {
    pin: 'XXXX-YYYY-ZZZZ',
    serialNumber: 'SN-12345',
    expiration: '2027-12-31T23:59:59Z',
    ...overrides,
  };
}

export function makePurchaseResult(
  overrides?: Partial<Nullable<PurchaseResult>>,
): PurchaseResult {
  return {
    vouchers: [makeVoucher()],
    esim: null,
    attributes: null,
    ...overrides,
  } as PurchaseResult;
}

export function makePurchaseResponse(
  overrides?: Partial<PurchaseResponse>,
): PurchaseResponse {
  return {
    transactionUuid: 'txn-abc-123',
    orderId: 'ord-456',
    status: 'completed',
    price: 48.5,
    currency: 'USD',
    result: makePurchaseResult(),
    ...overrides,
  };
}

export function makeDtuCheckResponse(
  overrides?: Partial<Nullable<DtuCheckResponse>>,
): DtuCheckResponse {
  return {
    canRecharge: true,
    price: 10.0,
    currency: 'USD',
    providerStatus: 'available',
    providerMessage: null,
    attributes: { operatorName: 'T-Mobile' },
    ...overrides,
  } as DtuCheckResponse;
}

export function makeTransactionListItem(
  overrides?: Partial<Nullable<TransactionListItem>>,
): TransactionListItem {
  return {
    transactionUuid: 'txn-abc-123',
    orderId: 'ord-456',
    reference: 'ref-001',
    serverTime: '2026-03-01T12:00:00Z',
    clientTime: null,
    status: 'completed',
    productId: 'prod-001',
    itemId: 'item-001',
    productName: 'Steam Wallet 50 USD',
    itemName: '50 USD',
    quantity: 1,
    amount: 48.5,
    currency: 'USD',
    accountNumber: null,
    vouchers: null,
    ...overrides,
  } as TransactionListItem;
}

export function makeTransactionPage(
  overrides?: Partial<TransactionPage>,
): TransactionPage {
  return {
    items: [makeTransactionListItem()],
    hasNext: false,
    ...overrides,
  };
}

export function makeTransactionListResponse(
  overrides?: Partial<TransactionListResponse>,
): TransactionListResponse {
  return {
    page: makeTransactionPage(),
    ...overrides,
  };
}
