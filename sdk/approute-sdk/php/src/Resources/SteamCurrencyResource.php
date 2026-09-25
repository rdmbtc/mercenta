<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Resources;

use AppRoute\Sdk\Contracts\ResourceInterface;
use AppRoute\Sdk\Contracts\TransportInterface;
use AppRoute\Sdk\Models\SteamCurrencyRate;

class SteamCurrencyResource implements ResourceInterface
{
    public function __construct(private readonly TransportInterface $transport) {}

    /**
     * Get Steam currency exchange rates.
     *
     * @param string[]|null $quotes Currency codes to filter
     * @return array{baseCurrencyCode: string, items: SteamCurrencyRate[]}
     */
    public function rates(?array $quotes = null): array
    {
        $params = $quotes !== null ? ['quotes' => $quotes] : null;
        $data = $this->transport->request('GET', '/steam-currency/rates', params: $params);
        return [
            'baseCurrencyCode' => $data['baseCurrencyCode'] ?? 'USD',
            'items' => array_map(fn(array $r) => SteamCurrencyRate::fromArray($r), $data['items'] ?? []),
        ];
    }
}
