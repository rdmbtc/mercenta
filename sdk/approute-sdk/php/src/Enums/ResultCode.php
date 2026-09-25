<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Enums;

enum ResultCode: string
{
    case OK = 'OK';
    case ACCEPTED = 'ACCEPTED';
    case IDEMPOTENCY_REPLAY = 'IDEMPOTENCY_REPLAY';
    case VALIDATION_ERROR = 'VALIDATION_ERROR';
    case UNAUTHORIZED = 'UNAUTHORIZED';
    case FORBIDDEN = 'FORBIDDEN';
    case NOT_FOUND = 'NOT_FOUND';
    case CONFLICT = 'CONFLICT';
    case LIMIT_REACHED = 'LIMIT_REACHED';
    case OUT_OF_STOCK = 'OUT_OF_STOCK';
    case INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS';
    case UPSTREAM_ERROR = 'UPSTREAM_ERROR';
    case INTERNAL_ERROR = 'INTERNAL_ERROR';
}
