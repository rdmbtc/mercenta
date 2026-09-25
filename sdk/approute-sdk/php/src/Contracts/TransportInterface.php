<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Contracts;

interface TransportInterface
{
    /**
     * Send an HTTP request to the API.
     *
     * @param array<string, mixed>|null $params Query parameters
     * @param array<string, mixed>|null $body   JSON body
     * @return array<string, mixed>|null
     */
    public function request(string $method, string $path, ?array $params = null, ?array $body = null): ?array;
}
