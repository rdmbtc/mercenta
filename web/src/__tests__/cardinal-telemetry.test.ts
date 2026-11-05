import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from '@/app/api/v1/cardinal/telemetry/route';
import { mintSession } from '@/lib/auth';
import { resetDb } from '@/lib/db';

const ADMIN = '0x' + 'aa'.repeat(20);
const session = () => `mercenta_session=${encodeURIComponent(mintSession(ADMIN, Date.now()).token)}`;
const request = (method: 'GET' | 'POST', body?: unknown) => new Request('https://app.test/api/v1/cardinal/telemetry', {
  method,
  headers: { cookie: session(), ...(method === 'POST' ? { origin: 'https://app.test', 'content-type': 'application/json' } : {}) },
  body: method === 'POST' ? JSON.stringify(body) : undefined,
});

describe('Cardinal telemetry security boundary', () => {
  beforeEach(() => {
    resetDb();
    vi.stubEnv('TELEGRAM_ADMIN_WALLETS', ADMIN);
    vi.stubEnv('RELAYER_KEY', '');
  });

  it('rejects anonymous reads before touching the database', async () => {
    const res = await GET(new Request('https://app.test/api/v1/cardinal/telemetry'));
    expect(res.status).toBe(401);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('rejects anonymous writes', async () => {
    const res = await POST(new Request('https://app.test/api/v1/cardinal/telemetry', { method: 'POST' }));
    expect(res.status).toBe(401);
  });

  it('does not fabricate a transaction hash when relaying is unavailable', async () => {
    const res = await POST(request('POST', {
      orderId: 'FP_TEST_NEW_ORDER', description: 'Telegram Stars', subcategory: 'Telegram', price: 249, currency: 'RUB', buyerUsername: 'tester',
    }));
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.status).toBe('RELAY_FAILED');
    expect(data.txHash).toBeUndefined();
  });

  it('rejects malformed and unsupported input', async () => {
    const invalid = await POST(request('POST', { orderId: '!!!', description: '', price: 1, currency: 'GBP' }));
    expect(invalid.status).toBe(400);
  });
});
