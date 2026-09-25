<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Models;

/**
 * One (serviceId, itemId) pair inside a batch lookup request.
 */
final readonly class ItemLookupRequestItem
{
    public function __construct(
        public string $serviceId,
        public string $itemId,
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        return new self(
            serviceId: $data['serviceId'],
            itemId: $data['itemId'],
        );
    }

    /** @return array{serviceId: string, itemId: string} */
    public function toArray(): array
    {
        return [
            'serviceId' => $this->serviceId,
            'itemId'    => $this->itemId,
        ];
    }
}
