// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { TgApp } from '@/components/telegram/TgApp';
import { useTelegramNetwork } from '@/components/telegram/useTelegramNetwork';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const mocks = vi.hoisted(() => ({ networkState: vi.fn(), connect: vi.fn(), refresh: vi.fn() }));
vi.mock('@/components/telegram/useTelegramNetwork', () => ({ useTelegramNetwork: mocks.networkState }));
vi.mock('next/image', () => ({ default: (props: { src: string; alt: string }) => <img src={props.src} alt={props.alt} /> }));
vi.mock('@/components/telegram/TgCatalog', () => ({ TgCatalog: (props: { network: string; onLock: (locked: boolean) => void }) => <div data-testid="catalog" data-network={props.network}><button onClick={() => props.onLock(true)}>Start signing</button><button onClick={() => props.onLock(false)}>Finish signing</button></div> }));
vi.mock('@/components/telegram/TgProfile', () => ({ TgProfile: (props: { network: string; onOpenTopUp: () => void }) => <div>Wallet {props.network}<button onClick={props.onOpenTopUp}>Fund</button></div> }));
vi.mock('@/components/telegram/TgTopUpModal', () => ({ TgTopUpModal: (props: { network: string }) => <div role="dialog">Funding {props.network}</div> }));
vi.mock('@/components/telegram/TgPolicySettings', () => ({ TgPolicySettings: () => <div>Controls</div> }));
vi.mock('@/components/telegram/TgHelp', () => ({ TgHelp: () => <div>Help</div> }));
let root: Root, host: HTMLDivElement;

beforeEach(() => {
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
  localStorage.clear();
  vi.stubGlobal('scrollTo', vi.fn());
  mocks.connect.mockResolvedValue(undefined);
  mocks.networkState.mockImplementation((network: string) => ({ wallet: '0x1111111111111111111111111111111111111111', balance: network === 'testnet' ? '25000000' : null, summary: null, orders: [], mainnetOrders: [], loading: false, error: '', connecting: false, connect: mocks.connect, refresh: mocks.refresh }));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
const button = (text: string) => [...host.querySelectorAll('button')].find(node => node.textContent === text)!;
async function click(text: string) { await act(async () => button(text).click()); }

it('switches actual internal network context without navigation or carrying a test balance', async () => {
  const original = location.href;
  await act(async () => root.render(<TgApp />));
  expect(host.querySelector('.tg-app')?.getAttribute('data-network')).toBe('testnet');
  expect(host.textContent).toContain('25.000000');
  await click('Mainnet');
  expect(host.querySelector('[data-testid="catalog"]')?.getAttribute('data-network')).toBe('mainnet');
  expect(host.textContent).toContain('Real USDC');
  expect(host.textContent).toContain('Balance unavailable');
  expect(host.textContent).not.toContain('25.000000');
  expect(location.href).toBe(original);
});

it('blocks network and tab switches while signing', async () => {
  await act(async () => root.render(<TgApp />));
  await click('Start signing');
  expect(button('Mainnet').disabled).toBe(true);
  expect(button('Wallet').disabled).toBe(true);
  await click('Mainnet');
  expect(host.querySelector('.tg-app')?.getAttribute('data-network')).toBe('testnet');
  await click('Finish signing');
  await click('Mainnet');
  expect(host.querySelector('.tg-app')?.getAttribute('data-network')).toBe('mainnet');
});

it('unmounts the old network funding state before opening the other network', async () => {
  await act(async () => root.render(<TgApp />));
  await click('Wallet'); await click('Fund');
  expect(host.querySelector('[role="dialog"]')?.textContent).toBe('Funding testnet');
  await click('Mainnet');
  expect(host.querySelector('[role="dialog"]')).toBeNull();
  expect(host.querySelector('[data-testid="catalog"]')?.getAttribute('data-network')).toBe('mainnet');
});

it('persists public source and network preferences across keyed remount and reload', async () => {
  await act(async () => root.render(<TgApp />));
  await click('Wallet');
  await click('Create wallet');
  await click('Use MetaMask / Rabby instead');
  await click('Mainnet');
  expect(mocks.networkState).toHaveBeenLastCalledWith('mainnet', undefined, undefined);
  expect(localStorage.getItem('mercenta-tg-wallet-source')).toBe('external');
  expect(localStorage.getItem('mercenta-tg-network')).toBe('mainnet');
  await act(async () => root.unmount());
  root = createRoot(host);
  await act(async () => root.render(<TgApp />));
  expect(mocks.networkState).toHaveBeenLastCalledWith('mainnet', undefined, undefined);
});

it('exposes missing wallet provider feedback without invented balances', async () => {
  vi.mocked(useTelegramNetwork).mockReturnValue({ wallet: null, balance: null, summary: null, orders: [], mainnetOrders: [], loading: false, error: 'No wallet provider available', connecting: false, connect: mocks.connect, refresh: mocks.refresh });
  await act(async () => root.render(<TgApp />));
  expect(host.querySelector('[role="alert"]')?.textContent).toContain('No wallet provider available');
  expect(host.textContent).not.toContain('25.000000');
  await click('Connect wallet');
  expect(host.textContent).toContain('Create encrypted wallet');
  expect(mocks.connect).not.toHaveBeenCalled();
});
