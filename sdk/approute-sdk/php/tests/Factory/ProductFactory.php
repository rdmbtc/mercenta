<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Tests\Factory;

final class ProductFactory
{
    /**
     * A single product-item array (used inside product "items" arrays).
     *
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    public static function makeProductItemData(array $overrides = []): array
    {
        return array_merge([
            'id' => 'item-001',
            'name' => '50 USD',
            'nominal' => 50.0,
            'price' => 48.5,
            'currency' => 'USD',
            'available' => true,
            'stock' => 150,
        ], $overrides);
    }

    /**
     * A single field-validation array.
     *
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    public static function makeFieldValidationData(array $overrides = []): array
    {
        return array_merge([
            'pattern' => '^[^@]+@[^@]+$',
            'message' => 'Invalid email',
        ], $overrides);
    }

    /**
     * A single product-field array (used inside product "fields" arrays).
     *
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    public static function makeProductFieldData(array $overrides = []): array
    {
        return array_merge([
            'key' => 'email',
            'type' => 'text',
            'required' => true,
            'label' => 'Email',
            'options' => null,
            'validation' => self::makeFieldValidationData(),
        ], $overrides);
    }

    /**
     * A single product array (full product with items and optional fields).
     *
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    public static function makeProductData(array $overrides = []): array
    {
        return array_merge([
            'id' => 'prod-001',
            'name' => 'Steam Wallet 50 USD',
            'type' => 'voucher',
            'imageUrl' => null,
            'countryCode' => 'US',
            'categoryName' => 'Gaming',
            'subcategoryName' => 'Steam',
            'items' => [self::makeProductItemData()],
            'fields' => null,
        ], $overrides);
    }

    /**
     * Response data for GET /services (product list).
     *
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    public static function makeProductListData(array $overrides = []): array
    {
        return array_merge([
            'items' => [
                self::makeProductData([
                    'fields' => [self::makeProductFieldData()],
                ]),
            ],
            'hasNext' => false,
        ], $overrides);
    }

    /**
     * Response data for GET /services/{id} (single product, no fields).
     *
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    public static function makeProductGetData(array $overrides = []): array
    {
        return self::makeProductData($overrides);
    }

    /**
     * A single stock-item array.
     *
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    public static function makeStockItemData(array $overrides = []): array
    {
        return array_merge([
            'itemId' => 'item-001',
            'stock' => 150,
        ], $overrides);
    }

    /**
     * Response data for GET /services/{id}/stock.
     *
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    public static function makeProductStockData(array $overrides = []): array
    {
        return array_merge([
            'productId' => 'prod-001',
            'items' => [
                self::makeStockItemData(),
                self::makeStockItemData(['itemId' => 'item-002', 'stock' => null]),
            ],
        ], $overrides);
    }
}
