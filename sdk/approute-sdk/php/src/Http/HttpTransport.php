<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Http;

use AppRoute\Sdk\Contracts\TransportInterface;
use AppRoute\Sdk\Exceptions\ApiException;
use AppRoute\Sdk\Exceptions\AppRouteException;
use AppRoute\Sdk\Exceptions\NetworkException;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\RequestException;

class HttpTransport implements TransportInterface
{
    private const SUCCESS_CODES = ['OK', 'ACCEPTED', 'IDEMPOTENCY_REPLAY'];
    private const RETRYABLE_STATUS_CODES = [429, 500, 502, 503, 504];
    private const BACKOFF_BASE = 1.0;

    private Client $client;

    public function __construct(
        private readonly string $baseUrl,
        private readonly string $apiKey,
        float $timeout = 30.0,
        private readonly int $maxRetries = 3,
    ) {
        $this->client = new Client([
            'base_uri' => rtrim($baseUrl, '/') . '/',
            'timeout' => $timeout,
            'headers' => [
                'X-API-Key' => $apiKey,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ],
        ]);
    }

    /**
     * @param array<string, mixed>|null $params
     * @param array<string, mixed>|null $body
     * @return array<string, mixed>|null
     */
    public function request(string $method, string $path, ?array $params = null, ?array $body = null): ?array
    {
        $path = ltrim($path, '/');
        $options = [];

        if ($params !== null) {
            $cleaned = $this->cleanParams($params);
            if ($cleaned) {
                $options['query'] = $cleaned;
            }
        }

        if ($body !== null) {
            $options['json'] = $body;
        }

        $lastException = null;

        for ($attempt = 0; $attempt <= $this->maxRetries; $attempt++) {
            try {
                $response = $this->client->request($method, $path, $options);
            } catch (ConnectException $e) {
                throw new NetworkException("Connection error: {$e->getMessage()}", 0, $e);
            } catch (RequestException $e) {
                if ($e->hasResponse()) {
                    $response = $e->getResponse();
                } else {
                    throw new NetworkException("Request error: {$e->getMessage()}", 0, $e);
                }
            }

            $statusCode = $response->getStatusCode();

            if (in_array($statusCode, self::RETRYABLE_STATUS_CODES) && $attempt < $this->maxRetries) {
                $retryAfter = $response->getHeaderLine('Retry-After');
                $delay = $retryAfter !== '' ? (float) $retryAfter : self::BACKOFF_BASE * (2 ** $attempt);
                usleep((int) ($delay * 1_000_000));
                continue;
            }

            return $this->handleResponse($response->getBody()->getContents(), $statusCode);
        }

        throw new AppRouteException('Max retries exceeded');
    }

    /**
     * @return array<string, mixed>|null
     */
    private function handleResponse(string $rawBody, int $statusCode): ?array
    {
        $body = json_decode($rawBody, true);

        if (!is_array($body)) {
            throw new AppRouteException("Invalid JSON response (HTTP {$statusCode})");
        }

        $code = $body['code'] ?? '';
        $message = $body['message'] ?? '';
        $traceId = $body['traceId'] ?? '';

        if (in_array($code, self::SUCCESS_CODES, true)) {
            return $body['data'] ?? null;
        }

        $errors = [];
        foreach ($body['errors'] ?? [] as $err) {
            $errors[] = [
                'field' => $err['field'] ?? '',
                'code' => $err['code'] ?? '',
                'message' => $err['message'] ?? '',
            ];
        }

        throw ApiException::fromCode($code, $message, $traceId, $statusCode, $errors);
    }

    /**
     * @param array<string, mixed> $params
     * @return array<string, mixed>
     */
    private function cleanParams(array $params): array
    {
        $cleaned = [];
        foreach ($params as $key => $value) {
            if ($value === null) {
                continue;
            }
            if (is_bool($value)) {
                $cleaned[$key] = $value ? 'true' : 'false';
            } else {
                $cleaned[$key] = $value;
            }
        }
        return $cleaned;
    }
}
