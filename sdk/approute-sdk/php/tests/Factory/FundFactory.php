<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Tests\Factory;

final class FundFactory
{
    /**
     * A single funding-method array.
     *
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    public static function makeMethodData(array $overrides = []): array
    {
        return array_merge([
            'code' => 'USDT_TRC20',
            'name' => 'USDT (TRC-20)',
            'minAmount' => 10.0,
            'commission' => 0.0,
            'address' => 'TXyz123abc',
            'ttlMinutes' => 60,
            'confirmationsRequired' => 20,
        ], $overrides);
    }

    /**
     * Response data for GET /funds/methods.
     *
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    public static function makeMethodsListData(array $overrides = []): array
    {
        return array_merge([
            'items' => [self::makeMethodData()],
        ], $overrides);
    }

    /**
     * A single funding-invoice array.
     *
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    public static function makeInvoiceData(array $overrides = []): array
    {
        return array_merge([
            'id' => 'inv-001',
            'methodCode' => 'USDT_TRC20',
            'amountExpected' => 100.0,
            'commission' => 0.0,
            'credited' => 0.0,
            'memoTag' => null,
            'address' => 'TXyz123abc',
            'txHash' => null,
            'status' => 'pending',
            'confirmationsRequired' => 20,
            'confirmations' => 0,
            'createdAt' => '2026-03-01T12:00:00Z',
            'expiresAt' => '2026-03-01T13:00:00Z',
            'direction' => 'incoming',
        ], $overrides);
    }

    /**
     * Response data for GET /funds/invoices (invoice list).
     *
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    public static function makeInvoiceListData(array $overrides = []): array
    {
        return array_merge([
            'items' => [self::makeInvoiceData()],
            'total' => 1,
        ], $overrides);
    }

    /**
     * Response data for GET /funds/invoices/{id}/time-left.
     *
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    public static function makeTimeLeftData(array $overrides = []): array
    {
        return array_merge([
            'invoiceId' => 'inv-001',
            'expiresAt' => '2026-03-01T13:00:00Z',
            'secondsLeft' => 3200,
            'expired' => false,
        ], $overrides);
    }

    /**
     * Response data for GET /funds/ton-deposit.
     *
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    public static function makeTonDepositData(array $overrides = []): array
    {
        return array_merge([
            'address' => 'EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF78p7Av',
            'memoTag' => '123456',
        ], $overrides);
    }

    /**
     * Response data for GET /funds/bybit.
     *
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    public static function makeBybitStateData(array $overrides = []): array
    {
        return array_merge([
            'recipientUid' => 'bybit-uid-001',
            'linked' => true,
            'yourUid' => 'bybit-uid-002',
        ], $overrides);
    }
}
