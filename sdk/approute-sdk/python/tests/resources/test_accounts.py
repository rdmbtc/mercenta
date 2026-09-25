from __future__ import annotations

import pytest

from approute.models import AccountListResponse, AccountTransactionPage
from approute.resources.accounts import AccountsResource
from tests.conftest import MockTransport
from tests.factories import make_account_list_response, make_account_transaction_page


@pytest.fixture
def resource(transport: MockTransport) -> AccountsResource:
    return AccountsResource(transport)  # type: ignore[arg-type]


class TestAccountsBalances:
    def test_returns_balances(
        self, resource: AccountsResource, transport: MockTransport
    ) -> None:
        transport.set_response(make_account_list_response())
        result = resource.balances()
        assert isinstance(result, AccountListResponse)
        assert len(result.items) == 1
        assert result.items[0].balance == 1250.50

    def test_calls_correct_endpoint(
        self, resource: AccountsResource, transport: MockTransport
    ) -> None:
        transport.set_response(make_account_list_response())
        resource.balances()
        assert transport.last_call.method == "GET"
        assert transport.last_call.path == "/accounts"


class TestAccountsTransactions:
    def test_returns_transactions(
        self, resource: AccountsResource, transport: MockTransport
    ) -> None:
        transport.set_response(make_account_transaction_page())
        result = resource.transactions()
        assert isinstance(result, AccountTransactionPage)
        assert result.total_count == 1

    def test_passes_filter_params(
        self, resource: AccountsResource, transport: MockTransport
    ) -> None:
        transport.set_response(make_account_transaction_page())
        resource.transactions(currency="USD", category=["shop"], limit=10, offset=5)
        params = transport.last_call.params
        assert params is not None
        assert params["currency"] == "USD"
        assert params["category"] == ["shop"]
        assert params["limit"] == 10
        assert params["offset"] == 5
