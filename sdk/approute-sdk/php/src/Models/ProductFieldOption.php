<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Models;

final readonly class ProductFieldOption
{
    public function __construct(
        public string $label,
        public string $value,
        public ?float $price = null,
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        return new self(
            label: $data['label'],
            value: $data['value'],
            price: isset($data['price']) ? (float) $data['price'] : null,
        );
    }
}
