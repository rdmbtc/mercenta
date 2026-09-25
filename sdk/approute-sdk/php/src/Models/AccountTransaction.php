<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Models;

final readonly class AccountTransaction
{
    public function __construct(
        public string $id,
        public string $currency,
        public string $transactionId,
        public string $category,
        public float $balance,
        public float $amount,
        public string $orderId,
        public ?string $orderIdRaw = null,
        public ?string $description = null,
        public ?string $createdAt = null,
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            currency: $data['currency'],
            transactionId: $data['transactionId'],
            category: $data['category'],
            balance: (float) $data['balance'],
            amount: (float) $data['amount'],
            orderId: $data['orderId'],
            orderIdRaw: $data['orderIdRaw'] ?? null,
            description: $data['description'] ?? null,
            createdAt: $data['createdAt'] ?? null,
        );
    }
}
