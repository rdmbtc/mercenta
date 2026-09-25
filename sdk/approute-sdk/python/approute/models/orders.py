from datetime import datetime

from approute.models._base import _Base


class PurchaseFieldInput(_Base):
    key: str
    value: str


class OrderItemInput(_Base):
    denomination_id: str | None = None
    item_id: str | None = None
    quantity: int = 1
    fields: list[PurchaseFieldInput] | None = None
    amount_currency_code: str | None = None
    is_long_order: bool | None = None


class OrderCreateRequest(_Base):
    orders_type: str
    reference_id: str | None = None
    reference: str | None = None
    check_only: bool = False
    orders: list[OrderItemInput] | None = None
    item_id: str | None = None
    product_id: str | None = None
    quantity: int | None = None
    amount: float | None = None
    currency: str | None = None
    client_time: datetime | None = None
    fields: list[PurchaseFieldInput] | None = None
    direct_order: bool | None = None
    account_id: int | None = None


class Voucher(_Base):
    pin: str
    serial_number: str | None = None
    expiration: datetime | None = None


class Esim(_Base):
    matching_id: str
    qr_code_text: str
    smdp_address: str
    iccid: str | None = None


class PurchaseResult(_Base):
    vouchers: list[Voucher] | None = None
    esim: Esim | None = None
    attributes: dict[str, str] | None = None


class PurchaseResponse(_Base):
    transaction_uuid: str | None = None
    order_id: str | None = None
    status: str
    price: float
    currency: str
    result: PurchaseResult | None = None


class DtuCheckResponse(_Base):
    can_recharge: bool | None = None
    price: float | None = None
    currency: str | None = None
    provider_status: str | None = None
    provider_message: str | None = None
    attributes: dict[str, str] | None = None


class TransactionListItem(_Base):
    transaction_uuid: str | None = None
    order_id: str | None = None
    reference: str | None = None
    server_time: datetime | None = None
    client_time: datetime | None = None
    status: str
    product_id: str | None = None
    item_id: str | None = None
    product_name: str | None = None
    item_name: str | None = None
    quantity: int = 1
    amount: float | None = None
    currency: str | None = None
    account_number: str | None = None
    vouchers: list[Voucher] | None = None


class TransactionPage(_Base):
    items: list[TransactionListItem]
    has_next: bool = False


class TransactionListResponse(_Base):
    page: TransactionPage
