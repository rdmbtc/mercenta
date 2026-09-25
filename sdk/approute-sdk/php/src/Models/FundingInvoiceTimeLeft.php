<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Models;

final readonly class FundingInvoiceTimeLeft
{
    public function __construct(
        public string $invoiceId,
        public string $expiresAt,
        public int $secondsLeft,
        public bool $expired,
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        return new self(
            invoiceId: $data['invoiceId'],
            expiresAt: $data['expiresAt'],
            secondsLeft: (int) $data['secondsLeft'],
            expired: (bool) $data['expired'],
        );
    }
}
