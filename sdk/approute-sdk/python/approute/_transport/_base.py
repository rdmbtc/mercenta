from __future__ import annotations

from typing import Any, Protocol

from approute.errors import FieldError, raise_for_code
from approute.errors.base import AppRouteError

_SUCCESS_CODES = {"OK", "ACCEPTED", "IDEMPOTENCY_REPLAY"}

DEFAULT_TIMEOUT = 30.0
DEFAULT_MAX_RETRIES = 3
RETRY_BACKOFF_BASE = 1.0
RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}


class _JsonResponse(Protocol):
    @property
    def status_code(self) -> int: ...
    def json(self) -> Any: ...


def to_camel(name: str) -> str:
    parts = name.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


def to_snake(name: str) -> str:
    result: list[str] = []
    for i, ch in enumerate(name):
        if ch.isupper():
            if i > 0 and not name[i - 1].isupper():
                result.append("_")
            elif (
                i > 0
                and i + 1 < len(name)
                and name[i - 1].isupper()
                and not name[i + 1].isupper()
            ):
                result.append("_")
            result.append(ch.lower())
        else:
            result.append(ch)
    return "".join(result)


def convert_keys_to_camel(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {to_camel(k): convert_keys_to_camel(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [convert_keys_to_camel(i) for i in obj]
    return obj


def convert_keys_to_snake(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {to_snake(k): convert_keys_to_snake(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [convert_keys_to_snake(i) for i in obj]
    return obj


def clean_params(params: dict[str, Any] | None) -> dict[str, Any] | None:
    if params is None:
        return None
    cleaned: dict[str, Any] = {}
    for k, v in params.items():
        if v is None:
            continue
        camel_key = to_camel(k)
        if isinstance(v, bool):
            cleaned[camel_key] = str(v).lower()
        elif isinstance(v, list):
            cleaned[camel_key] = v
        else:
            cleaned[camel_key] = v
    return cleaned or None


def handle_response(resp: _JsonResponse) -> Any:
    try:
        body = resp.json()
    except Exception as exc:
        raise AppRouteError(f"Invalid JSON response (HTTP {resp.status_code})") from exc

    body_snake = convert_keys_to_snake(body)

    code = body_snake.get("code", "")
    message = body_snake.get("message", "")
    trace_id = body_snake.get("trace_id", "")

    if code in _SUCCESS_CODES:
        return body_snake.get("data")

    raw_errors = body_snake.get("errors") or []
    field_errors = [
        FieldError(field=e.get("field", ""), code=e.get("code", ""), message=e.get("message", ""))
        for e in raw_errors
    ]

    raise_for_code(
        code=code,
        message=message,
        trace_id=trace_id,
        status_code=resp.status_code,
        errors=field_errors,
    )
