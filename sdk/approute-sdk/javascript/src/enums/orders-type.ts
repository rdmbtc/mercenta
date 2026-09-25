/**
 * Order type discriminator.
 */
export const OrdersType = {
  SHOP: "shop",
  DTU: "dtu",
} as const;

export type OrdersType = (typeof OrdersType)[keyof typeof OrdersType];
