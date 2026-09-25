<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Models;

final readonly class SteamCurrencyRate
{
    public function __construct(
        public string $quoteCurrencyCode,
        public string $rate,
        public ?string $providerCreatedAt = null,
        public ?string $fetchedAt = null,
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        return new self(
            quoteCurrencyCode: $data['quoteCurrencyCode'],
            rate: (string) $data['rate'],
            providerCreatedAt: $data['providerCreatedAt'] ?? null,
            fetchedAt: $data['fetchedAt'] ?? null,
        );
    }
}
