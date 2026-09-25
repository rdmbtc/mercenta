from __future__ import annotations

from datetime import datetime
from typing import Any

from approute.models import (
    BybitState,
    FundingInvoice,
    FundingInvoiceList,
    FundingInvoiceTimeLeft,
    FundingMethodsResponse,
    TonDepositState,
)
from approute.resources._base import BaseResource


class FundsResource(BaseResource):

    def methods(self) -> FundingMethodsResponse:
        """List available funding methods."""
        data = self._t.request("GET", "/funds/methods")
        return FundingMethodsResponse.model_validate(data)

    def create_invoice(self, *, method_code: str, amount: float) -> FundingInvoice:
        """Create a funding invoice."""
        data = self._t.request(
            "POST",
            "/funds/invoices",
            json_body={"method_code": method_code, "amount": amount},
        )
        return FundingInvoice.model_validate(data)

    def list_invoices(
        self,
        *,
        status: list[str] | None = None,
        method_code: list[str] | None = None,
        search: str | None = None,
        invoice_id: str | None = None,
        created_from: datetime | None = None,
        created_to: datetime | None = None,
        with_tx: bool | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> FundingInvoiceList:
        """List funding invoices."""
        params: dict[str, Any] = {"limit": limit, "offset": offset}
        if status is not None:
            params["status"] = status
        if method_code is not None:
            params["method_code"] = method_code
        if search is not None:
            params["search"] = search
        if invoice_id is not None:
            params["invoice_id"] = invoice_id
        if created_from is not None:
            params["created_from"] = created_from.isoformat()
        if created_to is not None:
            params["created_to"] = created_to.isoformat()
        if with_tx is not None:
            params["with_tx"] = with_tx
        data = self._t.request("GET", "/funds/invoices", params=params)
        return FundingInvoiceList.model_validate(data)

    def get_invoice(self, invoice_id: str) -> FundingInvoice:
        """Get a single funding invoice by ID."""
        data = self._t.request("GET", f"/funds/invoices/{invoice_id}")
        return FundingInvoice.model_validate(data)

    def check_invoice(self, invoice_id: str) -> FundingInvoice:
        """Check (refresh) the status of a funding invoice."""
        data = self._t.request("POST", f"/funds/invoices/{invoice_id}/check")
        return FundingInvoice.model_validate(data)

    def invoice_time_left(self, invoice_id: str) -> FundingInvoiceTimeLeft:
        """Get time left before a funding invoice expires."""
        data = self._t.request("GET", f"/funds/invoices/{invoice_id}/time-left")
        return FundingInvoiceTimeLeft.model_validate(data)

    def ton_deposit(self) -> TonDepositState:
        """Get TON deposit address and memo tag."""
        data = self._t.request("GET", "/funds/ton/deposit")
        return TonDepositState.model_validate(data)

    def bybit_state(self) -> BybitState:
        """Get Bybit UID state."""
        data = self._t.request("GET", "/funds/bybit/state")
        return BybitState.model_validate(data)

    def bybit_attach(self, uid: str) -> BybitState:
        """Attach a Bybit UID."""
        data = self._t.request("POST", "/funds/bybit/attach", json_body={"uid": uid})
        return BybitState.model_validate(data)

    def bybit_unlink(self) -> BybitState:
        """Unlink the attached Bybit UID."""
        data = self._t.request("POST", "/funds/bybit/unlink")
        return BybitState.model_validate(data)
