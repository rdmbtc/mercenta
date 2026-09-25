<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Models;

final readonly class Account
{
    /** @param AccountActivity[] $recentActivity */
    public function __construct(
        public string $currency,
        public float $balance,
        public float $available,
        public float $overdraftLimit,
        public array $recentActivity = [],
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        $activity = array_map(
            fn(array $a) => AccountActivity::fromArray($a),
            $data['recentActivity'] ?? [],
        );
        return new self(
            currency: $data['currency'],
            balance: (float) $data['balance'],
            available: (float) $data['available'],
            overdraftLimit: (float) $data['overdraftLimit'],
            recentActivity: $activity,
        );
    }
}
