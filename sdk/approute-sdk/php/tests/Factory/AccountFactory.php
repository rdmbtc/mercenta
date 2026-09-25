<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Tests\Factory;

final class AccountFactory
{
    /**
     * A single account-activity array.
     *
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    public static function makeActivityData(array $overrides = []): array
    {
        return array_merge([
            'id' => 'act-001',
            'currency' => 'USD',
            'amount' => -48.5,
            'operation' => 'purchase',
            'createdAt' => '2026-03-01T12:00:00Z',
        ], $overrides);
    }

    /**
     * A single account (balance) array.
     *
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    public static function makeAccountData(array $overrides = []): array
    {
        return array_merge([
            'currency' => 'USD',
            'balance' => 1250.50,
            'available' => 1200.00,
            'overdraftLimit' => 0.0,
            'recentActivity' => [self::makeActivityData()],
        ], $overrides);
    }

    /**
     * Response data for GET /accounts (balances).
     *
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    public static function makeBalancesData(array $overrides = []): array
    {
        return array_merge([
            'items' => [self::makeAccountData()],
        ], $overrides);
    }

    /**
     * A single transaction array.
     *
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    public static function makeTransactionData(array $overrides = []): array
    {
        return array_merge([
            'id' => 'tx-001',
            'currency' => 'USD',
            'transactionId' => 'txn-abc-123',
            'category' => 'shop',
            'balance' => 1250.50,
            'amount' => -48.5,
            'orderId' => 'ord-456',
            'orderIdRaw' => null,
            'description' => 'Steam Wallet 50 USD',
            'createdAt' => '2026-03-01T12:00:00Z',
        ], $overrides);
    }

    /**
     * Response data for GET /accounts/transactions.
     *
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    public static function makeTransactionsData(array $overrides = []): array
    {
        return array_merge([
            'totalCount' => 1,
            'items' => [self::makeTransactionData()],
        ], $overrides);
    }
}
