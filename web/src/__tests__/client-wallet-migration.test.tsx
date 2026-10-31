// @vitest-environment jsdom
import { webcrypto } from 'node:crypto';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { useArcWallet } from '@/components/telegram/useArcWallet';
import { LEGACY_KEY, VAULT_KEY, decryptWallet, parseVault } from '@/lib/client-wallet-vault';
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

it('migrates the legacy key without replacing its address and restores locked', async () => {
  vi.stubGlobal('crypto', webcrypto);
  Object.defineProperty(navigator, 'locks', { configurable: true, value: { request: async (_name: string, callback: () => unknown) => callback() } });
  localStorage.clear();
  const privateKey = ('0x' + '56'.repeat(32)) as `0x${string}`;
  localStorage.setItem(LEGACY_KEY, privateKey);
  let wallet: ReturnType<typeof useArcWallet>;
  function Harness() { wallet = useArcWallet('testnet'); return null; }
  const host = document.createElement('div'); document.body.append(host); let root = createRoot(host);
  try {
    await act(async () => root.render(<Harness />));
    expect(wallet!.legacy).toBe(true);
    await act(async () => wallet!.create('migration-test-password'));
    expect(wallet!.provider).not.toBeNull();
    const address = wallet!.address;
    expect(localStorage.getItem(LEGACY_KEY)).toBeNull();
    const vault = parseVault(localStorage.getItem(VAULT_KEY)!);
    expect(await decryptWallet(vault, 'migration-test-password')).toBe(privateKey);
    expect(vault.address).toBe(address);
    await act(async () => root.unmount());
    root = createRoot(host);
    await act(async () => root.render(<Harness />));
    expect(wallet!.address).toBe(address);
    expect(wallet!.provider).toBeNull();
    await act(async () => {
      const pending = wallet!.unlock('migration-test-password');
      wallet!.lock();
      await pending;
    });
    expect(wallet!.provider).toBeNull();
  } finally { await act(async () => root.unmount()); host.remove(); localStorage.clear(); vi.unstubAllGlobals(); }
});
