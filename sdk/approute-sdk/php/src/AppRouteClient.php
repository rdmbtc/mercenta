<?php

declare(strict_types=1);

namespace AppRoute\Sdk;

use AppRoute\Sdk\Http\HttpTransport;
use AppRoute\Sdk\Resources\AccountsResource;
use AppRoute\Sdk\Resources\FundsResource;
use AppRoute\Sdk\Resources\OrdersResource;
use AppRoute\Sdk\Resources\ServicesResource;
use AppRoute\Sdk\Resources\SteamCurrencyResource;

class AppRouteClient
{
    private const DEFAULT_BASE_URL = 'https://approute.io/api/v1';

    public readonly ServicesResource $services;
    public readonly OrdersResource $orders;
    public readonly AccountsResource $accounts;
    public readonly FundsResource $funds;
    public readonly SteamCurrencyResource $steamCurrency;

    public function __construct(
        string $apiKey,
        string $baseUrl = self::DEFAULT_BASE_URL,
        float $timeout = 30.0,
        int $maxRetries = 3,
    ) {
        $transport = new HttpTransport($baseUrl, $apiKey, $timeout, $maxRetries);

        $this->services = new ServicesResource($transport);
        $this->orders = new OrdersResource($transport);
        $this->accounts = new AccountsResource($transport);
        $this->funds = new FundsResource($transport);
        $this->steamCurrency = new SteamCurrencyResource($transport);
    }
}
