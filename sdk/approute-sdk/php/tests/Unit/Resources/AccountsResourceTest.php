<?php

declare(strict_types=1);

namespace AppRoute\Sdk\Tests\Unit\Resources;

use AppRoute\Sdk\Models\Account;
use AppRoute\Sdk\Models\AccountActivity;
use AppRoute\Sdk\Models\AccountTransaction;
use AppRoute\Sdk\Resources\AccountsResource;
use AppRoute\Sdk\Tests\Factory\AccountFactory;
use AppRoute\Sdk\Tests\TestCase;

final class AccountsResourceTest extends TestCase
{
    private AccountsResource $resource;

    protected function setUp(): void
    {
        parent::setUp();
        $this->resource = new AccountsResource($this->transport);
    }

    // --- balances() ---

    public function testBalancesReturnsAccountArray(): void
    {
        $this->transport->setResponse(AccountFactory::makeBalancesData());

        $result = $this->resource->balances();

        $this->assertCount(1, $result);
        $this->assertInstanceOf(Account::class, $result[0]);
        $this->assertSame('USD', $result[0]->currency);
        $this->assertSame(1250.50, $result[0]->balance);
        $this->assertSame(1200.0, $result[0]->available);
    }

    public function testBalancesCallsCorrectEndpoint(): void
    {
        $this->transport->setResponse(AccountFactory::makeBalancesData());

        $this->resource->balances();

        $call = $this->transport->lastCall();
        $this->assertSame('GET', $call['method']);
        $this->assertSame('/accounts', $call['path']);
        $this->assertNull($call['params']);
        $this->assertNull($call['body']);
    }

    public function testBalancesHasTypedRecentActivity(): void
    {
        $this->transport->setResponse(AccountFactory::makeBalancesData());

        $result = $this->resource->balances();

        $this->assertCount(1, $result[0]->recentActivity);
        $this->assertInstanceOf(AccountActivity::class, $result[0]->recentActivity[0]);
        $this->assertSame('act-001', $result[0]->recentActivity[0]->id);
        $this->assertSame(-48.5, $result[0]->recentActivity[0]->amount);
    }

    // --- transactions() ---

    public function testTransactionsReturnsStructuredResult(): void
    {
        $this->transport->setResponse(AccountFactory::makeTransactionsData());

        $result = $this->resource->transactions();

        $this->assertArrayHasKey('totalCount', $result);
        $this->assertSame(1, $result['totalCount']);
        $this->assertArrayHasKey('items', $result);
        $this->assertCount(1, $result['items']);
    }

    public function testTransactionsItemsAreTyped(): void
    {
        $this->transport->setResponse(AccountFactory::makeTransactionsData());

        $result = $this->resource->transactions();

        $this->assertInstanceOf(AccountTransaction::class, $result['items'][0]);
        $this->assertSame('tx-001', $result['items'][0]->id);
        $this->assertSame('shop', $result['items'][0]->category);
        $this->assertSame(-48.5, $result['items'][0]->amount);
    }

    public function testTransactionsCallsCorrectEndpoint(): void
    {
        $this->transport->setResponse(AccountFactory::makeTransactionsData());

        $this->resource->transactions();

        $call = $this->transport->lastCall();
        $this->assertSame('GET', $call['method']);
        $this->assertSame('/accounts/transactions', $call['path']);
    }

    public function testTransactionsPassesFilterParams(): void
    {
        $this->transport->setResponse(AccountFactory::makeTransactionsData());

        $this->resource->transactions(['currency' => 'USD', 'limit' => 10, 'offset' => 5]);

        $call = $this->transport->lastCall();
        $this->assertSame(['currency' => 'USD', 'limit' => 10, 'offset' => 5], $call['params']);
    }
}
