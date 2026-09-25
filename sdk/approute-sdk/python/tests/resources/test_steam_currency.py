from __future__ import annotations

import pytest

from approute.models import SteamCurrencyRatesResponse
from approute.resources.steam_currency import SteamCurrencyResource
from tests.conftest import MockTransport
from tests.factories import make_steam_currency_rates_response


@pytest.fixture
def resource(transport: MockTransport) -> SteamCurrencyResource:
    return SteamCurrencyResource(transport)  # type: ignore[arg-type]


class TestSteamCurrencyRates:
    def test_returns_rates(
        self, resource: SteamCurrencyResource, transport: MockTransport
    ) -> None:
        transport.set_response(make_steam_currency_rates_response())
        result = resource.rates()
        assert isinstance(result, SteamCurrencyRatesResponse)
        assert result.base_currency_code == "USD"
        assert len(result.items) == 2

    def test_passes_quotes_param(
        self, resource: SteamCurrencyResource, transport: MockTransport
    ) -> None:
        transport.set_response(make_steam_currency_rates_response())
        resource.rates(quotes=["RUB", "EUR"])
        assert transport.last_call.params == {"quotes": ["RUB", "EUR"]}

    def test_no_quotes_sends_no_params(
        self, resource: SteamCurrencyResource, transport: MockTransport
    ) -> None:
        transport.set_response(make_steam_currency_rates_response())
        resource.rates()
        assert transport.last_call.params is None
