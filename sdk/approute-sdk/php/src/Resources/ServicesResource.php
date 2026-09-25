<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Resources;

use AppRoute\Sdk\Contracts\ResourceInterface;
use AppRoute\Sdk\Contracts\TransportInterface;
use AppRoute\Sdk\Models\ItemLookupRequestItem;
use AppRoute\Sdk\Models\ItemLookupResponse;
use AppRoute\Sdk\Models\Product;
use AppRoute\Sdk\Models\ProductItem;
use AppRoute\Sdk\Models\ProductStockResponse;

class ServicesResource implements ResourceInterface
{
    /**
     * Batch lookup hard cap. Matches the backend's max_length=100 on
     * ItemLookupRequest.items. Enforced client-side too so callers get a
     * fail-fast InvalidArgumentException instead of a server-side 422
     * round-trip.
     */
    public const MAX_LOOKUP_ITEMS = 100;

    public function __construct(private readonly TransportInterface $transport) {}

    /** @return Product[] */
    public function list(): array
    {
        $data = $this->transport->request('GET', '/services');
        return array_map(fn(array $p) => Product::fromArray($p), $data['items'] ?? []);
    }

    public function get(string $productId): Product
    {
        $data = $this->transport->request('GET', "/services/{$productId}");
        return Product::fromArray($data);
    }

    public function stock(string $productId): ProductStockResponse
    {
        $data = $this->transport->request('GET', "/services/{$productId}/stock");
        return ProductStockResponse::fromArray($data);
    }

    /**
     * Get a single denomination/item from a service by id.
     *
     * Calls GET /services/{serviceId}/items/{itemId} and returns the same
     * {@see ProductItem} shape that appears inside
     * GET /services/{serviceId}.data.items[].
     */
    public function getItem(string $serviceId, string $itemId): ProductItem
    {
        $data = $this->transport->request('GET', "/services/{$serviceId}/items/{$itemId}");
        return ProductItem::fromArray($data);
    }

    /**
     * Batch lookup of up to 100 (serviceId, itemId) pairs in one round-trip.
     *
     * The response items are in the same order as the input — callers can
     * iterate request and response by index without re-keying.
     *
     * @param  ItemLookupRequestItem[] $items
     *
     * @throws \InvalidArgumentException If {@see $items} is empty or has more
     *                                    than {@see self::MAX_LOOKUP_ITEMS}
     *                                    entries. The check happens before
     *                                    any HTTP call is made.
     */
    public function lookupItems(array $items): ItemLookupResponse
    {
        if (count($items) === 0) {
            throw new \InvalidArgumentException('items must not be empty');
        }
        if (count($items) > self::MAX_LOOKUP_ITEMS) {
            throw new \InvalidArgumentException(
                'items must contain at most ' . self::MAX_LOOKUP_ITEMS . ' entries'
            );
        }
        $payload = [
            'items' => array_map(
                fn(ItemLookupRequestItem $i) => $i->toArray(),
                $items,
            ),
        ];
        $data = $this->transport->request('POST', '/services/items/lookup', body: $payload);
        return ItemLookupResponse::fromArray($data);
    }
}
