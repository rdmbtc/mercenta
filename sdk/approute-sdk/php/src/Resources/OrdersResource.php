<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Resources;

use AppRoute\Sdk\Contracts\ResourceInterface;
use AppRoute\Sdk\Contracts\TransportInterface;
use AppRoute\Sdk\Models\DtuCheckResponse;
use AppRoute\Sdk\Models\PurchaseResponse;
use AppRoute\Sdk\Models\TransactionListItem;

class OrdersResource implements ResourceInterface
{
    public function __construct(private readonly TransportInterface $transport) {}

    /**
     * Create a purchase order.
     *
     * @param array<string, mixed> $params Order parameters
     */
    public function create(array $params): PurchaseResponse
    {
        $body = $this->buildBody($params);
        $data = $this->transport->request('POST', '/orders', body: $body);
        return PurchaseResponse::fromArray($data);
    }

    /**
     * Validate a DTU order without creating it.
     *
     * @param array<string, mixed> $params
     */
    public function checkDtu(array $params): DtuCheckResponse
    {
        $body = array_merge($params, [
            'ordersType' => 'dtu',
            'checkOnly' => true,
        ]);
        $data = $this->transport->request('POST', '/orders', body: $body);
        return DtuCheckResponse::fromArray($data);
    }

    /**
     * List orders.
     *
     * @param array{limit?: int, offset?: int, orderId?: string, referenceId?: string, unhide?: bool} $params
     * @return array{page: array{items: TransactionListItem[], hasNext: bool}}
     */
    public function list(array $params = []): array
    {
        $data = $this->transport->request('GET', '/orders', params: $params ?: null);
        $page = $data['page'] ?? [];
        return [
            'page' => [
                'items' => array_map(
                    fn(array $t) => TransactionListItem::fromArray($t),
                    $page['items'] ?? [],
                ),
                'hasNext' => $page['hasNext'] ?? false,
            ],
        ];
    }

    /** @param array<string, mixed> $params */
    private function buildBody(array $params): array
    {
        $body = [];
        $keyMap = [
            'orders_type' => 'ordersType',
            'ordersType' => 'ordersType',
            'reference_id' => 'referenceId',
            'referenceId' => 'referenceId',
            'reference' => 'reference',
            'check_only' => 'checkOnly',
            'checkOnly' => 'checkOnly',
            'orders' => 'orders',
            'item_id' => 'itemId',
            'itemId' => 'itemId',
            'product_id' => 'productId',
            'productId' => 'productId',
            'quantity' => 'quantity',
            'amount' => 'amount',
            'currency' => 'currency',
            'client_time' => 'clientTime',
            'clientTime' => 'clientTime',
            'fields' => 'fields',
            'direct_order' => 'directOrder',
            'directOrder' => 'directOrder',
            'account_id' => 'accountId',
            'accountId' => 'accountId',
        ];

        foreach ($params as $key => $value) {
            $mappedKey = $keyMap[$key] ?? $key;
            if ($value !== null) {
                $body[$mappedKey] = $value;
            }
        }

        return $body;
    }
}
