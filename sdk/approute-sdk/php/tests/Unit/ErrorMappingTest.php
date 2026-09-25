<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Tests\Unit;

use AppRoute\Sdk\Exceptions\ApiException;
use AppRoute\Sdk\Exceptions\ConflictException;
use AppRoute\Sdk\Exceptions\ForbiddenException;
use AppRoute\Sdk\Exceptions\InsufficientFundsException;
use AppRoute\Sdk\Exceptions\InternalException;
use AppRoute\Sdk\Exceptions\NotFoundException;
use AppRoute\Sdk\Exceptions\OutOfStockException;
use AppRoute\Sdk\Exceptions\RateLimitedException;
use AppRoute\Sdk\Exceptions\UnauthorizedException;
use AppRoute\Sdk\Exceptions\UpstreamException;
use AppRoute\Sdk\Exceptions\ValidationException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class ErrorMappingTest extends TestCase
{
    /**
     * @return array<string, array{string, class-string<ApiException>}>
     */
    public static function errorCodeProvider(): array
    {
        return [
            'VALIDATION_ERROR' => ['VALIDATION_ERROR', ValidationException::class],
            'UNAUTHORIZED' => ['UNAUTHORIZED', UnauthorizedException::class],
            'FORBIDDEN' => ['FORBIDDEN', ForbiddenException::class],
            'NOT_FOUND' => ['NOT_FOUND', NotFoundException::class],
            'CONFLICT' => ['CONFLICT', ConflictException::class],
            'LIMIT_REACHED' => ['LIMIT_REACHED', RateLimitedException::class],
            'OUT_OF_STOCK' => ['OUT_OF_STOCK', OutOfStockException::class],
            'INSUFFICIENT_FUNDS' => ['INSUFFICIENT_FUNDS', InsufficientFundsException::class],
            'UPSTREAM_ERROR' => ['UPSTREAM_ERROR', UpstreamException::class],
            'INTERNAL_ERROR' => ['INTERNAL_ERROR', InternalException::class],
        ];
    }

    #[DataProvider('errorCodeProvider')]
    public function testErrorCodeMapsToCorrectException(string $code, string $expectedClass): void
    {
        $exception = ApiException::fromCode($code, 'Test message', 'trace-123', 400);
        $this->assertInstanceOf($expectedClass, $exception);
        $this->assertSame($code, $exception->errorCode);
        $this->assertSame('trace-123', $exception->traceId);
    }

    public function testUnknownCodeReturnBaseApiException(): void
    {
        $exception = ApiException::fromCode('UNKNOWN_CODE', 'Unknown', 'trace-000', 500);
        $this->assertInstanceOf(ApiException::class, $exception);
        $this->assertSame('UNKNOWN_CODE', $exception->errorCode);
    }

    public function testErrorsArePreserved(): void
    {
        $errors = [
            ['field' => 'email', 'code' => 'INVALID_FORMAT', 'message' => 'Bad email'],
            ['field' => 'quantity', 'code' => 'OUT_OF_RANGE', 'message' => 'Too large'],
        ];

        $exception = ApiException::fromCode('VALIDATION_ERROR', 'Validation failed', 'trace-v', 422, $errors);
        $this->assertInstanceOf(ValidationException::class, $exception);
        $this->assertCount(2, $exception->errors);
        $this->assertSame('email', $exception->errors[0]['field']);
        $this->assertSame('OUT_OF_RANGE', $exception->errors[1]['code']);
    }

    public function testExceptionMessageFormat(): void
    {
        $exception = ApiException::fromCode('NOT_FOUND', 'Product not found', 'trace-nf', 404);
        $this->assertStringContainsString('[NOT_FOUND]', $exception->getMessage());
        $this->assertStringContainsString('Product not found', $exception->getMessage());
        $this->assertStringContainsString('trace-nf', $exception->getMessage());
    }
}
