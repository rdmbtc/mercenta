<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Tests\Factory;

/**
 * Fixture builders for the per-item lookup endpoints:
 *   GET  /services/{serviceId}/items/{itemId}
 *   POST /services/items/lookup
 *
 * Returns plain associative arrays in the same shape the transport hands
 * the resource layer (envelope already unwrapped).
 */
final class ItemLookupResponseFactory
{
    /**
     * A single ItemLookupRequestItem array (used inside the POST body).
     *
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    public static function makeLookupRequestItemData(array $overrides = []): array
    {
        return array_merge([
            'serviceId' => 'svc-001',
            'itemId'    => 'item-001',
        ], $overrides);
    }

    /**
     * A single ItemLookupRow array.
     *
     * Defaults to a successful "hit" row. Pass `found => false` plus an
     * `error` (and `item => null`) to model misses.
     *
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    public static function makeLookupRowData(array $overrides = []): array
    {
        $base = [
            'serviceId' => 'svc-001',
            'itemId'    => 'item-001',
            'found'     => true,
            'item'      => ProductFactory::makeProductItemData(),
            'error'     => null,
        ];
        return array_merge($base, $overrides);
    }

    /**
     * Default fixture: mixed 3-row response (hit + service_not_found +
     * item_not_found), matching what the backend returns for partial misses.
     *
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    public static function makeLookupResponseData(array $overrides = []): array
    {
        return array_merge([
            'items' => [
                self::makeLookupRowData(),
                self::makeLookupRowData([
                    'serviceId' => 'svc-missing',
                    'itemId'    => 'item-001',
                    'found'     => false,
                    'item'      => null,
                    'error'     => 'service_not_found',
                ]),
                self::makeLookupRowData([
                    'serviceId' => 'svc-001',
                    'itemId'    => 'item-missing',
                    'found'     => false,
                    'item'      => null,
                    'error'     => 'item_not_found',
                ]),
            ],
        ], $overrides);
    }
}
