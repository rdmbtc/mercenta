from __future__ import annotations

from datetime import datetime
from typing import Any

from approute.models import (
    DtuCheckResponse,
    PurchaseResponse,
    TransactionListResponse,
)
from approute.resources._base import BaseResource


class OrdersResource(BaseResource):

    def create(
        self,
        *,
        orders_type: str = "shop",
        reference_id: str | None = None,
        reference: str | None = None,
        orders: list[dict[str, Any]] | None = None,
        item_id: str | None = None,
        product_id: str | None = None,
        quantity: int | None = None,
        amount: float | None = None,
        currency: str | None = None,
        client_time: datetime | None = None,
        fields: list[dict[str, str]] | None = None,
        direct_order: bool | None = None,
        account_id: int | None = None,
    ) -> PurchaseResponse:
        """Create a purchase order (shop or DTU)."""
        body: dict[str, Any] = {"orders_type": orders_type}
        if reference_id is not None:
            body["reference_id"] = reference_id
        if reference is not None:
            body["reference"] = reference
        if orders is not None:
            body["orders"] = orders
        if item_id is not None:
            body["item_id"] = item_id
        if product_id is not None:
            body["product_id"] = product_id
        if quantity is not None:
            body["quantity"] = quantity
        if amount is not None:
            body["amount"] = amount
        if currency is not None:
            body["currency"] = currency
        if client_time is not None:
            body["client_time"] = client_time.isoformat()
        if fields is not None:
            body["fields"] = fields
        if direct_order is not None:
            body["direct_order"] = direct_order
        if account_id is not None:
            body["account_id"] = account_id
        data = self._t.request("POST", "/orders", json_body=body)
        return PurchaseResponse.model_validate(data)

    def check_dtu(
        self,
        *,
        item_id: str,
        fields: list[dict[str, str]] | None = None,
        amount: float | None = None,
        currency: str | None = None,
    ) -> DtuCheckResponse:
        """Validate a DTU order without creating it (checkOnly=true)."""
        body: dict[str, Any] = {
            "orders_type": "dtu",
            "check_only": True,
            "item_id": item_id,
        }
        if fields is not None:
            body["fields"] = fields
        if amount is not None:
            body["amount"] = amount
        if currency is not None:
            body["currency"] = currency
        data = self._t.request("POST", "/orders", json_body=body)
        return DtuCheckResponse.model_validate(data)

    def list(
        self,
        *,
        limit: int = 50,
        offset: int = 0,
        order_id: str | None = None,
        reference_id: str | None = None,
        unhide: bool | None = None,
    ) -> TransactionListResponse:
        """List orders with pagination."""
        params: dict[str, Any] = {"limit": limit, "offset": offset}
        if order_id is not None:
            params["order_id"] = order_id
        if reference_id is not None:
            params["reference_id"] = reference_id
        if unhide is not None:
            params["unhide"] = unhide
        data = self._t.request("GET", "/orders", params=params)
        return TransactionListResponse.model_validate(data)
