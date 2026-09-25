<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Models;

final readonly class AccountActivity
{
    public function __construct(
        public string $id,
        public string $currency,
        public float $amount,
        public string $operation,
        public string $createdAt,
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            currency: $data['currency'],
            amount: (float) $data['amount'],
            operation: $data['operation'],
            createdAt: $data['createdAt'],
        );
    }
}
