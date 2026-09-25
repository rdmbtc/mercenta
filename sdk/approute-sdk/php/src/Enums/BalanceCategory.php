<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Enums;

enum BalanceCategory: string
{
    case FUNDING = 'funding';
    case REFUND = 'refund';
    case WITHDRAW = 'withdraw';
    case SHOP = 'shop';
    case DIRECT_TOP_UP = 'direct-top-up';
}
