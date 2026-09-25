<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Tests\Unit\Resources;

use AppRoute\Sdk\Models\DtuCheckResponse;
use AppRoute\Sdk\Models\PurchaseResponse;
use AppRoute\Sdk\Models\PurchaseResult;
use AppRoute\Sdk\Models\TransactionListItem;
use AppRoute\Sdk\Models\Voucher;
use AppRoute\Sdk\Resources\OrdersResource;
use AppRoute\Sdk\Tests\Factory\OrderFactory;
use AppRoute\Sdk\Tests\TestCase;

final class OrdersResourceTest extends TestCase
{
    private OrdersResource $resource;

    protected function setUp(): void
    {
        parent::setUp();
        $this->resource = new OrdersResource($this->transport);
    }

    // --- create() ---

    public function testCreateReturnsPurchaseResponse(): void
    {
        $this->transport->setResponse(OrderFactory::makePurchaseData());

        $result = $this->resource->create([
            'ordersType' => 'shop',
            'itemId' => 'item-001',
            'productId' => 'prod-001',
        ]);

        $this->assertInstanceOf(PurchaseResponse::class, $result);
        $this->assertSame('completed', $result->status);
        $this->assertSame(48.5, $result->price);
        $this->assertSame('USD', $result->currency);
        $this->assertSame('txn-abc-123', $result->transactionUUID);
        $this->assertSame('ord-456', $result->orderId);
    }

    public function testCreateHasTypedResult(): void
    {
        $this->transport->setResponse(OrderFactory::makePurchaseData());

        $result = $this->resource->create(['itemId' => 'item-001']);

        $this->assertInstanceOf(PurchaseResult::class, $result->result);
        $this->assertNotNull($result->result->vouchers);
        $this->assertCount(1, $result->result->vouchers);
        $this->assertInstanceOf(Voucher::class, $result->result->vouchers[0]);
        $this->assertSame('XXXX-YYYY-ZZZZ', $result->result->vouchers[0]->pin);
    }

    public function testCreateCallsPostOrders(): void
    {
        $this->transport->setResponse(OrderFactory::makePurchaseData());

        $this->resource->create(['itemId' => 'item-001']);

        $call = $this->transport->lastCall();
        $this->assertSame('POST', $call['method']);
        $this->assertSame('/orders', $call['path']);
        $this->assertNull($call['params']);
        $this->assertNotNull($call['body']);
        $this->assertSame('item-001', $call['body']['itemId']);
    }

    // --- checkDtu() ---

    public function testCheckDtuReturnsDtuCheckResponse(): void
    {
        $this->transport->setResponse(OrderFactory::makeDtuCheckData());

        $result = $this->resource->checkDtu(['itemId' => 'item-dtu']);

        $this->assertInstanceOf(DtuCheckResponse::class, $result);
        $this->assertTrue($result->canRecharge);
        $this->assertSame(10.0, $result->price);
        $this->assertSame('USD', $result->currency);
        $this->assertSame('available', $result->providerStatus);
    }

    public function testCheckDtuSendsCorrectBody(): void
    {
        $this->transport->setResponse(OrderFactory::makeDtuCheckData());

        $this->resource->checkDtu(['itemId' => 'item-dtu']);

        $call = $this->transport->lastCall();
        $this->assertSame('POST', $call['method']);
        $this->assertSame('/orders', $call['path']);
        $this->assertSame('dtu', $call['body']['ordersType']);
        $this->assertTrue($call['body']['checkOnly']);
        $this->assertSame('item-dtu', $call['body']['itemId']);
    }

    public function testCheckDtuHasAttributes(): void
    {
        $this->transport->setResponse(OrderFactory::makeDtuCheckData());

        $result = $this->resource->checkDtu(['itemId' => 'item-dtu']);

        $this->assertIsArray($result->attributes);
        $this->assertSame('T-Mobile', $result->attributes['operatorName']);
    }

    // --- list() ---

    public function testListReturnsPageWithTypedItems(): void
    {
        $this->transport->setResponse(OrderFactory::makeOrderListData());

        $result = $this->resource->list();

        $this->assertArrayHasKey('page', $result);
        $this->assertArrayHasKey('items', $result['page']);
        $this->assertCount(1, $result['page']['items']);
        $this->assertInstanceOf(TransactionListItem::class, $result['page']['items'][0]);
    }

    public function testListTransactionFields(): void
    {
        $this->transport->setResponse(OrderFactory::makeOrderListData());

        $result = $this->resource->list();
        $item = $result['page']['items'][0];

        $this->assertSame('txn-abc-123', $item->transactionUUID);
        $this->assertSame('ord-456', $item->orderId);
        $this->assertSame('completed', $item->status);
        $this->assertSame(48.5, $item->amount);
        $this->assertFalse($result['page']['hasNext']);
    }

    public function testListCallsCorrectEndpoint(): void
    {
        $this->transport->setResponse(OrderFactory::makeOrderListData());

        $this->resource->list();

        $call = $this->transport->lastCall();
        $this->assertSame('GET', $call['method']);
        $this->assertSame('/orders', $call['path']);
    }

    public function testListPassesParams(): void
    {
        $this->transport->setResponse(OrderFactory::makeOrderListData());

        $this->resource->list(['limit' => 10, 'offset' => 20, 'orderId' => 'ord-1']);

        $call = $this->transport->lastCall();
        $this->assertSame(['limit' => 10, 'offset' => 20, 'orderId' => 'ord-1'], $call['params']);
    }
}
