/**
 * Product types in the catalog.
 */
export const ProductType = {
  VOUCHER: "voucher",
  DIRECT_TOPUP: "direct_topup",
} as const;

export type ProductType = (typeof ProductType)[keyof typeof ProductType];
