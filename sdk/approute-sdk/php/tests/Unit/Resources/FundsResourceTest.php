<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Tests\Unit\Resources;

use AppRoute\Sdk\Models\BybitState;
use AppRoute\Sdk\Models\FundingInvoice;
use AppRoute\Sdk\Models\FundingInvoiceTimeLeft;
use AppRoute\Sdk\Models\FundingMethod;
use AppRoute\Sdk\Models\TonDepositState;
use AppRoute\Sdk\Resources\FundsResource;
use AppRoute\Sdk\Tests\Factory\FundFactory;
use AppRoute\Sdk\Tests\TestCase;

final class FundsResourceTest extends TestCase
{
    private FundsResource $resource;

    protected function setUp(): void
    {
        parent::setUp();
        $this->resource = new FundsResource($this->transport);
    }

    // --- methods() ---

    public function testMethodsReturnsFundingMethodArray(): void
    {
        $this->transport->setResponse(FundFactory::makeMethodsListData());

        $result = $this->resource->methods();

        $this->assertCount(1, $result);
        $this->assertInstanceOf(FundingMethod::class, $result[0]);
        $this->assertSame('USDT_TRC20', $result[0]->code);
        $this->assertSame(10.0, $result[0]->minAmount);
    }

    public function testMethodsCallsCorrectEndpoint(): void
    {
        $this->transport->setResponse(FundFactory::makeMethodsListData());

        $this->resource->methods();

        $call = $this->transport->lastCall();
        $this->assertSame('GET', $call['method']);
        $this->assertSame('/funds/methods', $call['path']);
        $this->assertNull($call['params']);
        $this->assertNull($call['body']);
    }

    // --- createInvoice() ---

    public function testCreateInvoiceReturnsFundingInvoice(): void
    {
        $this->transport->setResponse(FundFactory::makeInvoiceData());

        $result = $this->resource->createInvoice('USDT_TRC20', 100.0);

        $this->assertInstanceOf(FundingInvoice::class, $result);
        $this->assertSame('inv-001', $result->id);
        $this->assertSame('pending', $result->status);
        $this->assertSame(100.0, $result->amountExpected);
    }

    public function testCreateInvoiceSendsCorrectBody(): void
    {
        $this->transport->setResponse(FundFactory::makeInvoiceData());

        $this->resource->createInvoice('USDT_TRC20', 100.0);

        $call = $this->transport->lastCall();
        $this->assertSame('POST', $call['method']);
        $this->assertSame('/funds/invoices', $call['path']);
        $this->assertSame(['methodCode' => 'USDT_TRC20', 'amount' => 100.0], $call['body']);
    }

    // --- listInvoices() ---

    public function testListInvoicesReturnsStructuredResult(): void
    {
        $this->transport->setResponse(FundFactory::makeInvoiceListData());

        $result = $this->resource->listInvoices();

        $this->assertArrayHasKey('items', $result);
        $this->assertArrayHasKey('total', $result);
        $this->assertSame(1, $result['total']);
        $this->assertCount(1, $result['items']);
        $this->assertInstanceOf(FundingInvoice::class, $result['items'][0]);
    }

    // --- getInvoice() ---

    public function testGetInvoiceReturnsFundingInvoice(): void
    {
        $this->transport->setResponse(FundFactory::makeInvoiceData());

        $result = $this->resource->getInvoice('inv-001');

        $this->assertInstanceOf(FundingInvoice::class, $result);
        $this->assertSame('inv-001', $result->id);
    }

    public function testGetInvoiceCallsCorrectEndpoint(): void
    {
        $this->transport->setResponse(FundFactory::makeInvoiceData());

        $this->resource->getInvoice('inv-001');

        $call = $this->transport->lastCall();
        $this->assertSame('GET', $call['method']);
        $this->assertSame('/funds/invoices/inv-001', $call['path']);
    }

    // --- checkInvoice() ---

    public function testCheckInvoiceCallsPost(): void
    {
        $this->transport->setResponse(FundFactory::makeInvoiceData());

        $this->resource->checkInvoice('inv-001');

        $call = $this->transport->lastCall();
        $this->assertSame('POST', $call['method']);
        $this->assertSame('/funds/invoices/inv-001/check', $call['path']);
    }

    // --- invoiceTimeLeft() ---

    public function testInvoiceTimeLeftReturnsTypedResponse(): void
    {
        $this->transport->setResponse(FundFactory::makeTimeLeftData());

        $result = $this->resource->invoiceTimeLeft('inv-001');

        $this->assertInstanceOf(FundingInvoiceTimeLeft::class, $result);
        $this->assertSame(3200, $result->secondsLeft);
        $this->assertFalse($result->expired);
    }

    public function testInvoiceTimeLeftCallsCorrectEndpoint(): void
    {
        $this->transport->setResponse(FundFactory::makeTimeLeftData());

        $this->resource->invoiceTimeLeft('inv-001');

        $call = $this->transport->lastCall();
        $this->assertSame('GET', $call['method']);
        $this->assertSame('/funds/invoices/inv-001/time-left', $call['path']);
    }

    // --- tonDeposit() ---

    public function testTonDepositReturnsState(): void
    {
        $this->transport->setResponse(FundFactory::makeTonDepositData());

        $result = $this->resource->tonDeposit();

        $this->assertInstanceOf(TonDepositState::class, $result);
        $this->assertSame('123456', $result->memoTag);
    }

    // --- bybit ---

    public function testBybitStateReturnsTypedResponse(): void
    {
        $this->transport->setResponse(FundFactory::makeBybitStateData());

        $result = $this->resource->bybitState();

        $this->assertInstanceOf(BybitState::class, $result);
        $this->assertTrue($result->linked);
        $this->assertSame('bybit-uid-002', $result->yourUid);
    }

    public function testBybitAttachSendsBody(): void
    {
        $this->transport->setResponse(FundFactory::makeBybitStateData());

        $this->resource->bybitAttach('uid-123');

        $call = $this->transport->lastCall();
        $this->assertSame('POST', $call['method']);
        $this->assertSame('/funds/bybit/attach', $call['path']);
        $this->assertSame(['uid' => 'uid-123'], $call['body']);
    }

    public function testBybitUnlinkCallsPost(): void
    {
        $this->transport->setResponse(FundFactory::makeBybitStateData());

        $this->resource->bybitUnlink();

        $call = $this->transport->lastCall();
        $this->assertSame('POST', $call['method']);
        $this->assertSame('/funds/bybit/unlink', $call['path']);
    }
}
