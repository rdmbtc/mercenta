from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from approute._transport import AsyncHttpTransport, HttpTransport

    Transport = HttpTransport | AsyncHttpTransport


class BaseResource:
    def __init__(self, transport: Transport) -> None:
        self._t = transport
