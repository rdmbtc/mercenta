from __future__ import annotations

from datetime import datetime, timezone

from approute.models import (
    BybitState,
    FundingInvoice,
    FundingInvoiceList,
    FundingInvoiceTimeLeft,
    FundingMethod,
    FundingMethodsResponse,
    TonDepositState,
)

_CREATED = datetime(2026, 3, 1, 12, 0, 0, tzinfo=timezone.utc)
_EXPIRES = datetime(2026, 3, 1, 13, 0, 0, tzinfo=timezone.utc)


def make_funding_method(
    *,
    code: str = "USDT_TRC20",
    name: str = "USDT (TRC-20)",
    min_amount: float = 10.0,
    commission: float = 0.0,
    address: str = "TXyz123abc",
    ttl_minutes: int = 60,
    confirmations_required: int = 20,
) -> FundingMethod:
    return FundingMethod(
        code=code,
        name=name,
        min_amount=min_amount,
        commission=commission,
        address=address,
        ttl_minutes=ttl_minutes,
        confirmations_required=confirmations_required,
    )


def make_funding_methods_response(
    *,
    methods: list[FundingMethod] | None = None,
) -> FundingMethodsResponse:
    return FundingMethodsResponse(
        items=methods if methods is not None else [make_funding_method()],
    )


def make_funding_invoice(
    *,
    id: str = "inv-001",
    method_code: str = "USDT_TRC20",
    amount_expected: float = 100.0,
    commission: float = 0.0,
    credited: float = 0.0,
    address: str = "TXyz123abc",
    status: str = "pending",
    confirmations_required: int = 20,
    confirmations: int = 0,
    created_at: datetime = _CREATED,
    expires_at: datetime = _EXPIRES,
) -> FundingInvoice:
    return FundingInvoice(
        id=id,
        method_code=method_code,
        amount_expected=amount_expected,
        commission=commission,
        credited=credited,
        address=address,
        status=status,
        confirmations_required=confirmations_required,
        confirmations=confirmations,
        created_at=created_at,
        expires_at=expires_at,
    )


def make_funding_invoice_list(
    *,
    invoices: list[FundingInvoice] | None = None,
    total: int = 1,
) -> FundingInvoiceList:
    return FundingInvoiceList(
        items=invoices if invoices is not None else [make_funding_invoice()],
        total=total,
    )


def make_funding_invoice_time_left(
    *,
    invoice_id: str = "inv-001",
    expires_at: datetime = _EXPIRES,
    seconds_left: int = 3200,
    expired: bool = False,
) -> FundingInvoiceTimeLeft:
    return FundingInvoiceTimeLeft(
        invoice_id=invoice_id,
        expires_at=expires_at,
        seconds_left=seconds_left,
        expired=expired,
    )


def make_ton_deposit_state(
    *,
    address: str = "EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF78p7Av",
    memo_tag: str = "123456",
) -> TonDepositState:
    return TonDepositState(address=address, memo_tag=memo_tag)


def make_bybit_state(
    *,
    recipient_uid: str = "bybit-uid-001",
    linked: bool = True,
    your_uid: str | None = "bybit-uid-002",
) -> BybitState:
    return BybitState(recipient_uid=recipient_uid, linked=linked, your_uid=your_uid)
