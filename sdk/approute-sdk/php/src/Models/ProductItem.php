<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Models;

final readonly class ProductItem
{
    public function __construct(
        public string $id,
        public ?string $name = null,
        public ?float $nominal = null,
        public float $price = 0.0,
        public string $currency = 'USDT',
        public ?bool $available = null,
        public ?int $stock = null,
        public ?bool $isLongOrder = null,
        public ?int $minQtyToLongOrder = null,
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            name: $data['name'] ?? null,
            nominal: isset($data['nominal']) ? (float) $data['nominal'] : null,
            price: (float) ($data['price'] ?? 0),
            currency: $data['currency'] ?? 'USDT',
            available: $data['available'] ?? null,
            stock: $data['stock'] ?? null,
            isLongOrder: $data['isLongOrder'] ?? null,
            minQtyToLongOrder: $data['minQtyToLongOrder'] ?? null,
        );
    }
}
