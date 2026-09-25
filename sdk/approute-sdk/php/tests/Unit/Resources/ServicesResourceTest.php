<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Tests\Unit\Resources;

use AppRoute\Sdk\Models\ItemLookupRequestItem;
use AppRoute\Sdk\Models\ItemLookupResponse;
use AppRoute\Sdk\Models\Product;
use AppRoute\Sdk\Models\ProductField;
use AppRoute\Sdk\Models\ProductFieldValidation;
use AppRoute\Sdk\Models\ProductItem;
use AppRoute\Sdk\Models\ProductStockItem;
use AppRoute\Sdk\Models\ProductStockResponse;
use AppRoute\Sdk\Resources\ServicesResource;
use AppRoute\Sdk\Tests\Factory\ItemLookupResponseFactory;
use AppRoute\Sdk\Tests\Factory\ProductFactory;
use AppRoute\Sdk\Tests\TestCase;

final class ServicesResourceTest extends TestCase
{
    private ServicesResource $resource;

    protected function setUp(): void
    {
        parent::setUp();
        $this->resource = new ServicesResource($this->transport);
    }

    // --- list() ---

    public function testListReturnsProductArray(): void
    {
        $this->transport->setResponse(ProductFactory::makeProductListData());

        $result = $this->resource->list();

        $this->assertCount(1, $result);
        $this->assertInstanceOf(Product::class, $result[0]);
        $this->assertSame('prod-001', $result[0]->id);
        $this->assertSame('Steam Wallet 50 USD', $result[0]->name);
        $this->assertSame('voucher', $result[0]->type);
    }

    public function testListCallsCorrectEndpoint(): void
    {
        $this->transport->setResponse(ProductFactory::makeProductListData());

        $this->resource->list();

        $call = $this->transport->lastCall();
        $this->assertSame('GET', $call['method']);
        $this->assertSame('/services', $call['path']);
        $this->assertNull($call['params']);
        $this->assertNull($call['body']);
    }

    public function testListProductContainsTypedItems(): void
    {
        $this->transport->setResponse(ProductFactory::makeProductListData());

        $products = $this->resource->list();

        $this->assertCount(1, $products[0]->items);
        $this->assertInstanceOf(ProductItem::class, $products[0]->items[0]);
        $this->assertSame('item-001', $products[0]->items[0]->id);
        $this->assertSame(48.5, $products[0]->items[0]->price);
    }

    public function testListProductContainsTypedFields(): void
    {
        $this->transport->setResponse(ProductFactory::makeProductListData());

        $products = $this->resource->list();

        $this->assertNotNull($products[0]->fields);
        $this->assertCount(1, $products[0]->fields);
        $this->assertInstanceOf(ProductField::class, $products[0]->fields[0]);
        $this->assertSame('email', $products[0]->fields[0]->key);
        $this->assertTrue($products[0]->fields[0]->required);
    }

    public function testListFieldHasTypedValidation(): void
    {
        $this->transport->setResponse(ProductFactory::makeProductListData());

        $products = $this->resource->list();
        $field = $products[0]->fields[0];

        $this->assertInstanceOf(ProductFieldValidation::class, $field->validation);
        $this->assertSame('^[^@]+@[^@]+$', $field->validation->pattern);
        $this->assertSame('Invalid email', $field->validation->message);
    }

    // --- get() ---

    public function testGetReturnsProduct(): void
    {
        $this->transport->setResponse(ProductFactory::makeProductGetData());

        $product = $this->resource->get('prod-001');

        $this->assertInstanceOf(Product::class, $product);
        $this->assertSame('prod-001', $product->id);
        $this->assertNull($product->fields);
    }

    public function testGetCallsCorrectEndpoint(): void
    {
        $this->transport->setResponse(ProductFactory::makeProductGetData());

        $this->resource->get('prod-001');

        $call = $this->transport->lastCall();
        $this->assertSame('GET', $call['method']);
        $this->assertSame('/services/prod-001', $call['path']);
    }

    // --- stock() ---

    public function testStockReturnsTypedResponse(): void
    {
        $this->transport->setResponse(ProductFactory::makeProductStockData());

        $result = $this->resource->stock('prod-001');

        $this->assertInstanceOf(ProductStockResponse::class, $result);
        $this->assertSame('prod-001', $result->productId);
        $this->assertCount(2, $result->items);
    }

    public function testStockItemsAreTyped(): void
    {
        $this->transport->setResponse(ProductFactory::makeProductStockData());

        $result = $this->resource->stock('prod-001');

        $this->assertInstanceOf(ProductStockItem::class, $result->items[0]);
        $this->assertSame('item-001', $result->items[0]->itemId);
        $this->assertSame(150, $result->items[0]->stock);
        $this->assertNull($result->items[1]->stock);
    }

    public function testStockCallsCorrectEndpoint(): void
    {
        $this->transport->setResponse(ProductFactory::makeProductStockData());

        $this->resource->stock('prod-001');

        $call = $this->transport->lastCall();
        $this->assertSame('GET', $call['method']);
        $this->assertSame('/services/prod-001/stock', $call['path']);
    }

    // --- getItem() ---

    public function testGetItemReturnsProductItem(): void
    {
        $this->transport->setResponse(
            ProductFactory::makeProductItemData(['id' => 'item-1', 'price' => 12.34])
        );

        $item = $this->resource->getItem('svc-1', 'item-1');

        $this->assertInstanceOf(ProductItem::class, $item);
        $this->assertSame('item-1', $item->id);
        $this->assertSame(12.34, $item->price);
    }

    public function testGetItemCallsCorrectEndpoint(): void
    {
        $this->transport->setResponse(ProductFactory::makeProductItemData());

        $this->resource->getItem('svc-1', 'item-1');

        $call = $this->transport->lastCall();
        $this->assertSame('GET', $call['method']);
        $this->assertSame('/services/svc-1/items/item-1', $call['path']);
        $this->assertNull($call['params']);
        $this->assertNull($call['body']);
    }

    // --- lookupItems() ---

    public function testLookupItemsReturnsLookupResponse(): void
    {
        $this->transport->setResponse(ItemLookupResponseFactory::makeLookupResponseData());

        $result = $this->resource->lookupItems([
            new ItemLookupRequestItem('svc-1', 'item-1'),
            new ItemLookupRequestItem('svc-1', 'item-2'),
        ]);

        $this->assertInstanceOf(ItemLookupResponse::class, $result);
        $this->assertCount(3, $result->items);
    }

    public function testLookupItemsSendsCorrectMethodPathAndBody(): void
    {
        $this->transport->setResponse(ItemLookupResponseFactory::makeLookupResponseData());

        $this->resource->lookupItems([
            new ItemLookupRequestItem('svc-1', 'item-1'),
            new ItemLookupRequestItem('svc-2', 'item-9'),
        ]);

        $call = $this->transport->lastCall();
        $this->assertSame('POST', $call['method']);
        $this->assertSame('/services/items/lookup', $call['path']);
        // Wire format must use camelCase serviceId / itemId verbatim.
        $this->assertSame(
            [
                'items' => [
                    ['serviceId' => 'svc-1', 'itemId' => 'item-1'],
                    ['serviceId' => 'svc-2', 'itemId' => 'item-9'],
                ],
            ],
            $call['body'],
        );
    }

    public function testLookupItemsDecodesMixedOutcomeResponse(): void
    {
        $this->transport->setResponse(ItemLookupResponseFactory::makeLookupResponseData());

        $result = $this->resource->lookupItems([
            new ItemLookupRequestItem('svc-1', 'item-1'),
        ]);

        // Row 0: hit
        $this->assertTrue($result->items[0]->found);
        $this->assertInstanceOf(ProductItem::class, $result->items[0]->item);
        $this->assertNull($result->items[0]->error);

        // Row 1: service_not_found
        $this->assertFalse($result->items[1]->found);
        $this->assertNull($result->items[1]->item);
        $this->assertSame('service_not_found', $result->items[1]->error);

        // Row 2: item_not_found
        $this->assertFalse($result->items[2]->found);
        $this->assertNull($result->items[2]->item);
        $this->assertSame('item_not_found', $result->items[2]->error);
    }

    public function testLookupItemsPreservesInputOrder(): void
    {
        // Backend contract: response items are in the same order as the
        // request items. Verify the SDK surfaces that ordering verbatim.
        $this->transport->setResponse(ItemLookupResponseFactory::makeLookupResponseData([
            'items' => [
                ItemLookupResponseFactory::makeLookupRowData(['serviceId' => 'svc-A', 'itemId' => 'item-X']),
                ItemLookupResponseFactory::makeLookupRowData(['serviceId' => 'svc-B', 'itemId' => 'item-Y']),
                ItemLookupResponseFactory::makeLookupRowData(['serviceId' => 'svc-C', 'itemId' => 'item-Z']),
            ],
        ]));

        $result = $this->resource->lookupItems([
            new ItemLookupRequestItem('svc-A', 'item-X'),
            new ItemLookupRequestItem('svc-B', 'item-Y'),
            new ItemLookupRequestItem('svc-C', 'item-Z'),
        ]);

        $order = array_map(
            fn($r) => [$r->serviceId, $r->itemId],
            $result->items,
        );
        $this->assertSame(
            [['svc-A', 'item-X'], ['svc-B', 'item-Y'], ['svc-C', 'item-Z']],
            $order,
        );
    }

    public function testLookupItemsRejectsEmptyInputWithoutNetworkCall(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('items must not be empty');

        try {
            $this->resource->lookupItems([]);
        } finally {
            // Critical: rejection must be client-side — zero HTTP calls.
            $this->assertSame(0, $this->transport->callCount());
        }
    }

    public function testLookupItemsRejectsOversizedInputWithoutNetworkCall(): void
    {
        $tooMany = [];
        for ($i = 0; $i < 101; $i++) {
            $tooMany[] = new ItemLookupRequestItem('svc-1', "item-{$i}");
        }

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('at most 100');

        try {
            $this->resource->lookupItems($tooMany);
        } finally {
            // Critical: rejection must be client-side — zero HTTP calls.
            $this->assertSame(0, $this->transport->callCount());
        }
    }
}
