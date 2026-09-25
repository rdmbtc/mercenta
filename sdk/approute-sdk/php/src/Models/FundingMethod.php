<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Models;

final readonly class FundingMethod
{
    public function __construct(
        public string $code,
        public string $name,
        public float $minAmount,
        public float $commission,
        public string $address,
        public int $ttlMinutes,
        public int $confirmationsRequired,
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        return new self(
            code: $data['code'],
            name: $data['name'],
            minAmount: (float) $data['minAmount'],
            commission: (float) $data['commission'],
            address: $data['address'],
            ttlMinutes: (int) $data['ttlMinutes'],
            confirmationsRequired: (int) $data['confirmationsRequired'],
        );
    }
}
