from __future__ import annotations

from datetime import datetime, timezone

from approute.models import (
    Account,
    AccountActivity,
    AccountListResponse,
    AccountTransaction,
    AccountTransactionPage,
)

_T = datetime(2026, 3, 1, 12, 0, 0, tzinfo=timezone.utc)


def make_account_activity(
    *,
    id: str = "act-001",
    currency: str = "USD",
    amount: float = -48.5,
    operation: str = "purchase",
    created_at: datetime = _T,
) -> AccountActivity:
    return AccountActivity(
        id=id,
        currency=currency,
        amount=amount,
        operation=operation,
        created_at=created_at,
    )


def make_account(
    *,
    currency: str = "USD",
    balance: float = 1250.50,
    available: float = 1200.00,
    overdraft_limit: float = 0.0,
    recent_activity: list[AccountActivity] | None = None,
) -> Account:
    return Account(
        currency=currency,
        balance=balance,
        available=available,
        overdraft_limit=overdraft_limit,
        recent_activity=recent_activity
        if recent_activity is not None
        else [make_account_activity()],
    )


def make_account_list_response(
    *,
    accounts: list[Account] | None = None,
) -> AccountListResponse:
    return AccountListResponse(
        items=accounts if accounts is not None else [make_account()],
    )


def make_account_transaction(
    *,
    id: str = "tx-001",
    currency: str = "USD",
    transaction_id: str = "txn-abc-123",
    category: str = "shop",
    balance: float = 1250.50,
    amount: float = -48.5,
    order_id: str = "ord-456",
    description: str = "Steam Wallet 50 USD",
    created_at: datetime = _T,
) -> AccountTransaction:
    return AccountTransaction(
        id=id,
        currency=currency,
        transaction_id=transaction_id,
        category=category,
        balance=balance,
        amount=amount,
        order_id=order_id,
        description=description,
        created_at=created_at,
    )


def make_account_transaction_page(
    *,
    total_count: int = 1,
    items: list[AccountTransaction] | None = None,
) -> AccountTransactionPage:
    return AccountTransactionPage(
        total_count=total_count,
        items=items if items is not None else [make_account_transaction()],
    )
