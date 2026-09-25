<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Tests\Support;

use AppRoute\Sdk\Contracts\TransportInterface;

/**
 * In-memory transport double that records every call and returns a preset response.
 *
 * Typical usage inside a test:
 *
 *     $transport = new MockTransport();
 *     $transport->setResponse(['id' => 'prod-001']);
 *     $resource  = new SomeResource($transport);
 *     $resource->doSomething();
 *     self::assertSame('GET', $transport->lastCall()['method']);
 */
class MockTransport implements TransportInterface
{
    /** @var list<array{method: string, path: string, params: ?array, body: ?array}> */
    private array $calls = [];

    /** @var array<string, mixed>|null */
    private ?array $response = null;

    /**
     * Set the canned response that will be returned by every subsequent {@see request()} call.
     *
     * @param array<string, mixed>|null $response
     */
    public function setResponse(?array $response): void
    {
        $this->response = $response;
    }

    /** {@inheritDoc} */
    public function request(string $method, string $path, ?array $params = null, ?array $body = null): ?array
    {
        $this->calls[] = [
            'method' => $method,
            'path'   => $path,
            'params' => $params,
            'body'   => $body,
        ];

        return $this->response;
    }

    // ------------------------------------------------------------------ //
    //  Introspection helpers
    // ------------------------------------------------------------------ //

    /**
     * Return every recorded call.
     *
     * @return list<array{method: string, path: string, params: ?array, body: ?array}>
     */
    public function calls(): array
    {
        return $this->calls;
    }

    /**
     * Return the most recent recorded call, or {@see null} if none.
     *
     * @return array{method: string, path: string, params: ?array, body: ?array}|null
     */
    public function lastCall(): ?array
    {
        return $this->calls !== [] ? $this->calls[array_key_last($this->calls)] : null;
    }

    /**
     * Return the total number of recorded calls.
     */
    public function callCount(): int
    {
        return count($this->calls);
    }

    /**
     * Clear all recorded calls and reset the canned response.
     */
    public function reset(): void
    {
        $this->calls    = [];
        $this->response = null;
    }
}
