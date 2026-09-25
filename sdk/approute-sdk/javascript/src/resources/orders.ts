import { BaseResource } from "./base-resource.js";
import type {
  DtuCheckResponse,
  PurchaseField,
  PurchaseResponse,
  TransactionListResponse,
} from "../models/index.js";

export interface OrderCreateOptions {
  ordersType?: string;
  referenceId?: string;
  reference?: string;
  orders?: Array<{
    denominationId?: string;
    itemId?: string;
    quantity?: number;
    fields?: PurchaseField[];
    amountCurrencyCode?: string;
    isLongOrder?: boolean;
  }>;
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

export interface DtuCheckOptions {
  itemId: string;
  fields?: PurchaseField[];
  amount?: number;
  currency?: string;
}

export interface OrderListOptions {
  limit?: number;
  offset?: number;
  orderId?: string;
  referenceId?: string;
  unhide?: boolean;
}

/**
 * Resource for the /orders endpoints (purchases and transactions).
 */
export class OrdersResource extends BaseResource {
  /**
   * Create a purchase order (shop or DTU).
   */
  async create(options: OrderCreateOptions): Promise<PurchaseResponse> {
    const body: Record<string, unknown> = {
      ordersType: options.ordersType ?? "shop",
    };

    if (options.referenceId !== undefined) body.referenceId = options.referenceId;
    if (options.reference !== undefined) body.reference = options.reference;
    if (options.orders !== undefined) body.orders = options.orders;
    if (options.itemId !== undefined) body.itemId = options.itemId;
    if (options.productId !== undefined) body.productId = options.productId;
    if (options.quantity !== undefined) body.quantity = options.quantity;
    if (options.amount !== undefined) body.amount = options.amount;
    if (options.currency !== undefined) body.currency = options.currency;
    if (options.clientTime !== undefined) body.clientTime = options.clientTime;
    if (options.fields !== undefined) body.fields = options.fields;
    if (options.directOrder !== undefined) body.directOrder = options.directOrder;
    if (options.accountId !== undefined) body.accountId = options.accountId;

    return this.transport.request<PurchaseResponse>("POST", "/orders", {
      body,
    });
  }

  /**
   * Validate a DTU order without creating it (checkOnly=true).
   */
  async checkDtu(options: DtuCheckOptions): Promise<DtuCheckResponse> {
    const body: Record<string, unknown> = {
      ordersType: "dtu",
      checkOnly: true,
      itemId: options.itemId,
    };

    if (options.fields !== undefined) body.fields = options.fields;
    if (options.amount !== undefined) body.amount = options.amount;
    if (options.currency !== undefined) body.currency = options.currency;

    return this.transport.request<DtuCheckResponse>("POST", "/orders", {
      body,
    });
  }

  /**
   * List orders with pagination.
   */
  async list(options?: OrderListOptions): Promise<TransactionListResponse> {
    const params: Record<string, unknown> = {
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    };

    if (options?.orderId !== undefined) params.orderId = options.orderId;
    if (options?.referenceId !== undefined) params.referenceId = options.referenceId;
    if (options?.unhide !== undefined) params.unhide = options.unhide;

    return this.transport.request<TransactionListResponse>("GET", "/orders", {
      params,
    });
  }
}
