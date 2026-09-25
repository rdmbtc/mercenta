<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Models;

final readonly class Product
{
    /**
     * @param ProductItem[] $items
     * @param ProductField[]|null $fields
     */
    public function __construct(
        public string $id,
        public ?string $name,
        public string $type,
        public ?string $imageUrl = null,
        public ?string $countryCode = null,
        public ?string $categoryName = null,
        public ?string $subcategoryName = null,
        public array $items = [],
        public ?array $fields = null,
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        $items = array_map(fn(array $i) => ProductItem::fromArray($i), $data['items'] ?? []);
        $fields = isset($data['fields'])
            ? array_map(fn(array $f) => ProductField::fromArray($f), $data['fields'])
            : null;
        return new self(
            id: $data['id'],
            name: $data['name'] ?? null,
            type: $data['type'],
            imageUrl: $data['imageUrl'] ?? null,
            countryCode: $data['countryCode'] ?? null,
            categoryName: $data['categoryName'] ?? null,
            subcategoryName: $data['subcategoryName'] ?? null,
            items: $items,
            fields: $fields,
        );
    }
}
