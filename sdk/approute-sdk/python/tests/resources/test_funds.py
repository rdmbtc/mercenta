from __future__ import annotations

import pytest

from approute.models import (
    BybitState,
    FundingInvoice,
    FundingInvoiceList,
    FundingInvoiceTimeLeft,
    FundingMethodsResponse,
    TonDepositState,
)
from approute.resources.funds import FundsResource
from tests.conftest import MockTransport
from tests.factories import (
    make_bybit_state,
    make_funding_invoice,
    make_funding_invoice_list,
    make_funding_invoice_time_left,
    make_funding_methods_response,
    make_ton_deposit_state,
)


@pytest.fixture
def resource(transport: MockTransport) -> FundsResource:
    return FundsResource(transport)  # type: ignore[arg-type]


class TestFundsMethods:
    def test_returns_methods(self, resource: FundsResource, transport: MockTransport) -> None:
        transport.set_response(make_funding_methods_response())
        result = resource.methods()
        assert isinstance(result, FundingMethodsResponse)
        assert result.items[0].code == "USDT_TRC20"

    def test_calls_correct_endpoint(
        self, resource: FundsResource, transport: MockTransport
    ) -> None:
        transport.set_response(make_funding_methods_response())
        resource.methods()
        assert transport.last_call.method == "GET"
        assert transport.last_call.path == "/funds/methods"


class TestFundsCreateInvoice:
    def test_returns_invoice(self, resource: FundsResource, transport: MockTransport) -> None:
        transport.set_response(make_funding_invoice())
        result = resource.create_invoice(method_code="USDT_TRC20", amount=100.0)
        assert isinstance(result, FundingInvoice)
        assert result.id == "inv-001"

    def test_sends_body(self, resource: FundsResource, transport: MockTransport) -> None:
        transport.set_response(make_funding_invoice())
        resource.create_invoice(method_code="USDT_TRC20", amount=100.0)
        assert transport.last_call.json_body == {"method_code": "USDT_TRC20", "amount": 100.0}


class TestFundsListInvoices:
    def test_returns_invoice_list(
        self, resource: FundsResource, transport: MockTransport
    ) -> None:
        transport.set_response(make_funding_invoice_list())
        result = resource.list_invoices()
        assert isinstance(result, FundingInvoiceList)
        assert result.total == 1


class TestFundsGetInvoice:
    def test_returns_invoice(self, resource: FundsResource, transport: MockTransport) -> None:
        transport.set_response(make_funding_invoice())
        result = resource.get_invoice("inv-001")
        assert isinstance(result, FundingInvoice)
        assert transport.last_call.path == "/funds/invoices/inv-001"


class TestFundsCheckInvoice:
    def test_calls_post(self, resource: FundsResource, transport: MockTransport) -> None:
        transport.set_response(make_funding_invoice())
        resource.check_invoice("inv-001")
        assert transport.last_call.method == "POST"
        assert transport.last_call.path == "/funds/invoices/inv-001/check"


class TestFundsTimeLeft:
    def test_returns_time_left(self, resource: FundsResource, transport: MockTransport) -> None:
        transport.set_response(make_funding_invoice_time_left())
        result = resource.invoice_time_left("inv-001")
        assert isinstance(result, FundingInvoiceTimeLeft)
        assert result.seconds_left == 3200


class TestFundsTonDeposit:
    def test_returns_state(self, resource: FundsResource, transport: MockTransport) -> None:
        transport.set_response(make_ton_deposit_state())
        result = resource.ton_deposit()
        assert isinstance(result, TonDepositState)
        assert result.memo_tag == "123456"


class TestFundsBybit:
    def test_state(self, resource: FundsResource, transport: MockTransport) -> None:
        transport.set_response(make_bybit_state())
        result = resource.bybit_state()
        assert isinstance(result, BybitState)
        assert result.linked is True

    def test_attach(self, resource: FundsResource, transport: MockTransport) -> None:
        transport.set_response(make_bybit_state())
        resource.bybit_attach("uid-123")
        assert transport.last_call.path == "/funds/bybit/attach"
        assert transport.last_call.json_body == {"uid": "uid-123"}

    def test_unlink(self, resource: FundsResource, transport: MockTransport) -> None:
        transport.set_response(make_bybit_state())
        resource.bybit_unlink()
        assert transport.last_call.method == "POST"
        assert transport.last_call.path == "/funds/bybit/unlink"
