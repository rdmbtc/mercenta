<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Resources;

use AppRoute\Sdk\Contracts\ResourceInterface;
use AppRoute\Sdk\Contracts\TransportInterface;
use AppRoute\Sdk\Models\Account;
use AppRoute\Sdk\Models\AccountTransaction;

class AccountsResource implements ResourceInterface
{
    public function __construct(private readonly TransportInterface $transport) {}

    /** @return Account[] */
    public function balances(): array
    {
        $data = $this->transport->request('GET', '/accounts');
        return array_map(fn(array $a) => Account::fromArray($a), $data['items'] ?? []);
    }

    /**
     * List balance transactions.
     *
     * @param array{
     *     currency?: string,
     *     category?: string[],
     *     search?: string,
     *     transactionId?: string,
     *     orderId?: string,
     *     dateFrom?: string,
     *     dateTo?: string,
     *     limit?: int,
     *     offset?: int,
     * } $params
     * @return array{totalCount: int, items: AccountTransaction[]}
     */
    public function transactions(array $params = []): array
    {
        $data = $this->transport->request('GET', '/accounts/transactions', params: $params ?: null);
        return [
            'totalCount' => $data['totalCount'] ?? 0,
            'items' => array_map(fn(array $t) => AccountTransaction::fromArray($t), $data['items'] ?? []),
        ];
    }
}
