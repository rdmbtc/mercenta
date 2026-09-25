<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Enums;

enum FieldErrorCode: string
{
    case MISSING = 'MISSING';
    case OUT_OF_RANGE = 'OUT_OF_RANGE';
    case INVALID_FORMAT = 'INVALID_FORMAT';
    case INVALID_VALUE = 'INVALID_VALUE';
    case NOT_ALLOWED = 'NOT_ALLOWED';
    case TOO_LONG = 'TOO_LONG';
    case TOO_SHORT = 'TOO_SHORT';
}
