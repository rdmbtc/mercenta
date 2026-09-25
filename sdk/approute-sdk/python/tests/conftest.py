from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import pytest
from pydantic import BaseModel


@dataclass(frozen=True)
class Call:
    """A single recorded transport call."""

    method: str
    path: str
    params: dict[str, Any] | None = None
    json_body: dict[str, Any] | None = None


@dataclass
class MockTransport:
    """Records every call made through resource methods and returns a preset response.

    Usage::

        transport = MockTransport()
        transport.set_response(make_product_list_response())
        resource = ServicesResource(transport)
        result = resource.list()
        assert transport.last_call.method == "GET"
    """

    calls: list[Call] = field(default_factory=list)
    _response: Any = None

    def set_response(self, data: BaseModel | dict[str, Any]) -> None:
        """Accept a Pydantic model (auto-dumps) or a raw dict."""
        self._response = data.model_dump() if isinstance(data, BaseModel) else data

    def request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        json_body: dict[str, Any] | None = None,
    ) -> Any:
        self.calls.append(Call(method=method, path=path, params=params, json_body=json_body))
        return self._response

    @property
    def last_call(self) -> Call:
        assert self.calls, "No calls recorded"
        return self.calls[-1]


@pytest.fixture
def transport() -> MockTransport:
    return MockTransport()
