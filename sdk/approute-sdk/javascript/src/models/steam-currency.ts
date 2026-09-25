/**
 * A single Steam currency exchange rate.
 */
export interface SteamCurrencyRate {
  quoteCurrencyCode: string;
  rate: string;
  providerCreatedAt?: string;
  fetchedAt?: string;
}

/**
 * Response containing Steam currency exchange rates.
 */
export interface SteamCurrencyRatesResponse {
  baseCurrencyCode: string;
  items: SteamCurrencyRate[];
}
