<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Tests;

use AppRoute\Sdk\Tests\Support\EnvelopeHelper;
use AppRoute\Sdk\Tests\Support\MockTransport;
use PHPUnit\Framework\TestCase as BaseTestCase;

/**
 * Base test case for all resource-level tests.
 *
 * Provides a pre-configured {@see MockTransport} and convenience methods for
 * building standard API response envelopes.
 *
 * Tests that do NOT need MockTransport (e.g. pure model or exception tests)
 * may continue to extend {@see BaseTestCase} directly.
 */
abstract class TestCase extends BaseTestCase
{
    protected MockTransport $transport;

    protected function setUp(): void
    {
        parent::setUp();

        $this->transport = new MockTransport();
    }

    // ------------------------------------------------------------------ //
    //  Envelope helpers — thin delegates to EnvelopeHelper
    // ------------------------------------------------------------------ //

    /**
     * Build a successful API response envelope.
     *
     * @param mixed  $data    Payload for the "data" key.
     * @param string $traceId Optional trace identifier.
     *
     * @return array{code: string, message: string, traceId: string, data: mixed}
     */
    protected function successEnvelope(mixed $data, string $traceId = 't-ok'): array
    {
        return EnvelopeHelper::success($data, $traceId);
    }

    /**
     * Build a generic error envelope (no field-level errors).
     *
     * @param string $code    API error code (e.g. "NOT_FOUND").
     * @param string $message Human-readable error description.
     * @param string $traceId Optional trace identifier.
     *
     * @return array{code: string, message: string, traceId: string, data: null, errors: array{}}
     */
    protected function errorEnvelope(string $code, string $message, string $traceId = 't-err'): array
    {
        return EnvelopeHelper::error($code, $message, $traceId);
    }

    /**
     * Build a validation-error envelope with per-field errors.
     *
     * @param string                          $message Human-readable summary.
     * @param list<array{field: string, code: string, message: string}> $errors  Per-field errors.
     * @param string                          $traceId Optional trace identifier.
     *
     * @return array{code: string, message: string, traceId: string, data: null, errors: list<array{field: string, code: string, message: string}>}
     */
    protected function validationErrorEnvelope(string $message, array $errors, string $traceId = 't-err'): array
    {
        return EnvelopeHelper::validationError($message, $errors, $traceId);
    }
}
