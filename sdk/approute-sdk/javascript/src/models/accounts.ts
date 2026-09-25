/**
 * A single activity entry on an account (recent transactions summary).
 */
export interface AccountActivity {
  id: string;
  currency: string;
  amount: number;
  operation: string;
  createdAt: string;
}

/**
 * An account with balance information and recent activity.
 */
export interface Account {
  currency: string;
  balance: number;
  available: number;
  overdraftLimit: number;
  recentActivity: AccountActivity[];
}

/**
 * Response containing a list of accounts.
 */
export interface AccountListResponse {
  items: Account[];
}

/**
 * A single balance transaction record.
 */
export interface AccountTransaction {
  id: string;
  currency: string;
  transactionId: string;
  category: string;
  balance: number;
  amount: number;
  orderId: string;
  orderIdRaw?: string;
  description?: string;
  createdAt: string;
}

/**
 * Paginated response for account transactions.
 */
export interface AccountTransactionPage {
  totalCount: number;
  items: AccountTransaction[];
}
