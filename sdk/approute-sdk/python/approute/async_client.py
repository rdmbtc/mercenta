from __future__ import annotations

from approute._constants import DEFAULT_BASE_URL
from approute._transport import AsyncHttpTransport
from approute.resources.accounts import AccountsResource
from approute.resources.funds import FundsResource
from approute.resources.orders import OrdersResource
from approute.resources.services import ServicesResource
from approute.resources.steam_currency import SteamCurrencyResource


class AsyncAppRouteClient:
    """Async client for AppRoute Public API.

    Usage::

        async with AsyncAppRouteClient(api_key="sk_live_...") as client:
            products = await client.services.list()
    """

    def __init__(
        self,
        api_key: str,
        *,
        base_url: str = DEFAULT_BASE_URL,
        timeout: float = 30.0,
        max_retries: int = 3,
    ) -> None:
        self._transport = AsyncHttpTransport(
            base_url=base_url,
            api_key=api_key,
            timeout=timeout,
            max_retries=max_retries,
        )
        self.services = ServicesResource(self._transport)
        self.orders = OrdersResource(self._transport)
        self.accounts = AccountsResource(self._transport)
        self.funds = FundsResource(self._transport)
        self.steam_currency = SteamCurrencyResource(self._transport)

    async def close(self) -> None:
        await self._transport.close()

    async def __aenter__(self) -> AsyncAppRouteClient:
        return self

    async def __aexit__(self, *args: object) -> None:
        await self.close()
