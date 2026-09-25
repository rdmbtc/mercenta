<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Models;

final readonly class TransactionListItem
{
    /** @param Voucher[]|null $vouchers */
    public function __construct(
        public string $status,
        public int $quantity = 1,
        public ?string $transactionUUID = null,
        public ?string $orderId = null,
        public ?string $reference = null,
        public ?string $serverTime = null,
        public ?string $clientTime = null,
        public ?string $productId = null,
        public ?string $itemId = null,
        public ?string $productName = null,
        public ?string $itemName = null,
        public ?float $amount = null,
        public ?string $currency = null,
        public ?string $accountNumber = null,
        public ?array $vouchers = null,
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        $vouchers = isset($data['vouchers'])
            ? array_map(fn(array $v) => Voucher::fromArray($v), $data['vouchers'])
            : null;

        return new self(
            status: $data['status'],
            quantity: (int) ($data['quantity'] ?? 1),
            transactionUUID: $data['transactionUUID'] ?? $data['transactionUuid'] ?? null,
            orderId: $data['orderId'] ?? null,
            reference: $data['reference'] ?? null,
            serverTime: $data['serverTime'] ?? null,
            clientTime: $data['clientTime'] ?? null,
            productId: $data['productId'] ?? null,
            itemId: $data['itemId'] ?? null,
            productName: $data['productName'] ?? null,
            itemName: $data['itemName'] ?? null,
            amount: isset($data['amount']) ? (float) $data['amount'] : null,
            currency: $data['currency'] ?? null,
            accountNumber: $data['accountNumber'] ?? null,
            vouchers: $vouchers,
        );
    }
}
