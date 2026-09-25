import { BaseResource } from "./base-resource.js";
import type { SteamCurrencyRatesResponse } from "../models/index.js";

export interface SteamCurrencyRatesOptions {
  quotes?: string[];
}

/**
 * Resource for the /steam-currency endpoints.
 */
export class SteamCurrencyResource extends BaseResource {
  /**
   * Get Steam currency exchange rates.
   */
  async rates(
    options?: SteamCurrencyRatesOptions,
  ): Promise<SteamCurrencyRatesResponse> {
    const params: Record<string, unknown> | undefined =
      options?.quotes ? { quotes: options.quotes } : undefined;

    return this.transport.request<SteamCurrencyRatesResponse>(
      "GET",
      "/steam-currency/rates",
      params ? { params } : undefined,
    );
  }
}
