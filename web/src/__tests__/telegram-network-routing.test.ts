import { expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';
import { POST as handle } from '@/app/api/telegram/testnet/[...path]/route';
const proxy = vi.hoisted(() => vi.fn(async () => Response.json({ ok: true })));
vi.mock('@/lib/backend-proxy', () => ({ proxyBackend: proxy }));

it('allows the dedicated Telegram Testnet namespace without opening account APIs on Mainnet', () => {
  const allowed = middleware(new NextRequest('https://mainnet.mercenta.xyz/api/telegram/testnet/summary'));
  expect(allowed.headers.get('x-middleware-next')).toBe('1');
  const blocked = middleware(new NextRequest('https://mainnet.mercenta.xyz/api/account/summary'));
  expect(blocked.status).toBe(503);
});

it('routes only fixed test account operations through the existing authenticated proxy', async () => {
  proxy.mockClear();
  const req = new Request('https://mercenta.xyz/api/telegram/testnet/catalog-checkout/confirm', { method: 'POST', headers: { origin: 'https://mercenta.xyz' }, body: '{}' });
  await handle(req, { params: Promise.resolve({ path: ['catalog-checkout', 'confirm'] }) });
  expect(proxy).toHaveBeenCalledWith(req, 'account/catalog-checkout/confirm');
  for (const path of [['keys'], ['orders', 'new'], ['..', 'mainnet', 'fulfill'], ['deposits', 'x', 'delete']]) {
    const result = await handle(req, { params: Promise.resolve({ path }) });
    expect(result.status).toBe(404);
  }
  expect(proxy).toHaveBeenCalledTimes(1);
});
