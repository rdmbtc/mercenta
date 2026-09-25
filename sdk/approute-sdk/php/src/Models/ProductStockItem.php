<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Models;

final readonly class ProductStockItem
{
    public function __construct(
        public string $itemId,
        public ?int $stock = null,
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        return new self(
            itemId: $data['itemId'],
            stock: $data['stock'] ?? null,
        );
    }
}
