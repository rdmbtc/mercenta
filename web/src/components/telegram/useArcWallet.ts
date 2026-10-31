'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { decryptWallet, encryptWallet, LEGACY_KEY, parseVault, persistVault, VAULT_KEY, type WalletVault } from '@/lib/client-wallet-vault';
import { createLocalProvider, type LocalApproval } from '@/lib/client-wallet-provider';
import type { NetworkMode } from '@/lib/network-profile';
import type { Eip1193Provider } from '@/lib/wallet';

export function useArcWallet(network: NetworkMode) {
  const [vault, setVault] = useState<WalletVault | null>(null);
  const [legacy, setLegacy] = useState(false);
  const [provider, setProvider] = useState<Eip1193Provider | null>(null);
  const [approval, setApproval] = useState<LocalApproval | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const operation = useRef(0);
  const inFlight = useRef(false);
  const session = useRef<ReturnType<typeof createLocalProvider> | null>(null);
  const resolveApproval = useRef<((value: boolean) => void) | null>(null);
  const lock = useCallback(() => {
    operation.current++;
    resolveApproval.current?.(false); resolveApproval.current = null;
    session.current?.lock(); session.current = null;
    setProvider(null); setApproval(null);
  }, []);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(VAULT_KEY);
      if (stored) setVault(parseVault(stored));
      setLegacy(!!localStorage.getItem(LEGACY_KEY));
    } catch { setError('Wallet storage is unavailable or damaged. Restore your encrypted backup; do not overwrite existing data.'); }
    return lock;
  }, [lock]);
  useEffect(() => { lock(); }, [network, lock]);
  useEffect(() => {
    if (!provider) return;
    let timer: ReturnType<typeof setTimeout>;
    const touch = () => { clearTimeout(timer); timer = setTimeout(lock, 5 * 60_000); };
    touch(); window.addEventListener('pointerdown', touch); window.addEventListener('keydown', touch);
    return () => { clearTimeout(timer); window.removeEventListener('pointerdown', touch); window.removeEventListener('keydown', touch); };
  }, [provider, lock]);
  function answer(accepted: boolean) { resolveApproval.current?.(accepted); resolveApproval.current = null; setApproval(null); }
  function activate(key: `0x${string}`) {
    session.current?.lock();
    const next = createLocalProvider(key, network, request => new Promise(resolve => {
      resolveApproval.current?.(false); resolveApproval.current = resolve; setApproval(request);
    }));
    session.current = next; setProvider(next.provider);
  }
  async function run(action: (version: number) => Promise<void>) {
    if (inFlight.current) return;
    inFlight.current = true;
    const version = operation.current;
    setBusy(true); setError('');
    try { await action(version); } catch (reason) { if (version === operation.current) setError(reason instanceof Error ? reason.message : 'Wallet operation failed.'); }
    finally { inFlight.current = false; setBusy(false); }
  }
  async function persistNew(encrypted: WalletVault, expectedLegacy: string | null, version: number) {
    if (!navigator.locks) throw new Error('This browser cannot safely coordinate wallet storage. Use a browser with Web Locks support.');
    await navigator.locks.request(VAULT_KEY, () => {
      if (version !== operation.current) throw new Error('Wallet operation cancelled.');
      if (localStorage.getItem(VAULT_KEY) || localStorage.getItem(LEGACY_KEY) !== expectedLegacy) throw new Error('Wallet storage changed in another tab. Reload before continuing.');
      persistVault(encrypted);
      if (expectedLegacy) localStorage.removeItem(LEGACY_KEY);
    });
  }
  async function create(password: string) { await run(async version => {
    if (localStorage.getItem(VAULT_KEY)) throw new Error('An encrypted wallet already exists. Unlock or restore it instead.');
    const old = localStorage.getItem(LEGACY_KEY);
    const encrypted = await encryptWallet(password, old ? old as `0x${string}` : undefined);
    const key = await decryptWallet(encrypted, password);
    await persistNew(encrypted, old, version);
    if (version !== operation.current) return;
    setVault(encrypted); setLegacy(false); activate(key);
  }); }
  async function unlock(password: string) { await run(async version => {
    if (!vault) throw new Error('No encrypted wallet found.');
    const key = await decryptWallet(vault, password);
    if (version === operation.current) activate(key);
  }); }
  async function restore(raw: string, password: string) { await run(async version => {
    if (localStorage.getItem(VAULT_KEY) || localStorage.getItem(LEGACY_KEY)) throw new Error('A wallet already exists on this device. Back it up before restoring another wallet.');
    const restored = parseVault(raw); const key = await decryptWallet(restored, password);
    await persistNew(restored, null, version);
    if (version !== operation.current) return;
    setVault(restored); activate(key);
  }); }
  async function exportKey(password: string) { if (!vault) throw new Error('No wallet found.'); return decryptWallet(vault, password); }
  return { address: vault?.address ?? null, vault, legacy, provider, approval, error, busy, create, unlock, lock, restore, exportKey, answer };
}
