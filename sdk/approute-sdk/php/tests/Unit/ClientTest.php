<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Tests\Unit;

use AppRoute\Sdk\AppRouteClient;
use AppRoute\Sdk\Resources\AccountsResource;
use AppRoute\Sdk\Resources\FundsResource;
use AppRoute\Sdk\Resources\OrdersResource;
use AppRoute\Sdk\Resources\ServicesResource;
use AppRoute\Sdk\Resources\SteamCurrencyResource;
use PHPUnit\Framework\TestCase;

final class ClientTest extends TestCase
{
    private AppRouteClient $client;

    protected function setUp(): void
    {
        $this->client = new AppRouteClient('test-api-key');
    }

    public function testServicesPropertyIsServicesResource(): void
    {
        $this->assertInstanceOf(ServicesResource::class, $this->client->services);
    }

    public function testOrdersPropertyIsOrdersResource(): void
    {
        $this->assertInstanceOf(OrdersResource::class, $this->client->orders);
    }

    public function testAccountsPropertyIsAccountsResource(): void
    {
        $this->assertInstanceOf(AccountsResource::class, $this->client->accounts);
    }

    public function testFundsPropertyIsFundsResource(): void
    {
        $this->assertInstanceOf(FundsResource::class, $this->client->funds);
    }

    public function testSteamCurrencyPropertyIsSteamCurrencyResource(): void
    {
        $this->assertInstanceOf(SteamCurrencyResource::class, $this->client->steamCurrency);
    }

    public function testAcceptsCustomBaseUrl(): void
    {
        $client = new AppRouteClient('key', 'https://custom.api.io/v1');
        $this->assertInstanceOf(ServicesResource::class, $client->services);
    }

    public function testAcceptsCustomTimeout(): void
    {
        $client = new AppRouteClient('key', timeout: 60.0);
        $this->assertInstanceOf(ServicesResource::class, $client->services);
    }
}
