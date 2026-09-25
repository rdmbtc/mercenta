import type {
  AccountActivity,
  Account,
  AccountListResponse,
  AccountTransaction,
  AccountTransactionPage,
} from '../../src/models/index.js';

/**
 * Helper: JSON responses use `null` for absent optional fields.
 */
type Nullable<T> = { [K in keyof T]: T[K] | null };

export function makeAccountActivity(
  overrides?: Partial<AccountActivity>,
): AccountActivity {
  return {
    id: 'act-001',
    currency: 'USD',
    amount: -48.5,
    operation: 'purchase',
    createdAt: '2026-03-01T12:00:00Z',
    ...overrides,
  };
}

export function makeAccount(overrides?: Partial<Account>): Account {
  return {
    currency: 'USD',
    balance: 1250.50,
    available: 1200.00,
    overdraftLimit: 0.0,
    recentActivity: [makeAccountActivity()],
    ...overrides,
  };
}

export function makeAccountListResponse(
  overrides?: Partial<AccountListResponse>,
): AccountListResponse {
  return {
    items: [makeAccount()],
    ...overrides,
  };
}

export function makeAccountTransaction(
  overrides?: Partial<Nullable<AccountTransaction>>,
): AccountTransaction {
  return {
    id: 'tx-001',
    currency: 'USD',
    transactionId: 'txn-abc-123',
    category: 'shop',
    balance: 1250.50,
    amount: -48.5,
    orderId: 'ord-456',
    orderIdRaw: null,
    description: 'Steam Wallet 50 USD',
    createdAt: '2026-03-01T12:00:00Z',
    ...overrides,
  } as AccountTransaction;
}

export function makeAccountTransactionPage(
  overrides?: Partial<AccountTransactionPage>,
): AccountTransactionPage {
  return {
    totalCount: 1,
    items: [makeAccountTransaction()],
    ...overrides,
  };
}
