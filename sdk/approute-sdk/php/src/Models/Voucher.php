<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Models;

final readonly class Voucher
{
    public function __construct(
        public string $pin,
        public ?string $serialNumber = null,
        public ?string $expiration = null,
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        return new self(
            pin: $data['pin'],
            serialNumber: $data['serialNumber'] ?? null,
            expiration: $data['expiration'] ?? null,
        );
    }
}
