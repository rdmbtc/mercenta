<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Enums;

enum FundingStatus: string
{
    case PENDING = 'pending';
    case CONFIRMING = 'confirming';
    case SUCCESS = 'success';
    case FAIL = 'fail';
    case EXPIRED = 'expired';
}
