<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Tests\Unit\Resources;

use AppRoute\Sdk\Models\SteamCurrencyRate;
use AppRoute\Sdk\Resources\SteamCurrencyResource;
use AppRoute\Sdk\Tests\Factory\SteamCurrencyFactory;
use AppRoute\Sdk\Tests\TestCase;

final class SteamCurrencyResourceTest extends TestCase
{
    private SteamCurrencyResource $resource;

    protected function setUp(): void
    {
        parent::setUp();
        $this->resource = new SteamCurrencyResource($this->transport);
    }

    // --- rates() ---

    public function testRatesReturnsStructuredResult(): void
    {
        $this->transport->setResponse(SteamCurrencyFactory::makeRatesData());

        $result = $this->resource->rates();

        $this->assertArrayHasKey('baseCurrencyCode', $result);
        $this->assertSame('USD', $result['baseCurrencyCode']);
        $this->assertArrayHasKey('items', $result);
        $this->assertCount(2, $result['items']);
    }

    public function testRatesItemsAreTyped(): void
    {
        $this->transport->setResponse(SteamCurrencyFactory::makeRatesData());

        $result = $this->resource->rates();

        $this->assertInstanceOf(SteamCurrencyRate::class, $result['items'][0]);
        $this->assertSame('RUB', $result['items'][0]->quoteCurrencyCode);
        $this->assertSame('92.50', $result['items'][0]->rate);
    }

    public function testRatesCallsCorrectEndpoint(): void
    {
        $this->transport->setResponse(SteamCurrencyFactory::makeRatesData());

        $this->resource->rates();

        $call = $this->transport->lastCall();
        $this->assertSame('GET', $call['method']);
        $this->assertSame('/steam-currency/rates', $call['path']);
    }

    public function testRatesPassesQuotesParam(): void
    {
        $this->transport->setResponse(SteamCurrencyFactory::makeRatesData());

        $this->resource->rates(['RUB', 'EUR']);

        $call = $this->transport->lastCall();
        $this->assertSame(['quotes' => ['RUB', 'EUR']], $call['params']);
    }

    public function testRatesWithNoQuotesSendsNoParams(): void
    {
        $this->transport->setResponse(SteamCurrencyFactory::makeRatesData());

        $this->resource->rates();

        $call = $this->transport->lastCall();
        $this->assertNull($call['params']);
    }

    public function testRatesNullableFields(): void
    {
        $this->transport->setResponse(SteamCurrencyFactory::makeRatesData());

        $result = $this->resource->rates();
        $eurRate = $result['items'][1];

        $this->assertSame('EUR', $eurRate->quoteCurrencyCode);
        $this->assertNull($eurRate->providerCreatedAt);
        $this->assertNull($eurRate->fetchedAt);
    }
}
