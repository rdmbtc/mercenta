<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Models;

final readonly class DtuCheckResponse
{
    /** @param array<string, string>|null $attributes */
    public function __construct(
        public ?bool $canRecharge = null,
        public ?float $price = null,
        public ?string $currency = null,
        public ?string $providerStatus = null,
        public ?string $providerMessage = null,
        public ?array $attributes = null,
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        return new self(
            canRecharge: $data['canRecharge'] ?? null,
            price: isset($data['price']) ? (float) $data['price'] : null,
            currency: $data['currency'] ?? null,
            providerStatus: $data['providerStatus'] ?? null,
            providerMessage: $data['providerMessage'] ?? null,
            attributes: $data['attributes'] ?? null,
        );
    }
}
