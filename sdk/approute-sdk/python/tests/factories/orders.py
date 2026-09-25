from __future__ import annotations

from datetime import datetime, timezone

from approute.models import (
    DtuCheckResponse,
    PurchaseResponse,
    PurchaseResult,
    TransactionListItem,
    TransactionListResponse,
    TransactionPage,
    Voucher,
)

_T = datetime(2026, 3, 1, 12, 0, 0, tzinfo=timezone.utc)
_EXPIRATION = datetime(2027, 12, 31, 23, 59, 59, tzinfo=timezone.utc)


def make_voucher(
    *,
    pin: str = "XXXX-YYYY-ZZZZ",
    serial_number: str = "SN-12345",
    expiration: datetime = _EXPIRATION,
) -> Voucher:
    return Voucher(pin=pin, serial_number=serial_number, expiration=expiration)


def make_purchase_response(
    *,
    transaction_uuid: str = "txn-abc-123",
    order_id: str = "ord-456",
    status: str = "completed",
    price: float = 48.5,
    currency: str = "USD",
    vouchers: list[Voucher] | None = None,
) -> PurchaseResponse:
    return PurchaseResponse(
        transaction_uuid=transaction_uuid,
        order_id=order_id,
        status=status,
        price=price,
        currency=currency,
        result=PurchaseResult(
            vouchers=vouchers if vouchers is not None else [make_voucher()],
        ),
    )


def make_dtu_check_response(
    *,
    can_recharge: bool = True,
    price: float = 10.0,
    currency: str = "USD",
    provider_status: str = "available",
    attributes: dict[str, str] | None = None,
) -> DtuCheckResponse:
    return DtuCheckResponse(
        can_recharge=can_recharge,
        price=price,
        currency=currency,
        provider_status=provider_status,
        attributes=attributes if attributes is not None else {"operator_name": "T-Mobile"},
    )


def make_transaction_list_item(
    *,
    transaction_uuid: str = "txn-abc-123",
    order_id: str = "ord-456",
    reference: str = "ref-001",
    status: str = "completed",
    product_id: str = "prod-001",
    item_id: str = "item-001",
    product_name: str = "Steam Wallet 50 USD",
    item_name: str = "50 USD",
    quantity: int = 1,
    amount: float = 48.5,
    currency: str = "USD",
    server_time: datetime = _T,
) -> TransactionListItem:
    return TransactionListItem(
        transaction_uuid=transaction_uuid,
        order_id=order_id,
        reference=reference,
        status=status,
        product_id=product_id,
        item_id=item_id,
        product_name=product_name,
        item_name=item_name,
        quantity=quantity,
        amount=amount,
        currency=currency,
        server_time=server_time,
    )


def make_transaction_list_response(
    *,
    items: list[TransactionListItem] | None = None,
    has_next: bool = False,
) -> TransactionListResponse:
    return TransactionListResponse(
        page=TransactionPage(
            items=items if items is not None else [make_transaction_list_item()],
            has_next=has_next,
        ),
    )
