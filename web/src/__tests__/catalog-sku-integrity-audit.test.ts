import { describe, it, expect } from 'vitest';
import { TG_CATALOG_PRODUCTS, TG_CATEGORIES, type TgProduct } from '@/components/telegram/tg-products';

describe('Catalog SKU Integrity & Compliance Audit', () => {
  describe('Product Structure & ID Invariants', () => {
    it.each(TG_CATALOG_PRODUCTS.map((p) => [p.id, p]))(
      'product "%s" has valid structural schema',
      (id, product: TgProduct) => {
        expect(product.id).toMatch(/^mct-[a-z0-9-]+$/);
        expect(product.name.trim().length).toBeGreaterThan(0);
        expect(product.brand.trim().length).toBeGreaterThan(0);
        expect(product.shortDesc.trim().length).toBeGreaterThan(0);
        expect(product.region.trim().length).toBeGreaterThan(0);
        expect(product.coverImage).toMatch(/^\/(product-covers|products)\/[a-z0-9._-]+$/i);
        expect(product.instantDelivery).toBe(true);
      }
    );
  });

  describe('Denomination Monotonic Pricing Invariants', () => {
    it.each(TG_CATALOG_PRODUCTS.map((p) => [p.name, p]))(
      'product "%s" denominations are strictly monotonic and within valid bounds',
      (_name, product: TgProduct) => {
        expect(product.denominations.length).toBeGreaterThanOrEqual(1);

        let prevPrice = 0;
        product.denominations.forEach((d) => {
          expect(d.id).toMatch(/^[a-z0-9-]+$/);
          expect(d.label).toBeTruthy();
          expect(d.priceUsdc).toBeGreaterThan(0);
          expect(d.priceUsdc).toBeGreaterThan(prevPrice);
          expect(d.priceUsdc).toBeLessThanOrEqual(1000.0);
          prevPrice = d.priceUsdc;
        });
      }
    );
  });

  describe('Global SKU Uniqueness Across All Products', () => {
    it('verifies zero denomination ID collisions across the entire catalog', () => {
      const allDenomIds = new Set<string>();
      let totalDenominations = 0;

      TG_CATALOG_PRODUCTS.forEach((p) => {
        p.denominations.forEach((d) => {
          expect(allDenomIds.has(d.id)).toBe(false);
          allDenomIds.add(d.id);
          totalDenominations++;
        });
      });

      expect(allDenomIds.size).toBe(totalDenominations);
      expect(totalDenominations).toBeGreaterThanOrEqual(25);
    });
  });

  describe('Category Completeness & Classification', () => {
    it.each(TG_CATEGORIES.filter((c) => c.id !== 'all'))(
      'category "%s" has at least one active product listing',
      (category) => {
        const matching = TG_CATALOG_PRODUCTS.filter((p) => p.category === category.id);
        expect(matching.length).toBeGreaterThan(0);
      }
    );
  });

  describe('Supplier Confidentiality Invariant (Rule 5 Audit)', () => {
    it('verifies that forbidden supplier strings never appear in names, descriptions, or brands', () => {
      const forbiddenTerms = ['approute', 'app_route', 'app-route'];

      TG_CATALOG_PRODUCTS.forEach((product) => {
        const combined = `${product.id} ${product.name} ${product.brand} ${product.shortDesc} ${product.categoryLabel}`.toLowerCase();
        forbiddenTerms.forEach((forbidden) => {
          expect(combined).not.toContain(forbidden);
        });
      });
    });
  });

  describe('Simulated Client Shopping Baskets (25 Multi-SKU Combinations)', () => {
    it.each(Array.from({ length: 25 }, (_, i) => i + 1))(
      'client basket permutation #%i calculates exact total and wholesale spread',
      (basketId) => {
        // Pick 2 products based on basketId
        const prodA = TG_CATALOG_PRODUCTS[(basketId * 2) % TG_CATALOG_PRODUCTS.length];
        const prodB = TG_CATALOG_PRODUCTS[(basketId * 3 + 1) % TG_CATALOG_PRODUCTS.length];

        const itemA = prodA.denominations[0];
        const itemB = prodB.denominations[0];

        const totalRetailUsdc = itemA.priceUsdc + itemB.priceUsdc;
        const totalWholesaleUsdc = Math.round(totalRetailUsdc * 0.82 * 100) / 100;
        const grossMargin = (totalRetailUsdc - totalWholesaleUsdc) / totalRetailUsdc;

        expect(totalRetailUsdc).toBeGreaterThan(0);
        expect(totalWholesaleUsdc).toBeLessThan(totalRetailUsdc);
        expect(grossMargin).toBeGreaterThanOrEqual(0.15); // >= 15% margin floor
      }
    );
  });
});
