<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Exceptions;

class ApiException extends AppRouteException
{
    /** @param array<array{field: string, code: string, message: string}> $errors */
    public function __construct(
        public readonly string $errorCode,
        string $message,
        public readonly string $traceId,
        public readonly int $statusCode,
        public readonly array $errors = [],
    ) {
        $msg = "[{$errorCode}] {$message} (trace_id={$traceId})";
        foreach ($errors as $err) {
            $msg .= "\n  - {$err['field']}: {$err['code']} — {$err['message']}";
        }
        parent::__construct($msg, $statusCode);
    }

    /** @param array<array{field: string, code: string, message: string}> $errors */
    public static function fromCode(
        string $code,
        string $message,
        string $traceId,
        int $statusCode,
        array $errors = [],
    ): self {
        $class = match ($code) {
            'VALIDATION_ERROR' => ValidationException::class,
            'UNAUTHORIZED' => UnauthorizedException::class,
            'FORBIDDEN' => ForbiddenException::class,
            'NOT_FOUND' => NotFoundException::class,
            'CONFLICT' => ConflictException::class,
            'LIMIT_REACHED' => RateLimitedException::class,
            'OUT_OF_STOCK' => OutOfStockException::class,
            'INSUFFICIENT_FUNDS' => InsufficientFundsException::class,
            'UPSTREAM_ERROR' => UpstreamException::class,
            'INTERNAL_ERROR' => InternalException::class,
            default => self::class,
        };

        return new $class($code, $message, $traceId, $statusCode, $errors);
    }
}
