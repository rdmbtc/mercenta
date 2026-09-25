<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Models;

final readonly class PurchaseResult
{
    /**
     * @param Voucher[]|null $vouchers
     * @param array<string, string>|null $attributes
     */
    public function __construct(
        public ?array $vouchers = null,
        public ?Esim $esim = null,
        public ?array $attributes = null,
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        $vouchers = isset($data['vouchers'])
            ? array_map(fn(array $v) => Voucher::fromArray($v), $data['vouchers'])
            : null;

        $esim = isset($data['esim']) ? Esim::fromArray($data['esim']) : null;

        return new self(
            vouchers: $vouchers,
            esim: $esim,
            attributes: $data['attributes'] ?? null,
        );
    }
}
