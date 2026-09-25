from __future__ import annotations

import time
from typing import Any

import httpx

from approute._transport._base import (
    DEFAULT_MAX_RETRIES,
    DEFAULT_TIMEOUT,
    RETRY_BACKOFF_BASE,
    RETRYABLE_STATUS_CODES,
    clean_params,
    convert_keys_to_camel,
    handle_response,
)
from approute.errors.base import AppRouteError, NetworkError


class HttpTransport:
    def __init__(
        self,
        base_url: str,
        api_key: str,
        timeout: float = DEFAULT_TIMEOUT,
        max_retries: int = DEFAULT_MAX_RETRIES,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._max_retries = max_retries
        self._client = httpx.Client(
            base_url=self._base_url,
            timeout=timeout,
            headers={
                "X-API-Key": api_key,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
        )

    def close(self) -> None:
        self._client.close()

    def request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        json_body: dict[str, Any] | None = None,
    ) -> Any:
        cleaned_params = clean_params(params)
        camel_body = convert_keys_to_camel(json_body) if json_body else None

        for attempt in range(self._max_retries + 1):
            try:
                resp = self._client.request(
                    method,
                    path,
                    params=cleaned_params,
                    json=camel_body,
                )
            except httpx.TimeoutException as exc:
                raise NetworkError(f"Request timed out: {exc}") from exc
            except httpx.ConnectError as exc:
                raise NetworkError(f"Connection error: {exc}") from exc
            except httpx.HTTPError as exc:
                raise NetworkError(str(exc)) from exc

            if resp.status_code in RETRYABLE_STATUS_CODES and attempt < self._max_retries:
                retry_after = resp.headers.get("Retry-After")
                delay = float(retry_after) if retry_after else RETRY_BACKOFF_BASE * (2**attempt)
                time.sleep(delay)
                continue

            return handle_response(resp)

        raise AppRouteError("Max retries exceeded")
