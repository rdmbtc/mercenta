<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Models;

/**
 * One row in the batch-lookup response. Always present per input pair,
 * in the same order as the request.
 *
 * - When the pair was resolved successfully, {@see $found} is `true`,
 *   {@see $item} holds the {@see ProductItem}, and {@see $error} is `null`.
 * - Otherwise {@see $found} is `false`, {@see $item} is `null`, and
 *   {@see $error} holds a string code such as `"service_not_found"` or
 *   `"item_not_found"`.
 */
final readonly class ItemLookupRow
{
    public function __construct(
        public string $serviceId,
        public string $itemId,
        public bool $found,
        public ?ProductItem $item = null,
        public ?string $error = null,
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        return new self(
            serviceId: $data['serviceId'],
            itemId:    $data['itemId'],
            found:     (bool) $data['found'],
            item:      isset($data['item']) && $data['item'] !== null
                ? ProductItem::fromArray($data['item'])
                : null,
            error:     $data['error'] ?? null,
        );
    }
}
