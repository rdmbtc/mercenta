import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/v1/[...path]/route';

const ctx = (path: string) => ({ params: Promise.resolve({ path: path.split('/') }) });
const request = (headers: Record<string, string> = {}) => new Request('https://app.test/api/v1/account', { headers });

describe('v1 API proxy credential boundary', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('fails closed without the local proxy key', async () => {
    vi.stubEnv('MERCENTA_API_PROXY_KEY', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const res = await GET(request({ authorization: 'Bearer caller-secret' }), ctx('account'));
    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not forward a caller bearer token', async () => {
    const key = 'proxy-secret-that-is-at-least-32-characters';
    vi.stubEnv('MERCENTA_API_PROXY_KEY', key);
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ok: true })));
    const res = await GET(request({ 'x-mercenta-api-key': key, authorization: 'Bearer caller-secret' }), ctx('account'));
    expect(res.status).toBe(200);
    const init = vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit;
    const forwarded = new Headers(init.headers);
    expect(forwarded.get('authorization')).toBeNull();
    expect(forwarded.get('x-mercenta-api-key')).toBe(key);
  });
});
