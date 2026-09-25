<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Models;

final readonly class FundingInvoice
{
    public function __construct(
        public string $id,
        public string $methodCode,
        public float $amountExpected,
        public float $commission,
        public float $credited,
        public string $address,
        public string $status,
        public string $createdAt,
        public string $expiresAt,
        public string $direction = 'incoming',
        public ?string $memoTag = null,
        public ?string $txHash = null,
        public ?int $confirmationsRequired = null,
        public ?int $confirmations = null,
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            methodCode: $data['methodCode'],
            amountExpected: (float) $data['amountExpected'],
            commission: (float) $data['commission'],
            credited: (float) $data['credited'],
            address: $data['address'],
            status: $data['status'],
            createdAt: $data['createdAt'],
            expiresAt: $data['expiresAt'],
            direction: $data['direction'] ?? 'incoming',
            memoTag: $data['memoTag'] ?? null,
            txHash: $data['txHash'] ?? null,
            confirmationsRequired: $data['confirmationsRequired'] ?? null,
            confirmations: $data['confirmations'] ?? null,
        );
    }
}
