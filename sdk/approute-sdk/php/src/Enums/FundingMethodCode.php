<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Enums;

enum FundingMethodCode: string
{
    case USDT_TRC20 = 'USDT_TRC20';
    case USDT_BEP20 = 'USDT_BEP20';
    case USDT_TON = 'USDT_TON';
    case USDT_BYBIT = 'USDT_BYBIT';
}
