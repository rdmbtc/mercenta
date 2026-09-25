<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Models;

final readonly class Esim
{
    public function __construct(
        public string $matchingId,
        public string $qrCodeText,
        public string $smdpAddress,
        public ?string $iccid = null,
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        return new self(
            matchingId: $data['matchingId'],
            qrCodeText: $data['qrCodeText'],
            smdpAddress: $data['smdpAddress'],
            iccid: $data['iccid'] ?? null,
        );
    }
}
