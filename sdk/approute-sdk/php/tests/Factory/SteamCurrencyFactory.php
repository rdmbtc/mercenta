<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Tests\Factory;

final class SteamCurrencyFactory
{
    /**
     * A single steam-currency-rate array.
     *
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    public static function makeRateData(array $overrides = []): array
    {
        return array_merge([
            'quoteCurrencyCode' => 'RUB',
            'rate' => '92.50',
            'providerCreatedAt' => '2026-03-01T12:00:00Z',
            'fetchedAt' => '2026-03-01T12:01:00Z',
        ], $overrides);
    }

    /**
     * Response data for GET /steam-currency/rates.
     *
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    public static function makeRatesData(array $overrides = []): array
    {
        return array_merge([
            'baseCurrencyCode' => 'USD',
            'items' => [
                self::makeRateData(),
                self::makeRateData([
                    'quoteCurrencyCode' => 'EUR',
                    'rate' => '0.92',
                    'providerCreatedAt' => null,
                    'fetchedAt' => null,
                ]),
            ],
        ], $overrides);
    }
}
