from __future__ import annotations

from datetime import datetime, timezone

from approute.models import SteamCurrencyRate, SteamCurrencyRatesResponse

_T = datetime(2026, 3, 1, 12, 0, 0, tzinfo=timezone.utc)
_FETCHED = datetime(2026, 3, 1, 12, 1, 0, tzinfo=timezone.utc)


def make_steam_currency_rate(
    *,
    quote_currency_code: str = "RUB",
    rate: str = "92.50",
    provider_created_at: datetime | None = _T,
    fetched_at: datetime | None = _FETCHED,
) -> SteamCurrencyRate:
    return SteamCurrencyRate(
        quote_currency_code=quote_currency_code,
        rate=rate,
        provider_created_at=provider_created_at,
        fetched_at=fetched_at,
    )


def make_steam_currency_rates_response(
    *,
    base_currency_code: str = "USD",
    rates: list[SteamCurrencyRate] | None = None,
) -> SteamCurrencyRatesResponse:
    return SteamCurrencyRatesResponse(
        base_currency_code=base_currency_code,
        items=rates
        if rates is not None
        else [
            make_steam_currency_rate(),
            make_steam_currency_rate(
                quote_currency_code="EUR",
                rate="0.92",
                provider_created_at=None,
                fetched_at=None,
            ),
        ],
    )
