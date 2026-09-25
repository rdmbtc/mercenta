from approute.models._base import _Base


class ProductFieldOption(_Base):
    label: str
    value: str
    price: float | None = None


class ProductFieldValidation(_Base):
    min: float | None = None
    max: float | None = None
    pattern: str | None = None
    message: str | None = None


class ProductField(_Base):
    key: str
    type: str
    required: bool
    label: str | None = None
    options: list[ProductFieldOption] | None = None
    validation: ProductFieldValidation | None = None


class ProductItem(_Base):
    id: str
    name: str | None = None
    nominal: float | None = None
    price: float
    currency: str
    available: bool | None = None
    stock: int | None = None
    is_long_order: bool | None = None
    min_qty_to_long_order: int | None = None


class Product(_Base):
    id: str
    name: str | None = None
    type: str
    image_url: str | None = None
    country_code: str | None = None
    category_name: str | None = None
    subcategory_name: str | None = None
    items: list[ProductItem] = []
    fields: list[ProductField] | None = None


class ProductListResponse(_Base):
    items: list[Product]
    has_next: bool = False


class ProductStockItem(_Base):
    item_id: str
    stock: int | None = None


class ProductStockResponse(_Base):
    product_id: str
    items: list[ProductStockItem]


# ---------------------------------------------------------------------------
# Per-item lookup endpoints (GET /services/{id}/items/{item_id} and
# POST /services/items/lookup). The transport layer auto-converts snake_case
# model fields to/from camelCase JSON keys, so models use the snake_case
# convention of the rest of this file.
# ---------------------------------------------------------------------------


class ItemLookupRequestItem(_Base):
    """One ``(serviceId, itemId)`` pair inside a batch lookup request."""

    service_id: str
    item_id: str


class ItemLookupRequest(_Base):
    """Request body for ``POST /services/items/lookup``."""

    items: list[ItemLookupRequestItem]


class ItemLookupRow(_Base):
    """One row in the batch-lookup response. Always present per input pair,
    in the same order as the request.
    """

    service_id: str
    item_id: str
    found: bool
    item: ProductItem | None = None
    error: str | None = None  # e.g. "service_not_found", "item_not_found"


class ItemLookupResponse(_Base):
    """Response body for ``POST /services/items/lookup``.

    ``items`` is in the same order as the request — partners can ``zip()``
    request and response without re-keying.
    """

    items: list[ItemLookupRow]
