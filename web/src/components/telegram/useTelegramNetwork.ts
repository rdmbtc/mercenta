'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { connectWallet, ensureArcChain, fetchSession, signInWithWallet } from '@/lib/wallet';
import { NETWORKS, type NetworkMode } from '@/lib/network-profile';
import { checkoutApi } from '@/lib/test-checkout';
import { getMainnetOrders, syncRemoteOrders, type MainnetOrder } from '@/lib/mainnet-orders';

export type TelegramSummary = { availableUnits: string; wallet: string; depositConfigured: boolean; merchantAddress: string | null; readOnly?: boolean };
export type TelegramOrder = { id: string; name: string; amount_units: string; status: string; product_id?: string };

export function useTelegramNetwork(network: NetworkMode) {
  const [wallet, setWallet] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [summary, setSummary] = useState<TelegramSummary | null>(null);
  const [orders, setOrders] = useState<TelegramOrder[]>([]);
  const [mainnetOrders, setMainnetOrders] = useState<MainnetOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState(false);
  const generation = useRef(0);
  const syncing = useRef(false);

  const refresh = useCallback(async () => {
    const version = ++generation.current;
    setLoading(true);
    setError('');
    setBalance(null);
    setSummary(null);
    setOrders([]);
    setMainnetOrders([]);
    try {
      const session = await fetchSession();
      if (version !== generation.current) return;
      const address = session.authenticated ? session.address : null;
      setWallet(address);
      if (!address) return;
      if (network === 'testnet') {
        const result = await checkoutApi<TelegramSummary>('summary');
        if (version !== generation.current) return;
        setSummary(result);
        setBalance(result.availableUnits);
        const history = await checkoutApi<{ items: TelegramOrder[] }>('orders?page=1&pageSize=25');
        if (version === generation.current) setOrders(history.items);
      } else {
        syncing.current = true;
        try { await syncRemoteOrders(address); } finally { syncing.current = false; }
        if (version !== generation.current) return;
        setMainnetOrders(getMainnetOrders(address));
        const provider = window.ethereum;
        if (!provider) throw new Error('Wallet connection is unavailable in this Telegram browser. A compatible wallet provider is required.');
        const accounts = await provider.request({ method: 'eth_accounts' }) as string[];
        if (accounts[0]?.toLowerCase() !== address.toLowerCase()) throw new Error('Select the signed-in wallet to read your Mainnet balance.');
        const chain = Number(await provider.request({ method: 'eth_chainId' }));
        if (chain !== NETWORKS.mainnet.chainId) throw new Error('Switch your wallet to Arc Mainnet to read its balance.');
        const raw = await provider.request({ method: 'eth_getBalance', params: [address, 'latest'] }) as string;
        if (version === generation.current) setBalance((BigInt(raw) / 1_000_000_000_000n).toString());
      }
    } catch (reason) {
      if (version === generation.current) setError(reason instanceof Error ? reason.message : 'Network data is unavailable.');
    } finally {
      if (version === generation.current) setLoading(false);
    }
  }, [network]);

  useEffect(() => {
    void refresh();
    const changed = () => { if (!syncing.current) void refresh(); };
    window.addEventListener('mercenta-auth-change', changed);
    window.addEventListener('mercenta-wallet-balance-refresh', changed);
    window.addEventListener('mercenta-order-completed', changed);
    const provider = window.ethereum;
    provider?.on?.('accountsChanged', changed);
    provider?.on?.('chainChanged', changed);
    return () => {
      generation.current++;
      window.removeEventListener('mercenta-auth-change', changed);
      window.removeEventListener('mercenta-wallet-balance-refresh', changed);
      window.removeEventListener('mercenta-order-completed', changed);
      provider?.removeListener?.('accountsChanged', changed);
      provider?.removeListener?.('chainChanged', changed);
    };
  }, [refresh]);

  async function connect() {
    if (connecting) return;
    setConnecting(true);
    setError('');
    try {
      if (!window.ethereum) throw new Error('This Telegram browser has no compatible wallet provider. Wallet signing is unavailable; no funds have been moved.');
      const address = await connectWallet();
      if (!await ensureArcChain(network === 'mainnet')) throw new Error(`Switch to ${NETWORKS[network].name} in your wallet and retry.`);
      await signInWithWallet(address);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Wallet connection failed.');
    } finally { setConnecting(false); }
  }

  return { wallet, balance, summary, orders, mainnetOrders, loading, error, connecting, connect, refresh };
}
