import { BaseResource } from "./base-resource.js";
import type {
  BybitState,
  FundingInvoice,
  FundingInvoiceList,
  FundingInvoiceTimeLeft,
  FundingMethodsResponse,
  TonDepositState,
} from "../models/index.js";

export interface CreateInvoiceOptions {
  methodCode: string;
  amount: number;
}

export interface ListInvoicesOptions {
  status?: string[];
  methodCode?: string[];
  search?: string;
  invoiceId?: string;
  createdFrom?: string;
  createdTo?: string;
  withTx?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Resource for the /funds endpoints (funding methods and invoices).
 */
export class FundsResource extends BaseResource {
  /**
   * List available funding methods.
   */
  async methods(): Promise<FundingMethodsResponse> {
    return this.transport.request<FundingMethodsResponse>(
      "GET",
      "/funds/methods",
    );
  }

  /**
   * Create a funding invoice.
   */
  async createInvoice(options: CreateInvoiceOptions): Promise<FundingInvoice> {
    return this.transport.request<FundingInvoice>("POST", "/funds/invoices", {
      body: {
        methodCode: options.methodCode,
        amount: options.amount,
      },
    });
  }

  /**
   * List funding invoices with filtering.
   */
  async listInvoices(
    options?: ListInvoicesOptions,
  ): Promise<FundingInvoiceList> {
    const params: Record<string, unknown> = {
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    };

    if (options?.status !== undefined) params.status = options.status;
    if (options?.methodCode !== undefined) params.methodCode = options.methodCode;
    if (options?.search !== undefined) params.search = options.search;
    if (options?.invoiceId !== undefined) params.invoiceId = options.invoiceId;
    if (options?.createdFrom !== undefined) params.createdFrom = options.createdFrom;
    if (options?.createdTo !== undefined) params.createdTo = options.createdTo;
    if (options?.withTx !== undefined) params.withTx = options.withTx;

    return this.transport.request<FundingInvoiceList>(
      "GET",
      "/funds/invoices",
      { params },
    );
  }

  /**
   * Get a single funding invoice by ID.
   */
  async getInvoice(invoiceId: string): Promise<FundingInvoice> {
    return this.transport.request<FundingInvoice>(
      "GET",
      `/funds/invoices/${invoiceId}`,
    );
  }

  /**
   * Check (refresh) the status of a funding invoice.
   */
  async checkInvoice(invoiceId: string): Promise<FundingInvoice> {
    return this.transport.request<FundingInvoice>(
      "POST",
      `/funds/invoices/${invoiceId}/check`,
    );
  }

  /**
   * Get time left before a funding invoice expires.
   */
  async invoiceTimeLeft(invoiceId: string): Promise<FundingInvoiceTimeLeft> {
    return this.transport.request<FundingInvoiceTimeLeft>(
      "GET",
      `/funds/invoices/${invoiceId}/time-left`,
    );
  }

  /**
   * Get TON deposit address and memo tag.
   */
  async tonDeposit(): Promise<TonDepositState> {
    return this.transport.request<TonDepositState>(
      "GET",
      "/funds/ton/deposit",
    );
  }

  /**
   * Get Bybit UID state.
   */
  async bybitState(): Promise<BybitState> {
    return this.transport.request<BybitState>("GET", "/funds/bybit/state");
  }

  /**
   * Attach a Bybit UID.
   */
  async bybitAttach(uid: string): Promise<BybitState> {
    return this.transport.request<BybitState>("POST", "/funds/bybit/attach", {
      body: { uid },
    });
  }

  /**
   * Unlink the attached Bybit UID.
   */
  async bybitUnlink(): Promise<BybitState> {
    return this.transport.request<BybitState>("POST", "/funds/bybit/unlink");
  }
}
