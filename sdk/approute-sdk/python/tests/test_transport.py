from __future__ import annotations

from typing import Any
from unittest.mock import MagicMock

import pytest

from approute._transport._base import (
    clean_params,
    convert_keys_to_camel,
    convert_keys_to_snake,
    handle_response,
    to_camel,
    to_snake,
)
from approute.errors import NotFoundError, ValidationError
from approute.errors.base import AppRouteError


class TestToCamel:
    def test_single_word(self) -> None:
        assert to_camel("name") == "name"

    def test_two_words(self) -> None:
        assert to_camel("first_name") == "firstName"

    def test_three_words(self) -> None:
        assert to_camel("created_at_utc") == "createdAtUtc"

    def test_empty_string(self) -> None:
        assert to_camel("") == ""

    def test_already_camel(self) -> None:
        assert to_camel("firstName") == "firstName"


class TestToSnake:
    def test_single_word(self) -> None:
        assert to_snake("name") == "name"

    def test_camel_case(self) -> None:
        assert to_snake("firstName") == "first_name"

    def test_consecutive_caps(self) -> None:
        assert to_snake("traceID") == "trace_id"

    def test_all_lower(self) -> None:
        assert to_snake("already") == "already"

    def test_complex(self) -> None:
        assert to_snake("quoteCurrencyCode") == "quote_currency_code"


class TestConvertKeys:
    def test_to_camel_dict(self) -> None:
        result = convert_keys_to_camel({"first_name": "John", "last_name": "Doe"})
        assert result == {"firstName": "John", "lastName": "Doe"}

    def test_to_camel_nested(self) -> None:
        result = convert_keys_to_camel({"user_info": {"first_name": "John"}})
        assert result == {"userInfo": {"firstName": "John"}}

    def test_to_camel_list(self) -> None:
        result = convert_keys_to_camel([{"item_id": "1"}, {"item_id": "2"}])
        assert result == [{"itemId": "1"}, {"itemId": "2"}]

    def test_to_snake_dict(self) -> None:
        result = convert_keys_to_snake({"firstName": "John", "lastName": "Doe"})
        assert result == {"first_name": "John", "last_name": "Doe"}

    def test_to_snake_nested(self) -> None:
        result = convert_keys_to_snake({"userInfo": {"firstName": "John"}})
        assert result == {"user_info": {"first_name": "John"}}

    def test_scalar_passthrough(self) -> None:
        assert convert_keys_to_camel("hello") == "hello"
        assert convert_keys_to_snake(42) == 42


class TestCleanParams:
    def test_none_returns_none(self) -> None:
        assert clean_params(None) is None

    def test_removes_none_values(self) -> None:
        result = clean_params({"limit": 50, "offset": None})
        assert result == {"limit": 50}

    def test_converts_keys_to_camel(self) -> None:
        result = clean_params({"order_id": "abc"})
        assert result == {"orderId": "abc"}

    def test_booleans_to_lowercase_string(self) -> None:
        result = clean_params({"with_tx": True})
        assert result == {"withTx": "true"}

    def test_empty_after_clean_returns_none(self) -> None:
        result = clean_params({"field": None})
        assert result is None

    def test_list_values_preserved(self) -> None:
        result = clean_params({"category": ["shop", "funding"]})
        assert result == {"category": ["shop", "funding"]}


class TestHandleResponse:
    def _mock_resp(self, status_code: int, body: dict[str, Any]) -> MagicMock:
        resp = MagicMock()
        resp.status_code = status_code
        resp.json.return_value = body
        return resp

    def test_success_returns_data(self) -> None:
        resp = self._mock_resp(200, {
            "status": "ok",
            "code": "OK",
            "message": "Success",
            "traceId": "t-1",
            "data": {"items": []},
        })
        result = handle_response(resp)
        assert result == {"items": []}

    def test_accepted_returns_data(self) -> None:
        resp = self._mock_resp(202, {
            "status": "ok",
            "code": "ACCEPTED",
            "message": "Accepted",
            "traceId": "t-2",
            "data": {"id": "123"},
        })
        result = handle_response(resp)
        assert result == {"id": "123"}

    def test_idempotency_replay(self) -> None:
        resp = self._mock_resp(200, {
            "status": "ok",
            "code": "IDEMPOTENCY_REPLAY",
            "message": "Replayed",
            "traceId": "t-3",
            "data": {"cached": True},
        })
        result = handle_response(resp)
        assert result == {"cached": True}

    def test_not_found_raises(self) -> None:
        resp = self._mock_resp(404, {
            "status": "cancelled",
            "code": "NOT_FOUND",
            "message": "Not found",
            "traceId": "t-4",
        })
        with pytest.raises(NotFoundError) as exc_info:
            handle_response(resp)
        assert exc_info.value.code == "NOT_FOUND"
        assert exc_info.value.trace_id == "t-4"
        assert exc_info.value.status_code == 404

    def test_validation_error_with_field_errors(self) -> None:
        resp = self._mock_resp(422, {
            "status": "cancelled",
            "code": "VALIDATION_ERROR",
            "message": "Validation failed",
            "traceId": "t-5",
            "errors": [
                {"field": "email", "code": "INVALID_FORMAT", "message": "Bad email"},
            ],
        })
        with pytest.raises(ValidationError) as exc_info:
            handle_response(resp)
        assert len(exc_info.value.errors) == 1
        assert exc_info.value.errors[0].field == "email"

    def test_invalid_json_raises(self) -> None:
        resp = MagicMock()
        resp.status_code = 200
        resp.json.side_effect = ValueError("bad json")
        with pytest.raises(AppRouteError, match="Invalid JSON"):
            handle_response(resp)
