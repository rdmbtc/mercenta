import { describe, it, expect, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/v1/cardinal/telemetry/route';
import { resetDb } from '@/lib/db';

describe('Cardinal FunPay Telemetry API (/api/v1/cardinal/telemetry)', () => {
  beforeEach(() => {
    resetDb();
  });

  it('GET returns status ONLINE with Arc Mainnet contract details', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.status).toBe('ONLINE');
    expect(data.network).toBe('arc-mainnet');
    expect(data.chainId).toBe(5042);
    expect(data.contract).toBe('0x06b67adf8d63c8c35a6beda42a3bb93d485af3ed');
    expect(data.mode).toBe('OBSERVER_AP_AR');
    expect(data.stats).toBeDefined();
    expect(data.stats.totalOrders).toBe(0);
  });

  it('POST records a successful order, allocates Profit First buckets, and mints Arc tx hash', async () => {
    const payload = {
      orderId: 'FP_TEST_1001',
      description: 'Telegram Stars (50 Stars)',
      subcategory: 'Telegram Stars',
      price: 249.0,
      currency: 'RUB',
      buyerUsername: 'arc_tester_buyer',
      deliveredAt: 1730000000000
    };

    const req = new Request('http://localhost:3000/api/v1/cardinal/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.orderId).toBe('FP_TEST_1001');
    expect(data.network).toBe('arc-mainnet');
    expect(data.chainId).toBe(5042);
    expect(data.txHash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(data.explorerUrl).toContain('https://explorer.arc.io/tx/');
    expect(data.profitFirstAllocation).toBeDefined();
    expect(Number(data.profitFirstAllocation.cogsUsdc)).toBeGreaterThan(0);
    expect(Number(data.profitFirstAllocation.profitUsdc)).toBeGreaterThan(0);

    // Verify GET aggregates update immediately
    const getRes = await GET();
    const getData = await getRes.json();
    expect(getData.stats.totalOrders).toBe(1);
    expect(getData.stats.totalRubVolume).toBe(249.0);
    expect(Number(getData.stats.totalUsdcAmount)).toBeGreaterThan(2);
    expect(getData.recentOrders.length).toBe(1);
    expect(getData.recentOrders[0].funpay_order_id).toBe('FP_TEST_1001');
  });

  it('POST is strictly idempotent: duplicate orderId returns ALREADY_RECORDED', async () => {
    const payload = {
      orderId: 'FP_TEST_DUP_1',
      description: 'Steam Wallet $5 USD',
      price: 490.0,
      currency: 'RUB',
      buyerUsername: 'steam_gamer_99'
    };

    const req1 = new Request('http://localhost:3000/api/v1/cardinal/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const res1 = await POST(req1);
    expect(res1.status).toBe(200);
    const data1 = await res1.json();
    expect(data1.success).toBe(true);

    // Second call
    const req2 = new Request('http://localhost:3000/api/v1/cardinal/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const res2 = await POST(req2);
    expect(res2.status).toBe(200);
    const data2 = await res2.json();
    expect(data2.status).toBe('ALREADY_RECORDED');
    expect(data2.receiptId).toBe(data1.receiptId);
  });

  it('POST rejects invalid prices or missing orderId', async () => {
    const req1 = new Request('http://localhost:3000/api/v1/cardinal/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: 100 })
    });
    const res1 = await POST(req1);
    expect(res1.status).toBe(400);

    const req2 = new Request('http://localhost:3000/api/v1/cardinal/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: 'VALID_1', price: -50 })
    });
    const res2 = await POST(req2);
    expect(res2.status).toBe(400);
  });
});
