import { describe, it, expect } from 'vitest';
import { POST, OPTIONS } from '../app/api/aomi/tools/route';
import { GET as getManifest } from '../app/api/aomi/manifest/route';
import { TG_CATALOG_PRODUCTS } from '@/components/telegram/tg-products';

describe('Aomi Agent Tools API (/api/aomi/tools & manifest)', () => {
  describe('OPTIONS & CORS', () => {
    it('handles preflight OPTIONS request with correct CORS headers', async () => {
      const res = await OPTIONS();
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });
  });

  describe('Manifest Endpoint (/api/aomi/manifest)', () => {
    it('returns a valid Aomi App manifest conforming to spec', async () => {
      const res = await getManifest();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.schema_version).toBe('v1');
      expect(data.name).toBe('Mercenta Commerce & Treasury');
      expect(data.chains).toContain(5042);
      expect(data.contract_addresses?.arc_mainnet?.checkout).toBe('0x06B6F77626F22e379D55836F3851B5A24ebFF3Ed');
      expect(data.tools).toBeInstanceOf(Array);
      expect(data.tools.length).toBeGreaterThanOrEqual(5);
    });

    it('contains all 5 canonical tool declarations', async () => {
      const res = await getManifest();
      const data = await res.json();
      const toolNames = data.tools.map((t: { name: string }) => t.name);
      expect(toolNames).toContain('mercenta_catalog');
      expect(toolNames).toContain('mercenta_quote');
      expect(toolNames).toContain('mercenta_checkout');
      expect(toolNames).toContain('mercenta_treasury_sweep');
      expect(toolNames).toContain('mercenta_crosschain_topup');
    });

    it('verifies manifest tools have parameters schema', async () => {
      const res = await getManifest();
      const data = await res.json();
      for (const tool of data.tools) {
        expect(tool.description).toBeTruthy();
        expect(tool.parameters).toBeDefined();
        expect(tool.parameters.type).toBe('object');
      }
    });
  });

  describe('Validation & Error Handling', () => {
    it('returns 400 when tool field is missing', async () => {
      const req = new Request('http://localhost/api/aomi/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params: {} }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('Missing "tool" field');
    });

    it('returns 400 for an unknown tool name', async () => {
      const req = new Request('http://localhost/api/aomi/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'unsupported_tool_xyz' }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('Unknown tool');
    });
  });

  describe('Tool 1: mercenta_catalog', () => {
    it('returns all products when no filters are specified', async () => {
      const req = new Request('http://localhost/api/aomi/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'mercenta_catalog', params: {} }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.network).toBe('Arc Mainnet (5042)');
      expect(body.settlementCurrency).toBe('USDC');
      expect(body.total).toBe(TG_CATALOG_PRODUCTS.length);
      expect(body.items.length).toBe(TG_CATALOG_PRODUCTS.length);
    });

    it.each([
      ['gaming', 'gaming'],
      ['streaming', 'subscriptions'],
      ['compute', 'compute'],
      ['tokens', 'developer'],
      ['donations', 'microdonations'],
    ])('filters accurately by category "%s"', async (catKey, expectedCategory) => {
      const req = new Request('http://localhost/api/aomi/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'mercenta_catalog', params: { category: catKey } }),
      });
      const res = await POST(req);
      const body = await res.json();
      expect(body.items.every((i: { category: string }) => i.category === expectedCategory)).toBe(true);
    });

    it('searches products by brand name case-insensitively', async () => {
      const req = new Request('http://localhost/api/aomi/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'mercenta_catalog', params: { query: 'steam' } }),
      });
      const res = await POST(req);
      const body = await res.json();
      expect(body.total).toBeGreaterThan(0);
      expect(body.items.some((i: { name: string }) => i.name.toLowerCase().includes('steam'))).toBe(true);
    });

    it('filters products by max_price_usdc ceiling', async () => {
      const maxPrice = 15.0;
      const req = new Request('http://localhost/api/aomi/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'mercenta_catalog', params: { max_price_usdc: maxPrice } }),
      });
      const res = await POST(req);
      const body = await res.json();
      expect(body.items.every((i: { minPriceUsdc: number }) => i.minPriceUsdc <= maxPrice)).toBe(true);
    });

    it('returns empty list for non-matching search term', async () => {
      const req = new Request('http://localhost/api/aomi/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'mercenta_catalog', params: { query: 'non_existent_sku_xyz_123' } }),
      });
      const res = await POST(req);
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.items).toEqual([]);
    });

    it('guarantees grossMarginFloorPercent is 15.0 on all catalog items', async () => {
      const req = new Request('http://localhost/api/aomi/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'mercenta_catalog', params: {} }),
      });
      const res = await POST(req);
      const body = await res.json();
      for (const item of body.items) {
        expect(item.grossMarginFloorPercent).toBe(15.0);
        expect(item.supplierSlaPercent).toBeGreaterThanOrEqual(99.0);
      }
    });
  });

  describe('Tool 2: mercenta_quote', () => {
    it('fails when product_id is not found', async () => {
      const req = new Request('http://localhost/api/aomi/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'mercenta_quote',
          params: { product_id: 'invalid-id', denomination_usdc: 25 },
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toContain('not found in catalog');
    });

    it('fails when denomination_usdc is zero or negative', async () => {
      const req = new Request('http://localhost/api/aomi/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'mercenta_quote',
          params: { product_id: TG_CATALOG_PRODUCTS[0].id, denomination_usdc: -10 },
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('Invalid denomination_usdc');
    });

    it('generates a valid cleared quote for standard amounts <= $100', async () => {
      const product = TG_CATALOG_PRODUCTS[0];
      const req = new Request('http://localhost/api/aomi/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'mercenta_quote',
          params: { product_id: product.id, denomination_usdc: 50, max_slippage_bps: 50 },
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.quoteId).toMatch(/^q_arc_\d+_[a-z0-9]+$/);
      expect(body.productId).toBe(product.id);
      expect(body.amountUsdc).toBe(50);
      expect(body.grossMarginPercent).toBeGreaterThanOrEqual(15.0);
      expect(body.gates.marginFloorPassed).toBe(true);
      expect(body.gates.autoApproved).toBe(true);
      expect(body.expiresAt).toBeGreaterThan(Date.now());
      expect(body.settlementChain).toBe('Arc Mainnet (5042)');
    });

    it('sets autoApproved to false for amounts exceeding auto-approval ceiling ($100)', async () => {
      const product = TG_CATALOG_PRODUCTS[0];
      const req = new Request('http://localhost/api/aomi/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'mercenta_quote',
          params: { product_id: product.id, denomination_usdc: 250 },
        }),
      });
      const res = await POST(req);
      const body = await res.json();
      expect(body.gates.autoApproved).toBe(false);
    });

    it('requires human approval decision when order exceeds policy limit (> $5,000)', async () => {
      const product = TG_CATALOG_PRODUCTS[0];
      const req = new Request('http://localhost/api/aomi/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'mercenta_quote',
          params: { product_id: product.id, denomination_usdc: 7500 },
        }),
      });
      const res = await POST(req);
      const body = await res.json();
      expect(body.decision).toBe('REQUIRE_ESCALATION');
      expect(body.gates.autoApproved).toBe(false);
    });

    it('correctly calculates supplier cost (~82%) and platform fee (2%)', async () => {
      const product = TG_CATALOG_PRODUCTS[0];
      const amount = 100;
      const req = new Request('http://localhost/api/aomi/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'mercenta_quote',
          params: { product_id: product.id, denomination_usdc: amount },
        }),
      });
      const res = await POST(req);
      const body = await res.json();
      expect(body.supplierCostUsdc).toBe(82);
      expect(body.platformFeeUsdc).toBe(2);
      expect(body.amountUsdc).toBe(amount);
    });

    it('respects custom max_slippage_bps', async () => {
      const product = TG_CATALOG_PRODUCTS[0];
      const req = new Request('http://localhost/api/aomi/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'mercenta_quote',
          params: { product_id: product.id, denomination_usdc: 25, max_slippage_bps: 125 },
        }),
      });
      const res = await POST(req);
      const body = await res.json();
      expect(body.maxSlippageBps).toBe(125);
    });
  });

  describe('Tool 3: mercenta_checkout', () => {
    it('fails when quote_id is missing', async () => {
      const req = new Request('http://localhost/api/aomi/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'mercenta_checkout',
          params: {},
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('Missing quote_id');
    });

    it('executes atomic checkout with instant voucher generation when auto_claim=true', async () => {
      const quoteId = `q_arc_${Date.now()}_test1`;
      const recipient = '0x1111111111111111111111111111111111111111';
      const req = new Request('http://localhost/api/aomi/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'mercenta_checkout',
          params: { quote_id: quoteId, recipient_address: recipient, auto_claim: true },
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe('SETTLED');
      expect(body.orderId).toMatch(/^mct_ord_/i);
      expect(body.txHash).toMatch(/^0x[0-9a-f]{64}$/i);
      expect(body.arcscanUrl).toBe(`https://arcscan.app/tx/${body.txHash}`);
      expect(body.contract).toBe('0x06B6F77626F22e379D55836F3851B5A24ebFF3Ed');
      expect(body.recipient).toBe(recipient);
      expect(body.voucherCode).toMatch(/^MCT-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      expect(body.receiptSha256).toMatch(/^0x[0-9a-f]{64}$/i);
    });

    it('does not reveal voucherCode if auto_claim is false', async () => {
      const quoteId = `q_arc_${Date.now()}_test2`;
      const req = new Request('http://localhost/api/aomi/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'mercenta_checkout',
          params: { quote_id: quoteId, auto_claim: false },
        }),
      });
      const res = await POST(req);
      const body = await res.json();
      expect(body.status).toBe('SETTLED');
      expect(body.voucherCode).toBeUndefined();
    });
  });

  describe('Tool 4: mercenta_treasury_sweep', () => {
    it('returns NO_IDLE_FUNDS when balance does not exceed reserve floor', async () => {
      const req = new Request('http://localhost/api/aomi/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'mercenta_treasury_sweep',
          params: { reserve_floor_usdc: 200.0 }, // 125 balance < 200 floor
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe('NO_IDLE_FUNDS');
      expect(body.amountSweptUsdc).toBe(0);
    });

    it('sweeps exact surplus above reserve floor in simulated mode', async () => {
      const req = new Request('http://localhost/api/aomi/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'mercenta_treasury_sweep',
          params: { reserve_floor_usdc: 50.0, simulate_only: true },
        }),
      });
      const res = await POST(req);
      const body = await res.json();
      expect(body.status).toBe('SIMULATED');
      expect(body.amountSweptUsdc).toBe(75.0); // 125 - 50 = 75
      expect(body.operatingBalanceRemainingUsdc).toBe(50.0);
      expect(body.vaultAddress).toBe('0x32A44B04C8567dB1a613271167E1402CeF5E8c1b');
      expect(body.netApyPercent).toBe('8.4%');
      expect(body.txHash).toBeUndefined();
    });

    it('executes live sweep with real transaction hash when simulate_only is false', async () => {
      const req = new Request('http://localhost/api/aomi/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'mercenta_treasury_sweep',
          params: { reserve_floor_usdc: 25.0, simulate_only: false },
        }),
      });
      const res = await POST(req);
      const body = await res.json();
      expect(body.status).toBe('SWEPT');
      expect(body.amountSweptUsdc).toBe(100.0); // 125 - 25 = 100
      expect(body.txHash).toMatch(/^0x[0-9a-f]{64}$/i);
      expect(body.arcscanUrl).toContain(body.txHash);
    });
  });

  describe('Tool 5: mercenta_crosschain_topup', () => {
    it('fails when arc_destination_wallet is omitted', async () => {
      const req = new Request('http://localhost/api/aomi/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'mercenta_crosschain_topup',
          params: { source_chain: 'base', amount_usdc: 100 },
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('arc_destination_wallet');
    });

    it.each([
      ['base', 'BASE', 45, 0.15],
      ['arbitrum', 'ARBITRUM', 40, 0.20],
      ['solana', 'SOLANA', 90, 0.35],
      ['ethereum', 'ETHEREUM', 120, 1.50],
      ['polygon', 'POLYGON', 60, 0.10],
    ])('generates valid CCTP top-up quote for chain "%s"', async (chainKey, expectedChain, timeSec, fee) => {
      const dest = '0x9ED914F8C356FE8C3673fB57601A94b3A8B5760';
      const amount = 100;
      const req = new Request('http://localhost/api/aomi/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'mercenta_crosschain_topup',
          params: { source_chain: chainKey, amount_usdc: amount, arc_destination_wallet: dest },
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.sourceChain).toBe(expectedChain);
      expect(body.destinationChain).toBe('Arc Mainnet (5042)');
      expect(body.destinationWallet).toBe(dest);
      expect(body.requestedAmountUsdc).toBe(amount);
      expect(body.bridgeFeeUsdc).toBe(fee);
      expect(body.estimatedNetReceivedUsdc).toBe(amount - fee);
      expect(body.estimatedSeconds).toBe(timeSec);
      expect(body.protocol).toContain('CCTP');
    });
  });
});
