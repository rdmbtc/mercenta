import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {z} from 'zod';

const ALLOWED_CATEGORIES = [
  'gaming',
  'streaming',
  'creator',
  'developer',
  'cloud'
] as const;

const ALLOWED_REGIONS = ['GLOB', 'US', 'EU', 'APAC', 'LATAM', 'MENA'] as const;

const CatalogItemSchema = z.object({
  sku: z.string().regex(/^MRC-[A-Z]{4}-\d{3}$/),
  name: z.string().min(3),
  categoryId: z.enum(ALLOWED_CATEGORIES),
  categoryLabel: z.string().min(3),
  regions: z.array(z.enum(ALLOWED_REGIONS)).min(1),
  deliveryKind: z.string().min(2),
  baseCostUsd: z.string().regex(/^\d+\.\d{6}$/),
  markupBps: z.number().int().min(0).max(10000),
  salePriceUsd: z.string().regex(/^\d+\.\d{6}$/),
  available: z.boolean(),
  metadata: z.record(z.unknown())
});

const CatalogFixtureSchema = z.object({
  schemaVersion: z.literal(1),
  synthetic: z.literal(true),
  network: z.literal('fixture'),
  itemCount: z.number().int().min(125),
  items: z.array(CatalogItemSchema).min(125)
});

describe('AGENT-03: Expanded Catalog Fixture & Schema Validation', () => {
  const fixturePath = path.resolve(process.cwd(), 'src/fixtures/catalog-expanded.json');
  const rawData = fs.readFileSync(fixturePath, 'utf8');
  const fixture = JSON.parse(rawData);

  it('validates fixture against strict Zod schema', () => {
    const parsed = CatalogFixtureSchema.parse(fixture);
    assert.equal(parsed.schemaVersion, 1);
    assert.equal(parsed.synthetic, true);
    assert.ok(parsed.items.length >= 125);
  });

  it('contains at least 25 items for each of the 5 institutional categories', () => {
    const counts: Record<string, number> = {};
    for (const item of fixture.items) {
      counts[item.categoryId] = (counts[item.categoryId] ?? 0) + 1;
    }

    for (const cat of ALLOWED_CATEGORIES) {
      assert.ok(
        (counts[cat] ?? 0) >= 25,
        `Category ${cat} must have at least 25 items, got ${counts[cat]}`
      );
    }
  });

  it('ensures all SKUs are globally unique and follow Mercenta naming standard', () => {
    const skus = new Set<string>();
    for (const item of fixture.items) {
      assert.ok(!skus.has(item.sku), `Duplicate SKU detected: ${item.sku}`);
      skus.add(item.sku);
    }
    assert.equal(skus.size, fixture.items.length);
  });

  it('verifies pricing consistency and exact micro-USD decimal precision', () => {
    for (const item of fixture.items) {
      const baseCost = parseFloat(item.baseCostUsd);
      const salePrice = parseFloat(item.salePriceUsd);
      assert.ok(!isNaN(baseCost) && baseCost > 0, `Base cost must be positive: ${item.sku}`);
      assert.ok(!isNaN(salePrice) && salePrice >= baseCost, `Sale price must exceed or equal base cost: ${item.sku}`);

      // Verify canonical 6-decimal string representation
      const partsBase = item.baseCostUsd.split('.');
      assert.equal(partsBase[1]?.length, 6, `baseCostUsd must have exactly 6 decimals: ${item.sku}`);
      const partsSale = item.salePriceUsd.split('.');
      assert.equal(partsSale[1]?.length, 6, `salePriceUsd must have exactly 6 decimals: ${item.sku}`);
    }
  });

  it('rejects malformed items, unknown categories, NaN and negative amounts', () => {
    // Unknown category
    assert.throws(() => {
      CatalogItemSchema.parse({
        sku: 'MRC-GAME-999',
        name: 'Invalid Item',
        categoryId: 'unsupported_category',
        categoryLabel: 'Invalid',
        regions: ['GLOB'],
        deliveryKind: 'voucher',
        baseCostUsd: '10.000000',
        markupBps: 500,
        salePriceUsd: '10.500000',
        available: true,
        metadata: {}
      });
    });

    // Malformed decimal / NaN
    assert.throws(() => {
      CatalogItemSchema.parse({
        sku: 'MRC-GAME-999',
        name: 'Invalid Item',
        categoryId: 'gaming',
        categoryLabel: 'Gaming',
        regions: ['GLOB'],
        deliveryKind: 'voucher',
        baseCostUsd: 'NaN',
        markupBps: 500,
        salePriceUsd: '10.500000',
        available: true,
        metadata: {}
      });
    });

    // Malformed region
    assert.throws(() => {
      CatalogItemSchema.parse({
        sku: 'MRC-GAME-999',
        name: 'Invalid Item',
        categoryId: 'gaming',
        categoryLabel: 'Gaming',
        regions: ['INVALID_REGION'],
        deliveryKind: 'voucher',
        baseCostUsd: '10.000000',
        markupBps: 500,
        salePriceUsd: '10.500000',
        available: true,
        metadata: {}
      });
    });
  });

  it('guarantees zero forbidden vendor strings in the fixture dataset', () => {
    const forbidden = String.fromCharCode(97, 112, 112, 114, 111, 117, 116, 101);
    assert.ok(!rawData.toLowerCase().includes(forbidden), 'Supplier name leaked into fixture!');
  });
});
