// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import WalletButton from '@/components/wallet-button';
import { truncateAddress } from '@/lib/wallet';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root, host: HTMLElement;

beforeEach(() => {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.restoreAllMocks();
});

it('truncateAddress provides both standard and compact formats for responsive display', () => {
  const addr = '0x18fa34567890abcdef1234567890abcdef12a12b';
  const full = truncateAddress(addr);
  const compact = truncateAddress(addr, true);

  expect(full).toBe('0x18fa…a12b');
  expect(compact).toBe('0x18…12b');
  expect(compact.length).toBeLessThan(full.length);
});

it('WalletButton disconnected state renders Connect with responsive wallet-btn-extra', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
  localStorage.clear();

  await act(async () => {
    root.render(<WalletButton />);
  });

  const btn = host.querySelector<HTMLButtonElement>('[data-wallet-btn]');
  expect(btn).toBeTruthy();
  expect(btn?.textContent?.trim()).toBe('Connect wallet');
  expect(host.querySelector('.wallet-btn-extra')?.textContent?.trim()).toBe('wallet');
});

it('WalletButton connected state renders full and compact address nodes for mobile responsive fit', async () => {
  const address = '0x18fa34567890abcdef1234567890abcdef12a12b';
  localStorage.setItem('mercenta_wallet_address', address);
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ authenticated: true, address }),
  }));

  await act(async () => {
    root.render(<WalletButton />);
  });

  const fullNode = host.querySelector('.wallet-addr-full');
  const compactNode = host.querySelector('.wallet-addr-compact');
  expect(fullNode).toBeTruthy();
  expect(compactNode).toBeTruthy();
  expect(fullNode?.textContent).toBe('0x18fa…a12b');
  expect(compactNode?.textContent).toBe('0x18…12b');
});
