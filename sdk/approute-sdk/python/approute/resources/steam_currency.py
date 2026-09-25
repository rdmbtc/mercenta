from __future__ import annotations

from approute.models import SteamCurrencyRatesResponse
from approute.resources._base import BaseResource


class SteamCurrencyResource(BaseResource):

    def rates(self, *, quotes: list[str] | None = None) -> SteamCurrencyRatesResponse:
        """Get Steam currency exchange rates."""
        params = {"quotes": quotes} if quotes else None
        data = self._t.request("GET", "/steam-currency/rates", params=params)
        return SteamCurrencyRatesResponse.model_validate(data)
