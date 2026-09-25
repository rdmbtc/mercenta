from __future__ import annotations

import pytest

from approute.models import (
    ItemLookupResponse,
    Product,
    ProductItem,
    ProductListResponse,
    ProductStockResponse,
)
from approute.resources.services import ServicesResource
from tests.conftest import MockTransport
from tests.factories import (
    make_item_lookup_request_item,
    make_item_lookup_response,
    make_item_lookup_row,
    make_product,
    make_product_item,
    make_product_list_response,
    make_product_stock_response,
)


@pytest.fixture
def resource(transport: MockTransport) -> ServicesResource:
    return ServicesResource(transport)  # type: ignore[arg-type]


class TestServicesList:
    def test_returns_product_list(
        self, resource: ServicesResource, transport: MockTransport
    ) -> None:
        transport.set_response(make_product_list_response())
        result = resource.list()
        assert isinstance(result, ProductListResponse)
        assert len(result.items) == 1
        assert result.items[0].id == "prod-001"

    def test_calls_correct_endpoint(
        self, resource: ServicesResource, transport: MockTransport
    ) -> None:
        transport.set_response(make_product_list_response())
        resource.list()
        assert transport.last_call.method == "GET"
        assert transport.last_call.path == "/services"


class TestServicesGet:
    def test_returns_product(self, resource: ServicesResource, transport: MockTransport) -> None:
        transport.set_response(make_product())
        result = resource.get("prod-001")
        assert isinstance(result, Product)
        assert result.id == "prod-001"

    def test_calls_correct_endpoint(
        self, resource: ServicesResource, transport: MockTransport
    ) -> None:
        transport.set_response(make_product())
        resource.get("prod-001")
        assert transport.last_call.method == "GET"
        assert transport.last_call.path == "/services/prod-001"


class TestServicesStock:
    def test_returns_stock_response(
        self, resource: ServicesResource, transport: MockTransport
    ) -> None:
        transport.set_response(make_product_stock_response())
        result = resource.stock("prod-001")
        assert isinstance(result, ProductStockResponse)
        assert result.product_id == "prod-001"
        assert len(result.items) == 2

    def test_calls_correct_endpoint(
        self, resource: ServicesResource, transport: MockTransport
    ) -> None:
        transport.set_response(make_product_stock_response())
        resource.stock("prod-001")
        assert transport.last_call.method == "GET"
        assert transport.last_call.path == "/services/prod-001/stock"


class TestServicesGetItem:
    def test_returns_product_item(
        self, resource: ServicesResource, transport: MockTransport
    ) -> None:
        transport.set_response(make_product_item(id="item-1"))
        result = resource.get_item("svc-1", "item-1")
        assert isinstance(result, ProductItem)
        assert result.id == "item-1"

    def test_calls_correct_endpoint(
        self, resource: ServicesResource, transport: MockTransport
    ) -> None:
        transport.set_response(make_product_item(id="item-1"))
        resource.get_item("svc-1", "item-1")
        assert transport.last_call.method == "GET"
        assert transport.last_call.path == "/services/svc-1/items/item-1"
        # GET — no body should be sent
        assert transport.last_call.json_body is None


class TestServicesLookupItems:
    def test_returns_lookup_response(
        self, resource: ServicesResource, transport: MockTransport
    ) -> None:
        transport.set_response(make_item_lookup_response())
        result = resource.lookup_items(
            [
                make_item_lookup_request_item(service_id="svc-1", item_id="item-1"),
                make_item_lookup_request_item(service_id="svc-1", item_id="item-2"),
            ]
        )
        assert isinstance(result, ItemLookupResponse)
        assert len(result.items) == 3

    def test_calls_correct_endpoint_and_body(
        self, resource: ServicesResource, transport: MockTransport
    ) -> None:
        transport.set_response(make_item_lookup_response())
        resource.lookup_items(
            [
                make_item_lookup_request_item(service_id="svc-1", item_id="item-1"),
                make_item_lookup_request_item(service_id="svc-2", item_id="item-9"),
            ]
        )
        assert transport.last_call.method == "POST"
        assert transport.last_call.path == "/services/items/lookup"
        # Body is serialized via .model_dump() — snake_case keys here; the
        # transport's convert_keys_to_camel() handles camelCase on the wire.
        assert transport.last_call.json_body == {
            "items": [
                {"service_id": "svc-1", "item_id": "item-1"},
                {"service_id": "svc-2", "item_id": "item-9"},
            ]
        }

    def test_decodes_mixed_outcome_response(
        self, resource: ServicesResource, transport: MockTransport
    ) -> None:
        """Mixed-outcome fixture: hit + service_not_found + item_not_found."""
        transport.set_response(make_item_lookup_response())
        result = resource.lookup_items(
            [make_item_lookup_request_item(service_id="svc-1", item_id="item-1")]
        )

        # Row 0: hit — found=True, item set, no error
        assert result.items[0].found is True
        assert result.items[0].item is not None
        assert result.items[0].error is None
        # Row 1: service_not_found — found=False, no item, error set
        assert result.items[1].found is False
        assert result.items[1].item is None
        assert result.items[1].error == "service_not_found"
        # Row 2: item_not_found — same shape, different error code
        assert result.items[2].found is False
        assert result.items[2].item is None
        assert result.items[2].error == "item_not_found"

    def test_preserves_input_order(
        self, resource: ServicesResource, transport: MockTransport
    ) -> None:
        """Backend contract: the response items are in the same order as the
        request items. The SDK must surface that ordering byte-for-byte.
        """
        rows = [
            make_item_lookup_row(service_id="svc-A", item_id="item-X"),
            make_item_lookup_row(service_id="svc-B", item_id="item-Y"),
            make_item_lookup_row(service_id="svc-C", item_id="item-Z"),
        ]
        transport.set_response(make_item_lookup_response(rows=rows))
        result = resource.lookup_items(
            [
                make_item_lookup_request_item(service_id="svc-A", item_id="item-X"),
                make_item_lookup_request_item(service_id="svc-B", item_id="item-Y"),
                make_item_lookup_request_item(service_id="svc-C", item_id="item-Z"),
            ]
        )
        assert [(r.service_id, r.item_id) for r in result.items] == [
            ("svc-A", "item-X"),
            ("svc-B", "item-Y"),
            ("svc-C", "item-Z"),
        ]

    def test_empty_input_raises_without_network_call(
        self, resource: ServicesResource, transport: MockTransport
    ) -> None:
        with pytest.raises(ValueError, match="must not be empty"):
            resource.lookup_items([])
        # Critical: rejection must be client-side — zero HTTP calls.
        assert transport.calls == []

    def test_oversized_input_raises_without_network_call(
        self, resource: ServicesResource, transport: MockTransport
    ) -> None:
        too_many = [
            make_item_lookup_request_item(service_id="svc-1", item_id=f"item-{i}")
            for i in range(101)
        ]
        with pytest.raises(ValueError, match="at most 100"):
            resource.lookup_items(too_many)
        # Critical: rejection must be client-side — zero HTTP calls.
        assert transport.calls == []
