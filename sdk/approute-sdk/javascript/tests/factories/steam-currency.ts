import type {
  SteamCurrencyRate,
  SteamCurrencyRatesResponse,
} from '../../src/models/index.js';

/**
 * Helper: JSON responses use `null` for absent optional fields.
 */
type Nullable<T> = { [K in keyof T]: T[K] | null };

export function makeSteamCurrencyRate(
  overrides?: Partial<Nullable<SteamCurrencyRate>>,
): SteamCurrencyRate {
  return {
    quoteCurrencyCode: 'RUB',
    rate: '92.50',
    providerCreatedAt: '2026-03-01T12:00:00Z',
    fetchedAt: '2026-03-01T12:01:00Z',
    ...overrides,
  } as SteamCurrencyRate;
}

export function makeSteamCurrencyRatesResponse(
  overrides?: Partial<SteamCurrencyRatesResponse>,
): SteamCurrencyRatesResponse {
  return {
    baseCurrencyCode: 'USD',
    items: [
      makeSteamCurrencyRate(),
      makeSteamCurrencyRate({
        quoteCurrencyCode: 'EUR',
        rate: '0.92',
        providerCreatedAt: null,
        fetchedAt: null,
      }),
    ],
    ...overrides,
  };
}
