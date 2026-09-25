<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Enums;

enum ProductType: string
{
    case VOUCHER = 'voucher';
    case DIRECT_TOPUP = 'direct_topup';
}
