from __future__ import annotations

from approute.models import (
    ItemLookupRequestItem,
    ItemLookupResponse,
    Product,
    ProductItem,
    ProductListResponse,
    ProductStockResponse,
)
from approute.resources._base import BaseResource

# Batch lookup hard cap matches the backend's Pydantic max_length=100 on
# ItemLookupRequest.items. Enforce client-side too so partners get a
# fail-fast ValueError instead of a server-side 422 round-trip.
MAX_LOOKUP_ITEMS = 100

# Module-level alias: lets ``lookup_items`` annotate ``list[...]`` even though
# ``list`` is shadowed inside ``ServicesResource`` by the ``list()`` method.
# (``from __future__ import annotations`` defers runtime evaluation, but mypy
# still resolves the name against the enclosing class scope.)
_LookupItems = list[ItemLookupRequestItem]


class ServicesResource(BaseResource):

    def list(self) -> ProductListResponse:
        """List all products/services in the catalog."""
        data = self._t.request("GET", "/services")
        return ProductListResponse.model_validate(data)

    def get(self, product_id: str) -> Product:
        """Get a single product/service by ID."""
        data = self._t.request("GET", f"/services/{product_id}")
        return Product.model_validate(data)

    def stock(self, product_id: str) -> ProductStockResponse:
        """Get stock info for a product."""
        data = self._t.request("GET", f"/services/{product_id}/stock")
        return ProductStockResponse.model_validate(data)

    def get_item(self, service_id: str, item_id: str) -> ProductItem:
        """Get a single denomination/item from a service by id.

        Calls ``GET /services/{service_id}/items/{item_id}`` and returns the
        same ``ProductItem`` shape that appears inside
        ``GET /services/{service_id}.data.items[]``.
        """
        # Pre-existing convention: ids are server-issued UUIDs; not URI-encoded.
        # See README. Matches behaviour of `get(product_id)` above.
        data = self._t.request("GET", f"/services/{service_id}/items/{item_id}")
        return ProductItem.model_validate(data)

    def lookup_items(self, items: _LookupItems) -> ItemLookupResponse:
        """Batch lookup of up to 100 ``(serviceId, itemId)`` pairs in one
        round-trip.

        Returns an :class:`ItemLookupResponse` whose ``items`` list is in the
        same order as the input — partners can ``zip()`` request and response
        without re-keying.

        Raises :class:`ValueError` when ``items`` is empty or longer than 100.
        These checks happen before any HTTP call is made.
        """
        if not items:
            raise ValueError("items must not be empty")
        if len(items) > MAX_LOOKUP_ITEMS:
            raise ValueError(
                f"items must contain at most {MAX_LOOKUP_ITEMS} entries"
            )
        # _Base has no alias_generator wired — fields already use snake_case
        # which the transport converts to camelCase on the wire.
        payload = {"items": [it.model_dump() for it in items]}
        data = self._t.request("POST", "/services/items/lookup", json_body=payload)
        return ItemLookupResponse.model_validate(data)
