<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Models;

final readonly class TonDepositState
{
    public function __construct(
        public string $address,
        public string $memoTag,
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        return new self(
            address: $data['address'],
            memoTag: $data['memoTag'],
        );
    }
}
