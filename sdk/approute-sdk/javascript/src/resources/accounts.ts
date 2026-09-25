import { BaseResource } from "./base-resource.js";
import type {
  AccountListResponse,
  AccountTransactionPage,
} from "../models/index.js";

export interface AccountTransactionsOptions {
  currency?: string;
  category?: string[];
  search?: string;
  transactionId?: string;
  orderId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

/**
 * Resource for the /accounts endpoints (balances and transactions).
 */
export class AccountsResource extends BaseResource {
  /**
   * List account balances.
   */
  async balances(): Promise<AccountListResponse> {
    return this.transport.request<AccountListResponse>("GET", "/accounts");
  }

  /**
   * List balance transactions with filtering.
   */
  async transactions(
    options?: AccountTransactionsOptions,
  ): Promise<AccountTransactionPage> {
    const params: Record<string, unknown> = {
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    };

    if (options?.currency !== undefined) params.currency = options.currency;
    if (options?.category !== undefined) params.category = options.category;
    if (options?.search !== undefined) params.search = options.search;
    if (options?.transactionId !== undefined)
      params.transactionId = options.transactionId;
    if (options?.orderId !== undefined) params.orderId = options.orderId;
    if (options?.dateFrom !== undefined) params.dateFrom = options.dateFrom;
    if (options?.dateTo !== undefined) params.dateTo = options.dateTo;

    return this.transport.request<AccountTransactionPage>(
      "GET",
      "/accounts/transactions",
      { params },
    );
  }
}
