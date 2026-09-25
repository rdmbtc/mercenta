from __future__ import annotations

import pytest

from approute.models import DtuCheckResponse, PurchaseResponse, TransactionListResponse
from approute.resources.orders import OrdersResource
from tests.conftest import MockTransport
from tests.factories import (
    make_dtu_check_response,
    make_purchase_response,
    make_transaction_list_response,
)


@pytest.fixture
def resource(transport: MockTransport) -> OrdersResource:
    return OrdersResource(transport)  # type: ignore[arg-type]


class TestOrdersCreate:
    def test_returns_purchase_response(
        self, resource: OrdersResource, transport: MockTransport
    ) -> None:
        transport.set_response(make_purchase_response())
        result = resource.create(item_id="item-001", product_id="prod-001")
        assert isinstance(result, PurchaseResponse)
        assert result.status == "completed"
        assert result.result is not None
        assert result.result.vouchers is not None

    def test_calls_post_orders(self, resource: OrdersResource, transport: MockTransport) -> None:
        transport.set_response(make_purchase_response())
        resource.create(item_id="item-001")
        call = transport.last_call
        assert call.method == "POST"
        assert call.path == "/orders"
        assert call.params is None
        assert call.json_body is not None
        assert call.json_body["orders_type"] == "shop"
        assert call.json_body["item_id"] == "item-001"


class TestOrdersCheckDtu:
    def test_returns_dtu_response(
        self, resource: OrdersResource, transport: MockTransport
    ) -> None:
        transport.set_response(make_dtu_check_response())
        result = resource.check_dtu(item_id="item-dtu")
        assert isinstance(result, DtuCheckResponse)
        assert result.can_recharge is True

    def test_sends_check_only_flag(
        self, resource: OrdersResource, transport: MockTransport
    ) -> None:
        transport.set_response(make_dtu_check_response())
        resource.check_dtu(item_id="item-dtu")
        body = transport.last_call.json_body
        assert body is not None
        assert body["check_only"] is True
        assert body["orders_type"] == "dtu"


class TestOrdersList:
    def test_returns_transaction_list(
        self, resource: OrdersResource, transport: MockTransport
    ) -> None:
        transport.set_response(make_transaction_list_response())
        result = resource.list()
        assert isinstance(result, TransactionListResponse)
        assert len(result.page.items) == 1

    def test_passes_pagination_params(
        self, resource: OrdersResource, transport: MockTransport
    ) -> None:
        transport.set_response(make_transaction_list_response())
        resource.list(limit=10, offset=20, order_id="ord-1")
        params = transport.last_call.params
        assert params is not None
        assert params["limit"] == 10
        assert params["offset"] == 20
        assert params["order_id"] == "ord-1"
