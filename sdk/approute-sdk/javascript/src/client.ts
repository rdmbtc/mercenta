import { HttpTransport } from "./transport/http-transport.js";
import { AccountsResource } from "./resources/accounts.js";
import { FundsResource } from "./resources/funds.js";
import { OrdersResource } from "./resources/orders.js";
import { ServicesResource } from "./resources/services.js";
import { SteamCurrencyResource } from "./resources/steamCurrency.js";

const DEFAULT_BASE_URL = "https://approute.io/api/v1";

export interface AppRouteClientOptions {
  /** Your API key (e.g. "sk_live_..."). */
  apiKey: string;
  /** Base URL for the API. Defaults to "https://approute.io/api/v1". */
  baseUrl?: string;
  /** Request timeout in milliseconds. Defaults to 30000 (30 seconds). */
  timeout?: number;
  /** Maximum number of retries on 429/5xx responses. Defaults to 3. */
  maxRetries?: number;
}

/**
 * Main client for the AppRoute Public API.
 *
 * @example
 * ```ts
 * const client = new AppRouteClient({ apiKey: "sk_live_..." });
 * const products = await client.services.list();
 * ```
 */
export class AppRouteClient {
  /** Product catalog operations. */
  public readonly services: ServicesResource;
  /** Order creation and listing. */
  public readonly orders: OrdersResource;
  /** Account balances and transaction history. */
  public readonly accounts: AccountsResource;
  /** Funding methods, invoices, TON, and Bybit operations. */
  public readonly funds: FundsResource;
  /** Steam currency exchange rates. */
  public readonly steamCurrency: SteamCurrencyResource;

  private readonly transport: HttpTransport;

  constructor(options: AppRouteClientOptions) {
    this.transport = new HttpTransport(
      options.baseUrl ?? DEFAULT_BASE_URL,
      options.apiKey,
      options.timeout ?? 30_000,
      options.maxRetries ?? 3,
    );

    this.services = new ServicesResource(this.transport);
    this.orders = new OrdersResource(this.transport);
    this.accounts = new AccountsResource(this.transport);
    this.funds = new FundsResource(this.transport);
    this.steamCurrency = new SteamCurrencyResource(this.transport);
  }
}
