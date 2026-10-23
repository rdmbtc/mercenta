import { describe, it, expect, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/v1/cardinal/telemetry/route';
import { resetDb } from '@/lib/db';

describe('Cardinal FunPay Telemetry API (/api/v1/cardinal/telemetry)', () => {
  beforeEach(() => {
    resetDb();
  });

  it('GET returns status ONLINE with Arc Mainnet contract details and verified baseline orders', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.status).toBe('ONLINE');
    expect(data.network).toBe('arc-mainnet');
    expect(data.chainId).toBe(5042);
    expect(data.contract).toBe('0x06b67adf8d63c8c35a6beda42a3bb93d485af3ed');
    expect(data.mode).toBe('OBSERVER_AP_AR');
    expect(data.stats).toBeDefined();
    expect(data.stats.totalOrders).toBe(11);
    expect(data.stats.totalRubVolume).toBe(30.5);
    expect(Number(data.stats.totalUsdcAmount)).toBeGreaterThan(0.3);
  });

  it('POST records a new order, allocates Profit First buckets, and updates stats', async () => {
    const payload = {
      orderId: 'FP_TEST_NEW_ORDER',
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
    expect(data.orderId).toBe('FP_TEST_NEW_ORDER');
    expect(data.network).toBe('arc-mainnet');
    expect(data.chainId).toBe(5042);
    expect(data.txHash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(data.profitFirstAllocation).toBeDefined();

    // Verify GET aggregates update immediately
    const getRes = await GET();
    const getData = await getRes.json();
    expect(getData.stats.totalOrders).toBe(12);
    expect(getData.stats.totalRubVolume).toBe(279.5);
  });

  it('POST is strictly idempotent: duplicate orderId returns ALREADY_RECORDED', async () => {
    const payload = {
      orderId: 'Y8NQPWDR',
      description: 'Steam Wallet $5 USD',
      price: 5.0,
      currency: 'RUB',
      buyerUsername: 'GefiStore'
    };

    const req = new Request('http://localhost:3000/api/v1/cardinal/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('ALREADY_RECORDED');
  });
});
