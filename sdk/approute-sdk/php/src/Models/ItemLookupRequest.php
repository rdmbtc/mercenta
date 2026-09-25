<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Models;

/**
 * Request body for POST /services/items/lookup.
 *
 * Wraps a list of {@see ItemLookupRequestItem}. The list must contain
 * between 1 and 100 entries; callers should rely on
 * {@see \AppRoute\Sdk\Resources\ServicesResource::lookupItems()} which
 * enforces those bounds client-side before any HTTP call is made.
 */
final readonly class ItemLookupRequest
{
    /** @param ItemLookupRequestItem[] $items */
    public function __construct(public array $items) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        $items = array_map(
            fn(array $i) => ItemLookupRequestItem::fromArray($i),
            $data['items'] ?? [],
        );
        return new self(items: $items);
    }

    /** @return array{items: list<array{serviceId: string, itemId: string}>} */
    public function toArray(): array
    {
        return [
            'items' => array_map(
                fn(ItemLookupRequestItem $i) => $i->toArray(),
                $this->items,
            ),
        ];
    }
}
