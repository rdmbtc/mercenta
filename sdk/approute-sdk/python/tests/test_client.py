from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from approute import AppRouteClient, AsyncAppRouteClient, __version__
from approute._constants import DEFAULT_BASE_URL
from approute.resources.accounts import AccountsResource
from approute.resources.funds import FundsResource
from approute.resources.orders import OrdersResource
from approute.resources.services import ServicesResource
from approute.resources.steam_currency import SteamCurrencyResource


class TestAppRouteClient:
    def test_version(self) -> None:
        assert __version__ == "1.1.0"

    def test_constructor_creates_resources(self) -> None:
        with patch("approute.client.HttpTransport") as mock_cls:
            client = AppRouteClient(api_key="sk_test_123")
            mock_cls.assert_called_once_with(
                base_url=DEFAULT_BASE_URL,
                api_key="sk_test_123",
                timeout=30.0,
                max_retries=3,
            )
            assert isinstance(client.services, ServicesResource)
            assert isinstance(client.orders, OrdersResource)
            assert isinstance(client.accounts, AccountsResource)
            assert isinstance(client.funds, FundsResource)
            assert isinstance(client.steam_currency, SteamCurrencyResource)

    def test_custom_base_url(self) -> None:
        with patch("approute.client.HttpTransport") as mock_cls:
            AppRouteClient(
                api_key="sk_test_123",
                base_url="https://custom.api.io/v2",
                timeout=60.0,
                max_retries=5,
            )
            mock_cls.assert_called_once_with(
                base_url="https://custom.api.io/v2",
                api_key="sk_test_123",
                timeout=60.0,
                max_retries=5,
            )

    def test_context_manager(self) -> None:
        with patch("approute.client.HttpTransport") as mock_cls:
            mock_transport = MagicMock()
            mock_cls.return_value = mock_transport

            with AppRouteClient(api_key="sk_test_123") as client:
                assert client is not None
            mock_transport.close.assert_called_once()

    def test_close(self) -> None:
        with patch("approute.client.HttpTransport") as mock_cls:
            mock_transport = MagicMock()
            mock_cls.return_value = mock_transport

            client = AppRouteClient(api_key="sk_test_123")
            client.close()
            mock_transport.close.assert_called_once()


class TestAsyncAppRouteClient:
    def test_constructor_creates_resources(self) -> None:
        with patch("approute.async_client.AsyncHttpTransport") as mock_cls:
            client = AsyncAppRouteClient(api_key="sk_test_123")
            mock_cls.assert_called_once_with(
                base_url=DEFAULT_BASE_URL,
                api_key="sk_test_123",
                timeout=30.0,
                max_retries=3,
            )
            assert isinstance(client.services, ServicesResource)
            assert isinstance(client.orders, OrdersResource)
            assert isinstance(client.accounts, AccountsResource)
            assert isinstance(client.funds, FundsResource)
            assert isinstance(client.steam_currency, SteamCurrencyResource)

    @pytest.mark.asyncio
    async def test_async_context_manager(self) -> None:
        with patch("approute.async_client.AsyncHttpTransport") as mock_cls:
            mock_transport = AsyncMock()
            mock_cls.return_value = mock_transport

            async with AsyncAppRouteClient(api_key="sk_test_123") as client:
                assert client is not None
            mock_transport.close.assert_awaited_once()
