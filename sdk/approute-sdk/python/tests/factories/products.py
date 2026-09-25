from __future__ import annotations

from approute.models import (
    ItemLookupRequestItem,
    ItemLookupResponse,
    ItemLookupRow,
    Product,
    ProductField,
    ProductFieldValidation,
    ProductItem,
    ProductListResponse,
    ProductStockItem,
    ProductStockResponse,
)


def make_product_item(
    *,
    id: str = "item-001",
    name: str = "50 USD",
    nominal: float = 50.0,
    price: float = 48.5,
    currency: str = "USD",
    available: bool = True,
    stock: int = 150,
) -> ProductItem:
    return ProductItem(
        id=id,
        name=name,
        nominal=nominal,
        price=price,
        currency=currency,
        available=available,
        stock=stock,
    )


def make_product_field(
    *,
    key: str = "email",
    type: str = "text",
    required: bool = True,
    label: str = "Email",
    pattern: str = "^[^@]+@[^@]+$",
    validation_message: str = "Invalid email",
) -> ProductField:
    return ProductField(
        key=key,
        type=type,
        required=required,
        label=label,
        validation=ProductFieldValidation(pattern=pattern, message=validation_message),
    )


def make_product(
    *,
    id: str = "prod-001",
    name: str = "Steam Wallet 50 USD",
    type: str = "voucher",
    country_code: str = "US",
    category_name: str = "Gaming",
    subcategory_name: str = "Steam",
    items: list[ProductItem] | None = None,
    fields: list[ProductField] | None = None,
) -> Product:
    return Product(
        id=id,
        name=name,
        type=type,
        country_code=country_code,
        category_name=category_name,
        subcategory_name=subcategory_name,
        items=items if items is not None else [make_product_item()],
        fields=fields,
    )


def make_product_list_response(
    *,
    products: list[Product] | None = None,
    has_next: bool = False,
) -> ProductListResponse:
    return ProductListResponse(
        items=products if products is not None else [make_product(fields=[make_product_field()])],
        has_next=has_next,
    )


def make_product_stock_item(
    *,
    item_id: str = "item-001",
    stock: int | None = 150,
) -> ProductStockItem:
    return ProductStockItem(item_id=item_id, stock=stock)


def make_product_stock_response(
    *,
    product_id: str = "prod-001",
    items: list[ProductStockItem] | None = None,
) -> ProductStockResponse:
    return ProductStockResponse(
        product_id=product_id,
        items=items
        if items is not None
        else [make_product_stock_item(), make_product_stock_item(item_id="item-002", stock=None)],
    )


def make_item_lookup_request_item(
    *,
    service_id: str = "svc-001",
    item_id: str = "item-001",
) -> ItemLookupRequestItem:
    return ItemLookupRequestItem(service_id=service_id, item_id=item_id)


def make_item_lookup_row(
    *,
    service_id: str = "svc-001",
    item_id: str = "item-001",
    found: bool = True,
    item: ProductItem | None = None,
    error: str | None = None,
) -> ItemLookupRow:
    if found and item is None:
        item = make_product_item(id=item_id)
    return ItemLookupRow(
        service_id=service_id,
        item_id=item_id,
        found=found,
        item=item,
        error=error,
    )


def make_item_lookup_response(
    *,
    rows: list[ItemLookupRow] | None = None,
) -> ItemLookupResponse:
    """Default fixture builds a mixed 3-row response: one hit,
    one ``service_not_found``, one ``item_not_found`` — the same shape
    the backend returns for partial misses.
    """
    if rows is None:
        rows = [
            make_item_lookup_row(),
            make_item_lookup_row(
                service_id="svc-missing",
                item_id="item-001",
                found=False,
                item=None,
                error="service_not_found",
            ),
            make_item_lookup_row(
                service_id="svc-001",
                item_id="item-missing",
                found=False,
                item=None,
                error="item_not_found",
            ),
        ]
    return ItemLookupResponse(items=rows)
