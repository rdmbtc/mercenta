from __future__ import annotations

from datetime import datetime
from typing import Any

from approute.models import AccountListResponse, AccountTransactionPage
from approute.resources._base import BaseResource


class AccountsResource(BaseResource):

    def balances(self) -> AccountListResponse:
        """List account balances."""
        data = self._t.request("GET", "/accounts")
        return AccountListResponse.model_validate(data)

    def transactions(
        self,
        *,
        currency: str | None = None,
        category: list[str] | None = None,
        search: str | None = None,
        transaction_id: str | None = None,
        order_id: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> AccountTransactionPage:
        """List balance transactions with filtering."""
        params: dict[str, Any] = {"limit": limit, "offset": offset}
        if currency is not None:
            params["currency"] = currency
        if category is not None:
            params["category"] = category
        if search is not None:
            params["search"] = search
        if transaction_id is not None:
            params["transaction_id"] = transaction_id
        if order_id is not None:
            params["order_id"] = order_id
        if date_from is not None:
            params["date_from"] = date_from.isoformat()
        if date_to is not None:
            params["date_to"] = date_to.isoformat()
        data = self._t.request("GET", "/accounts/transactions", params=params)
        return AccountTransactionPage.model_validate(data)
