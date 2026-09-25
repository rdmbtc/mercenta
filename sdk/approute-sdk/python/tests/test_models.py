from __future__ import annotations

from tests.factories import (
    make_account,
    make_account_list_response,
    make_account_transaction_page,
    make_bybit_state,
    make_dtu_check_response,
    make_funding_invoice,
    make_funding_invoice_list,
    make_funding_invoice_time_left,
    make_funding_methods_response,
    make_product,
    make_product_field,
    make_product_item,
    make_product_list_response,
    make_product_stock_response,
    make_purchase_response,
    make_steam_currency_rate,
    make_steam_currency_rates_response,
    make_ton_deposit_state,
    make_transaction_list_response,
    make_voucher,
)


class TestProductModels:
    def test_product_list_response(self) -> None:
        result = make_product_list_response()
        assert len(result.items) == 1
        assert result.items[0].id == "prod-001"
        assert result.items[0].name == "Steam Wallet 50 USD"
        assert result.items[0].type == "voucher"
        assert result.has_next is False

    def test_product_item_fields(self) -> None:
        item = make_product_item(price=99.0, currency="EUR")
        assert item.price == 99.0
        assert item.currency == "EUR"
        assert item.stock == 150

    def test_product_with_fields(self) -> None:
        product = make_product(fields=[make_product_field()])
        assert product.fields is not None
        assert product.fields[0].key == "email"
        assert product.fields[0].required is True
        assert product.fields[0].validation is not None
        assert product.fields[0].validation.pattern == "^[^@]+@[^@]+$"

    def test_product_country_code(self) -> None:
        product = make_product(country_code="DE")
        assert product.country_code == "DE"

    def test_stock_response(self) -> None:
        stock = make_product_stock_response()
        assert stock.product_id == "prod-001"
        assert len(stock.items) == 2
        assert stock.items[0].stock == 150
        assert stock.items[1].stock is None


class TestOrderModels:
    def test_purchase_response(self) -> None:
        resp = make_purchase_response()
        assert resp.transaction_uuid == "txn-abc-123"
        assert resp.status == "completed"
        assert resp.price == 48.5
        assert resp.result is not None
        assert resp.result.vouchers is not None
        assert resp.result.vouchers[0].pin == "XXXX-YYYY-ZZZZ"

    def test_voucher_overrides(self) -> None:
        v = make_voucher(pin="CUSTOM-PIN")
        assert v.pin == "CUSTOM-PIN"
        assert v.serial_number == "SN-12345"

    def test_dtu_check_response(self) -> None:
        resp = make_dtu_check_response()
        assert resp.can_recharge is True
        assert resp.price == 10.0
        assert resp.attributes == {"operator_name": "T-Mobile"}

    def test_transaction_list_response(self) -> None:
        resp = make_transaction_list_response()
        assert len(resp.page.items) == 1
        assert resp.page.items[0].status == "completed"
        assert resp.page.has_next is False


class TestAccountModels:
    def test_balances(self) -> None:
        resp = make_account_list_response()
        assert len(resp.items) == 1
        assert resp.items[0].currency == "USD"
        assert resp.items[0].balance == 1250.50
        assert len(resp.items[0].recent_activity) == 1

    def test_account_with_custom_balance(self) -> None:
        acct = make_account(balance=0.0, available=0.0)
        assert acct.balance == 0.0

    def test_transactions(self) -> None:
        page = make_account_transaction_page()
        assert page.total_count == 1
        assert page.items[0].category == "shop"


class TestFundsModels:
    def test_methods(self) -> None:
        resp = make_funding_methods_response()
        assert len(resp.items) == 1
        assert resp.items[0].code == "USDT_TRC20"

    def test_invoice(self) -> None:
        inv = make_funding_invoice()
        assert inv.id == "inv-001"
        assert inv.status == "pending"
        assert inv.amount_expected == 100.0

    def test_invoice_list(self) -> None:
        lst = make_funding_invoice_list()
        assert lst.total == 1

    def test_time_left(self) -> None:
        tl = make_funding_invoice_time_left()
        assert tl.seconds_left == 3200
        assert tl.expired is False

    def test_ton_deposit(self) -> None:
        state = make_ton_deposit_state()
        assert state.memo_tag == "123456"

    def test_bybit_state(self) -> None:
        state = make_bybit_state()
        assert state.linked is True
        assert state.your_uid == "bybit-uid-002"


class TestSteamCurrencyModels:
    def test_rates(self) -> None:
        resp = make_steam_currency_rates_response()
        assert resp.base_currency_code == "USD"
        assert len(resp.items) == 2
        assert resp.items[0].rate == "92.50"
        assert resp.items[1].fetched_at is None

    def test_custom_rate(self) -> None:
        rate = make_steam_currency_rate(quote_currency_code="KZT", rate="450.00")
        assert rate.quote_currency_code == "KZT"
        assert rate.rate == "450.00"
