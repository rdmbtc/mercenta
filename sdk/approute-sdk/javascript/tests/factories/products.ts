import type {
  ProductFieldValidation,
  ProductField,
  ProductItem,
  Product,
  ProductListResponse,
  ProductStockItem,
  ProductStockResponse,
  ItemLookupRequestItem,
  ItemLookupRow,
  ItemLookupResponse,
} from '../../src/models/index.js';

/**
 * Helper: JSON responses use `null` for absent optional fields,
 * but our TS models use `?:` (undefined).  Nullable<T> lets factories
 * express both so runtime values match what the real API returns.
 */
type Nullable<T> = { [K in keyof T]: T[K] | null };

export function makeProductFieldValidation(
  overrides?: Partial<ProductFieldValidation>,
): ProductFieldValidation {
  return {
    pattern: '^[^@]+@[^@]+$',
    message: 'Invalid email',
    ...overrides,
  };
}

export function makeProductField(
  overrides?: Partial<Nullable<ProductField>>,
): ProductField {
  return {
    key: 'email',
    type: 'text',
    required: true,
    label: 'Email',
    options: null,
    validation: makeProductFieldValidation(),
    ...overrides,
  } as ProductField;
}

export function makeProductItem(
  overrides?: Partial<ProductItem>,
): ProductItem {
  return {
    id: 'item-001',
    name: '50 USD',
    nominal: 50.0,
    price: 48.5,
    currency: 'USD',
    available: true,
    stock: 150,
    ...overrides,
  };
}

export function makeProduct(
  overrides?: Partial<Nullable<Product>>,
): Product {
  return {
    id: 'prod-001',
    name: 'Steam Wallet 50 USD',
    type: 'voucher',
    imageUrl: null,
    countryCode: 'US',
    categoryName: 'Gaming',
    subcategoryName: 'Steam',
    items: [makeProductItem()],
    fields: null,
    ...overrides,
  } as Product;
}

export function makeProductListResponse(
  overrides?: Partial<ProductListResponse>,
): ProductListResponse {
  return {
    items: [
      makeProduct({
        fields: [makeProductField()],
      }),
    ],
    hasNext: false,
    ...overrides,
  };
}

export function makeProductGetResponse(
  overrides?: Partial<Nullable<Product>>,
): Product {
  return makeProduct({
    fields: null,
    ...overrides,
  });
}

export function makeProductStockItem(
  overrides?: Partial<Nullable<ProductStockItem>>,
): ProductStockItem {
  return {
    itemId: 'item-001',
    stock: 150,
    ...overrides,
  } as ProductStockItem;
}

export function makeProductStockResponse(
  overrides?: Partial<ProductStockResponse>,
): ProductStockResponse {
  return {
    productId: 'prod-001',
    items: [
      makeProductStockItem(),
      makeProductStockItem({ itemId: 'item-002', stock: null }),
    ],
    ...overrides,
  };
}

export function makeItemLookupRequestItem(
  overrides?: Partial<ItemLookupRequestItem>,
): ItemLookupRequestItem {
  return {
    serviceId: 'svc-001',
    itemId: 'item-001',
    ...overrides,
  };
}

export function makeItemLookupRow(
  overrides?: Partial<ItemLookupRow>,
): ItemLookupRow {
  const base: ItemLookupRow = {
    serviceId: 'svc-001',
    itemId: 'item-001',
    found: true,
    item: makeProductItem(),
    error: null,
  };
  return { ...base, ...overrides };
}

/**
 * Default fixture builds a mixed 3-row response: one hit, one
 * service_not_found, one item_not_found — same shape the backend returns
 * for partial misses.
 */
export function makeItemLookupResponse(
  overrides?: Partial<ItemLookupResponse>,
): ItemLookupResponse {
  return {
    items: [
      makeItemLookupRow(),
      makeItemLookupRow({
        serviceId: 'svc-missing',
        itemId: 'item-001',
        found: false,
        item: null,
        error: 'service_not_found',
      }),
      makeItemLookupRow({
        serviceId: 'svc-001',
        itemId: 'item-missing',
        found: false,
        item: null,
        error: 'item_not_found',
      }),
    ],
    ...overrides,
  };
}
