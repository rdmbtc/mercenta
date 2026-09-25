from datetime import datetime

from approute.models._base import _Base


class SteamCurrencyRate(_Base):
    quote_currency_code: str
    rate: str
    provider_created_at: datetime | None = None
    fetched_at: datetime | None = None


class SteamCurrencyRatesResponse(_Base):
    base_currency_code: str
    items: list[SteamCurrencyRate]
