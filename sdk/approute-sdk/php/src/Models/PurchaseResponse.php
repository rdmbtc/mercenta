<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Models;

final readonly class PurchaseResponse
{
    public function __construct(
        public string $status,
        public float $price,
        public string $currency,
        public ?string $transactionUUID = null,
        public ?string $orderId = null,
        public ?PurchaseResult $result = null,
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        $result = isset($data['result'])
            ? PurchaseResult::fromArray($data['result'])
            : null;

        return new self(
            status: $data['status'],
            price: (float) $data['price'],
            currency: $data['currency'],
            transactionUUID: $data['transactionUUID'] ?? $data['transactionUuid'] ?? null,
            orderId: $data['orderId'] ?? null,
            result: $result,
        );
    }
}
