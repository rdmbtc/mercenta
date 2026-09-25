import type {
  FundingMethod,
  FundingMethodsResponse,
  FundingInvoice,
  FundingInvoiceList,
  FundingInvoiceTimeLeft,
  TonDepositState,
  BybitState,
} from '../../src/models/index.js';

/**
 * Helper: JSON responses use `null` for absent optional fields.
 */
type Nullable<T> = { [K in keyof T]: T[K] | null };

export function makeFundingMethod(
  overrides?: Partial<FundingMethod>,
): FundingMethod {
  return {
    code: 'USDT_TRC20',
    name: 'USDT (TRC-20)',
    minAmount: 10.0,
    commission: 0.0,
    address: 'TXyz123abc',
    ttlMinutes: 60,
    confirmationsRequired: 20,
    ...overrides,
  };
}

export function makeFundingMethodsResponse(
  overrides?: Partial<FundingMethodsResponse>,
): FundingMethodsResponse {
  return {
    items: [makeFundingMethod()],
    ...overrides,
  };
}

export function makeFundingInvoice(
  overrides?: Partial<Nullable<FundingInvoice>>,
): FundingInvoice {
  return {
    id: 'inv-001',
    methodCode: 'USDT_TRC20',
    amountExpected: 100.0,
    commission: 0.0,
    credited: 0.0,
    memoTag: null,
    address: 'TXyz123abc',
    txHash: null,
    status: 'pending',
    confirmationsRequired: 20,
    confirmations: 0,
    createdAt: '2026-03-01T12:00:00Z',
    expiresAt: '2026-03-01T13:00:00Z',
    direction: 'incoming',
    ...overrides,
  } as FundingInvoice;
}

export function makeFundingInvoiceList(
  overrides?: Partial<FundingInvoiceList>,
): FundingInvoiceList {
  return {
    items: [makeFundingInvoice()],
    total: 1,
    ...overrides,
  };
}

export function makeFundingInvoiceTimeLeft(
  overrides?: Partial<FundingInvoiceTimeLeft>,
): FundingInvoiceTimeLeft {
  return {
    invoiceId: 'inv-001',
    expiresAt: '2026-03-01T13:00:00Z',
    secondsLeft: 3200,
    expired: false,
    ...overrides,
  };
}

export function makeTonDepositState(
  overrides?: Partial<TonDepositState>,
): TonDepositState {
  return {
    address: 'EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF78p7Av',
    memoTag: '123456',
    ...overrides,
  };
}

export function makeBybitState(
  overrides?: Partial<BybitState>,
): BybitState {
  return {
    recipientUid: 'bybit-uid-001',
    linked: true,
    yourUid: 'bybit-uid-002',
    ...overrides,
  };
}
