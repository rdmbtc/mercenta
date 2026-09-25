<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Tests\Factory;

final class OrderFactory
{
    /**
     * A single voucher array.
     *
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    public static function makeVoucherData(array $overrides = []): array
    {
        return array_merge([
            'pin' => 'XXXX-YYYY-ZZZZ',
            'serialNumber' => 'SN-12345',
            'expiration' => '2027-12-31T23:59:59Z',
        ], $overrides);
    }

    /**
     * Purchase-result sub-object.
     *
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    public static function makePurchaseResultData(array $overrides = []): array
    {
        return array_merge([
            'vouchers' => [self::makeVoucherData()],
            'esim' => null,
            'attributes' => null,
        ], $overrides);
    }

    /**
     * Response data for POST /orders (create order / purchase).
     *
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    public static function makePurchaseData(array $overrides = []): array
    {
        return array_merge([
            'transactionUUID' => 'txn-abc-123',
            'orderId' => 'ord-456',
            'status' => 'completed',
            'price' => 48.5,
            'currency' => 'USD',
            'result' => self::makePurchaseResultData(),
        ], $overrides);
    }

    /**
     * Response data for POST /orders (DTU check).
     *
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    public static function makeDtuCheckData(array $overrides = []): array
    {
        return array_merge([
            'canRecharge' => true,
            'price' => 10.0,
            'currency' => 'USD',
            'providerStatus' => 'available',
            'providerMessage' => null,
            'attributes' => ['operatorName' => 'T-Mobile'],
        ], $overrides);
    }

    /**
     * A single transaction-list-item array.
     *
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    public static function makeTransactionListItemData(array $overrides = []): array
    {
        return array_merge([
            'transactionUUID' => 'txn-abc-123',
            'orderId' => 'ord-456',
            'reference' => 'ref-001',
            'serverTime' => '2026-03-01T12:00:00Z',
            'clientTime' => null,
            'status' => 'completed',
            'productId' => 'prod-001',
            'itemId' => 'item-001',
            'productName' => 'Steam Wallet 50 USD',
            'itemName' => '50 USD',
            'quantity' => 1,
            'amount' => 48.5,
            'currency' => 'USD',
            'accountNumber' => null,
            'vouchers' => null,
        ], $overrides);
    }

    /**
     * Response data for GET /orders (order list).
     *
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    public static function makeOrderListData(array $overrides = []): array
    {
        return array_merge([
            'page' => [
                'items' => [self::makeTransactionListItemData()],
                'hasNext' => false,
            ],
        ], $overrides);
    }
}
