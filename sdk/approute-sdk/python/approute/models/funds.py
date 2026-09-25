from datetime import datetime

from approute.models._base import _Base


class FundingMethod(_Base):
    code: str
    name: str
    min_amount: float
    commission: float
    address: str
    ttl_minutes: int
    confirmations_required: int


class FundingMethodsResponse(_Base):
    items: list[FundingMethod]


class FundingInvoice(_Base):
    id: str
    method_code: str
    amount_expected: float
    commission: float
    credited: float
    memo_tag: str | None = None
    address: str
    tx_hash: str | None = None
    status: str
    confirmations_required: int | None = None
    confirmations: int | None = None
    created_at: datetime
    expires_at: datetime
    direction: str = "incoming"


class FundingInvoiceList(_Base):
    items: list[FundingInvoice]
    total: int


class FundingInvoiceCreateRequest(_Base):
    method_code: str
    amount: float


class FundingInvoiceTimeLeft(_Base):
    invoice_id: str
    expires_at: datetime
    seconds_left: int
    expired: bool


class TonDepositState(_Base):
    address: str
    memo_tag: str


class BybitState(_Base):
    recipient_uid: str
    linked: bool
    your_uid: str | None = None


class BybitAttachRequest(_Base):
    uid: str
