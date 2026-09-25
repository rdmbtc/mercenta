<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Models;

final readonly class ProductStockResponse
{
    /** @param ProductStockItem[] $items */
    public function __construct(
        public string $productId,
        public array $items = [],
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        return new self(
            productId: $data['productId'],
            items: array_map(
                fn(array $i) => ProductStockItem::fromArray($i),
                $data['items'] ?? [],
            ),
        );
    }
}
