<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Models;

final readonly class ProductFieldValidation
{
    public function __construct(
        public ?float $min = null,
        public ?float $max = null,
        public ?string $pattern = null,
        public ?string $message = null,
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        return new self(
            min: isset($data['min']) ? (float) $data['min'] : null,
            max: isset($data['max']) ? (float) $data['max'] : null,
            pattern: $data['pattern'] ?? null,
            message: $data['message'] ?? null,
        );
    }
}
