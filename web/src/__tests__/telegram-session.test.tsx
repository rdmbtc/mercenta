// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useTelegramNetwork } from '@/components/telegram/useTelegramNetwork';
import { fetchSession, signInWithWallet, type Eip1193Provider } from '@/lib/wallet';

vi.mock('@/lib/wallet', async original => ({ ...await original<typeof import('@/lib/wallet')>(), signInWithWallet: vi.fn() }));
vi.mock('@/lib/test-checkout', () => ({ checkoutApi: vi.fn(async (path: string) => path === 'summary' ? { availableUnits: '25000000' } : { items: [] }) }));
vi.mock('@/lib/mainnet-orders', () => ({ syncRemoteOrders: vi.fn(), getMainnetOrders: vi.fn(() => []) }));
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const address = '0x1111111111111111111111111111111111111111';
let root: Root, host: HTMLDivElement;
let state: ReturnType<typeof useTelegramNetwork>;
const fetchMock = vi.fn();
function Probe({ network = 'testnet', provider = null, account = address }: { network?: 'testnet' | 'mainnet'; provider?: Eip1193Provider | null; account?: string }) {
  state = useTelegramNetwork(network, provider, account);
  return <div>{state.wallet}</div>;
}
const authenticated = () => new Response(JSON.stringify({ authenticated: true, address }));
beforeEach(() => {
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockImplementation(async () => authenticated());
  window.ethereum = { request: vi.fn() };
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); delete window.ethereum; vi.unstubAllGlobals(); vi.clearAllMocks(); });
it('distinguishes expired authentication from server outages', async () => {
  fetchMock.mockResolvedValueOnce(new Response('', { status: 401 }));
  await expect(fetchSession()).resolves.toEqual({ authenticated: false, address: null });
  fetchMock.mockResolvedValueOnce(new Response('', { status: 503 }));
  await expect(fetchSession()).rejects.toThrow('Session service is unavailable');
});
it('retains a matching locked identity and never connects the injected wallet', async () => {
  await act(async () => root.render(<Probe />));
  expect(state.wallet).toBe(address);
  await act(async () => state.connect());
  expect(state.error).toContain('Unlock');
  expect(window.ethereum!.request).not.toHaveBeenCalled();
  expect(fetchMock.mock.calls.some(([url]) => String(url).includes('logout'))).toBe(false);
});
it('keeps view identity on outage but clears it on 401', async () => {
  await act(async () => root.render(<Probe />));
  fetchMock.mockResolvedValueOnce(new Response('', { status: 503 }));
  await act(async () => state.refresh());
  expect(state.wallet).toBe(address);
  expect(state.error).toContain('unavailable');
  fetchMock.mockResolvedValueOnce(new Response('', { status: 401 }));
  await act(async () => state.refresh());
  expect(state.wallet).toBeNull();
});
it('does not expose another session as the selected local wallet', async () => {
  await act(async () => root.render(<Probe account="0x2222222222222222222222222222222222222222" />));
  expect(state.wallet).toBeNull();
});
it('reads locked mainnet balance only through the fixed public RPC', async () => {
  fetchMock.mockImplementation(async (url: string) => url === '/api/me' ? authenticated() : new Response(JSON.stringify({ result: '0xde0b6b3a7640000' })));
  await act(async () => root.render(<Probe network="mainnet" />));
  expect(state.wallet).toBe(address);
  expect(state.balance).toBe('1000000');
  expect(fetchMock).toHaveBeenCalledWith('https://rpc.mainnet.arc.io', expect.objectContaining({ body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [address, 'latest'] }) }));
  expect(window.ethereum!.request).not.toHaveBeenCalled();
});
it('reuses a matching session after unlock without requesting a signature', async () => {
  const provider = { request: vi.fn(async () => [address]) };
  await act(async () => root.render(<Probe provider={provider} />));
  await act(async () => state.connect());
  expect(signInWithWallet).not.toHaveBeenCalled();
  expect(state.wallet).toBe(address);
  await act(async () => root.render(<Probe />));
  expect(state.wallet).toBe(address);
});
it('a rejected reconnect leaves the existing session intact', async () => {
  const provider = { request: vi.fn(async () => { throw new Error('User rejected'); }) };
  await act(async () => root.render(<Probe />));
  await act(async () => root.render(<Probe provider={provider} />));
  await act(async () => state.connect());
  expect(state.wallet).toBe(address);
  expect(fetchMock.mock.calls.some(([url]) => String(url).includes('logout'))).toBe(false);
});
