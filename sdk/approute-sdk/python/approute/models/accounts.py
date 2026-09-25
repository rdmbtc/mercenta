from datetime import datetime

from approute.models._base import _Base


class AccountActivity(_Base):
    id: str
    currency: str
    amount: float
    operation: str
    created_at: datetime


class Account(_Base):
    currency: str
    balance: float
    available: float
    overdraft_limit: float
    recent_activity: list[AccountActivity] = []


class AccountListResponse(_Base):
    items: list[Account]


class AccountTransaction(_Base):
    id: str
    currency: str
    transaction_id: str
    category: str
    balance: float
    amount: float
    order_id: str
    order_id_raw: str | None = None
    description: str | None = None
    created_at: datetime


class AccountTransactionPage(_Base):
    total_count: int
    items: list[AccountTransaction]
