<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Models;

final readonly class ProductField
{
    /**
     * @param ProductFieldOption[]|null $options
     */
    public function __construct(
        public string $key,
        public string $type,
        public bool $required,
        public ?string $label = null,
        public ?array $options = null,
        public ?ProductFieldValidation $validation = null,
    ) {}

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        $options = isset($data['options'])
            ? array_map(fn(array $o) => ProductFieldOption::fromArray($o), $data['options'])
            : null;

        $validation = isset($data['validation'])
            ? ProductFieldValidation::fromArray($data['validation'])
            : null;

        return new self(
            key: $data['key'],
            type: $data['type'],
            required: (bool) $data['required'],
            label: $data['label'] ?? null,
            options: $options,
            validation: $validation,
        );
    }
}
