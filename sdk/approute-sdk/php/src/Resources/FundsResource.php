<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Resources;

use AppRoute\Sdk\Contracts\ResourceInterface;
use AppRoute\Sdk\Contracts\TransportInterface;
use AppRoute\Sdk\Models\BybitState;
use AppRoute\Sdk\Models\FundingInvoice;
use AppRoute\Sdk\Models\FundingInvoiceTimeLeft;
use AppRoute\Sdk\Models\FundingMethod;
use AppRoute\Sdk\Models\TonDepositState;

class FundsResource implements ResourceInterface
{
    public function __construct(private readonly TransportInterface $transport) {}

    /** @return FundingMethod[] */
    public function methods(): array
    {
        $data = $this->transport->request('GET', '/funds/methods');
        return array_map(fn(array $m) => FundingMethod::fromArray($m), $data['items'] ?? []);
    }

    public function createInvoice(string $methodCode, float $amount): FundingInvoice
    {
        $data = $this->transport->request('POST', '/funds/invoices', body: [
            'methodCode' => $methodCode,
            'amount' => $amount,
        ]);
        return FundingInvoice::fromArray($data);
    }

    /**
     * @param array{
     *     status?: string[],
     *     methodCode?: string[],
     *     search?: string,
     *     invoiceId?: string,
     *     createdFrom?: string,
     *     createdTo?: string,
     *     withTx?: bool,
     *     limit?: int,
     *     offset?: int,
     * } $params
     * @return array{items: FundingInvoice[], total: int}
     */
    public function listInvoices(array $params = []): array
    {
        $data = $this->transport->request('GET', '/funds/invoices', params: $params ?: null);
        return [
            'items' => array_map(fn(array $i) => FundingInvoice::fromArray($i), $data['items'] ?? []),
            'total' => $data['total'] ?? 0,
        ];
    }

    public function getInvoice(string $invoiceId): FundingInvoice
    {
        $data = $this->transport->request('GET', "/funds/invoices/{$invoiceId}");
        return FundingInvoice::fromArray($data);
    }

    public function checkInvoice(string $invoiceId): FundingInvoice
    {
        $data = $this->transport->request('POST', "/funds/invoices/{$invoiceId}/check");
        return FundingInvoice::fromArray($data);
    }

    public function invoiceTimeLeft(string $invoiceId): FundingInvoiceTimeLeft
    {
        $data = $this->transport->request('GET', "/funds/invoices/{$invoiceId}/time-left");
        return FundingInvoiceTimeLeft::fromArray($data);
    }

    public function tonDeposit(): TonDepositState
    {
        $data = $this->transport->request('GET', '/funds/ton/deposit');
        return TonDepositState::fromArray($data);
    }

    public function bybitState(): BybitState
    {
        $data = $this->transport->request('GET', '/funds/bybit/state');
        return BybitState::fromArray($data);
    }

    public function bybitAttach(string $uid): BybitState
    {
        $data = $this->transport->request('POST', '/funds/bybit/attach', body: ['uid' => $uid]);
        return BybitState::fromArray($data);
    }

    public function bybitUnlink(): BybitState
    {
        $data = $this->transport->request('POST', '/funds/bybit/unlink');
        return BybitState::fromArray($data);
    }
}
