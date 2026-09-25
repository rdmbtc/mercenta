/**
 * A selectable option for a product field (e.g. dropdown values).
 */
export interface ProductFieldOption {
  label: string;
  value: string;
  price?: number;
}

/**
 * Validation rules for a product field.
 */
export interface ProductFieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
  message?: string;
}

/**
 * A field definition on a product (input the buyer must fill).
 */
export interface ProductField {
  key: string;
  type: string;
  required: boolean;
  label?: string;
  options?: ProductFieldOption[];
  validation?: ProductFieldValidation;
}

/**
 * A purchasable item (denomination) within a product.
 */
export interface ProductItem {
  id: string;
  name?: string;
  nominal?: number;
  price: number;
  currency: string;
  available?: boolean;
  stock?: number;
  isLongOrder?: boolean;
  minQtyToLongOrder?: number;
}

/**
 * A product in the catalog.
 */
export interface Product {
  id: string;
  name?: string;
  type: string;
  imageUrl?: string;
  countryCode?: string;
  categoryName?: string;
  subcategoryName?: string;
  items: ProductItem[];
  fields?: ProductField[];
}

/**
 * Paginated response for product listings.
 */
export interface ProductListResponse {
  items: Product[];
  hasNext: boolean;
}

/**
 * Stock information for a single item within a product.
 */
export interface ProductStockItem {
  itemId: string;
  stock?: number;
}

/**
 * Stock information for all items within a product.
 */
export interface ProductStockResponse {
  productId: string;
  items: ProductStockItem[];
}

// ---------------------------------------------------------------------------
// Per-item lookup endpoints
//   GET  /services/{serviceId}/items/{itemId}
//   POST /services/items/lookup
// JSON field names mirror the backend ItemLookup* schemas verbatim.
// ---------------------------------------------------------------------------

/** One `(serviceId, itemId)` pair inside a batch lookup request. */
export interface ItemLookupRequestItem {
  serviceId: string;
  itemId: string;
}

/** Request body for `POST /services/items/lookup`. */
export interface ItemLookupRequest {
  items: ItemLookupRequestItem[];
}

/**
 * One row in the batch-lookup response. Always present per input pair,
 * in the same order as the request.
 */
export interface ItemLookupRow {
  serviceId: string;
  itemId: string;
  found: boolean;
  /** The denomination if `found === true`, otherwise `null`. */
  item: ProductItem | null;
  /** Error code such as `"service_not_found"` or `"item_not_found"` when `found === false`. */
  error: string | null;
}

/**
 * Response body for `POST /services/items/lookup`.
 * `items` is in the same order as the request — callers can `zip()`
 * request and response without re-keying.
 */
export interface ItemLookupResponse {
  items: ItemLookupRow[];
}
