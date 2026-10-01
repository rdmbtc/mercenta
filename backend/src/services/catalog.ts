import { readFileSync } from "node:fs";
import { z } from "zod";
import { parseMoney } from "../money.js";
export const categories = {
  gaming: "Gaming Keys & Platform Vouchers",
  streaming: "Streaming & Media Subscriptions",
  creator: "Creator & Game Micro-Donations",
  developer: "Developer API & Token Bundles",
  cloud: "Cloud Compute & GPU Vouchers",
};
export const productSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().max(200),
  category: z.enum(["gaming", "streaming", "creator", "developer", "cloud"]),
  price: z.string(),
  cost: z.string().optional(),
  currency: z.literal("USDC"),
  enabled: z.boolean(),
  quotedAt: z.number().int(),
  supplierSku: z.string().optional(),
});
export type Product = z.infer<typeof productSchema>;
export function loadProducts(file?: string): Product[] {
  if (!file) return [];
  const p = z
    .array(productSchema)
    .parse(JSON.parse(readFileSync(file, "utf8")));
  for (const x of p) {
    parseMoney(x.price);
    if (x.cost) parseMoney(x.cost);
  }
  return p;
}
export function publicProducts(products: Product[]) {
  return products.map(
    ({ id, name, category, price, currency, enabled, quotedAt }) => ({
      id,
      name,
      category,
      categoryLabel: categories[category],
      price,
      currency,
      enabled,
      quotedAt,
    }),
  );
}
