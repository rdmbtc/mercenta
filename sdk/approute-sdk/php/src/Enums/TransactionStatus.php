<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Enums;

enum TransactionStatus: string
{
    case IN_PROGRESS = 'in_progress';
    case COMPLETED = 'completed';
    case PARTIALLY_COMPLETED = 'partially_completed';
    case CANCELLED = 'cancelled';
}
