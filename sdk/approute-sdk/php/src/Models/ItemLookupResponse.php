<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Models;

/**
 * Response body for POST /services/items/lookup.
 *
 * {@see $items} is in the same order as the request — callers can pair
 * request and response by index without re-keying.
 */
final readonly class ItemLookupResponse
{
    /** @param ItemLookupRow[] $items */
    public function __construct(public array $items) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        $rows = array_map(
            fn(array $r) => ItemLookupRow::fromArray($r),
            $data['items'] ?? [],
        );
        return new self(items: $rows);
    }
}
