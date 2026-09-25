<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Tests\Support;

/**
 * Static helpers for building standard API response envelopes in tests.
 *
 * The AppRoute Public API wraps every response in an envelope:
 *
 *     { "code": "OK", "message": "...", "traceId": "...", "data": { ... } }
 *
 * These builders produce the envelope as an associative array so that tests
 * can set it on {@see MockTransport::setResponse()} or use it with Guzzle
 * mock handlers.
 */
final class EnvelopeHelper
{
    /**
     * Build a successful response envelope.
     *
     * @param mixed  $data    Payload to nest under the "data" key.
     * @param string $traceId Optional trace identifier (defaults to a test value).
     *
     * @return array{code: string, message: string, traceId: string, data: mixed}
     */
    public static function success(mixed $data, string $traceId = 't-ok'): array
    {
        return [
            'code'    => 'OK',
            'message' => 'Success',
            'traceId' => $traceId,
            'data'    => $data,
        ];
    }

    /**
     * Build an error response envelope (no field-level errors).
     *
     * @param string $code    API error code (e.g. "NOT_FOUND", "UNAUTHORIZED").
     * @param string $message Human-readable error description.
     * @param string $traceId Optional trace identifier.
     *
     * @return array{code: string, message: string, traceId: string, data: null, errors: array{}}
     */
    public static function error(string $code, string $message, string $traceId = 't-err'): array
    {
        return [
            'code'    => $code,
            'message' => $message,
            'traceId' => $traceId,
            'data'    => null,
            'errors'  => [],
        ];
    }

    /**
     * Build a validation-error envelope that includes field-level errors.
     *
     * @param string                          $message Human-readable summary.
     * @param list<array{field: string, code: string, message: string}> $errors  Per-field errors.
     * @param string                          $traceId Optional trace identifier.
     *
     * @return array{code: string, message: string, traceId: string, data: null, errors: list<array{field: string, code: string, message: string}>}
     */
    public static function validationError(string $message, array $errors, string $traceId = 't-err'): array
    {
        return [
            'code'    => 'VALIDATION_ERROR',
            'message' => $message,
            'traceId' => $traceId,
            'data'    => null,
            'errors'  => $errors,
        ];
    }
}
