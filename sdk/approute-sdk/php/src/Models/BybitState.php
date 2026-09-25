<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Models;

final readonly class BybitState
{
    public function __construct(
        public string $recipientUid,
        public bool $linked,
        public ?string $yourUid = null,
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        return new self(
            recipientUid: $data['recipientUid'],
            linked: (bool) $data['linked'],
            yourUid: $data['yourUid'] ?? null,
        );
    }
}
