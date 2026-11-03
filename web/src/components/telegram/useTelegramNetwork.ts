'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { connectWallet, ensureArcChain, fetchSession, signInWithWallet, type Eip1193Provider } from '@/lib/wallet';
import { NETWORKS, type NetworkMode } from '@/lib/network-profile';
import { checkoutApi } from '@/lib/test-checkout';
import { getMainnetOrders, syncRemoteOrders, type MainnetOrder } from '@/lib/mainnet-orders';

export type TelegramSummary = { availableUnits: string; wallet: string; depositConfigured: boolean; merchantAddress: string | null; readOnly?: boolean };
export type TelegramOrder = { id: string; name: string; amount_units: string; status: string; product_id?: string };

// A fixed public endpoint is used only for read-only balance queries, never signing.
const MAINNET_READ_RPC = 'https://rpc.mainnet.arc.io';

export function useTelegramNetwork(network: NetworkMode, localProvider?: Eip1193Provider | null, localAddress?: string | null) {
  const localSelected = localProvider !== undefined || localAddress !== undefined;
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
    // Preserve only an identity that still belongs to the explicitly selected vault.
    if (localSelected) setWallet(current => current?.toLowerCase() === localAddress?.toLowerCase() ? current : null);
    setBalance(null);
    setSummary(null);
    setOrders([]);
    setMainnetOrders([]);
    try {
      const session = await fetchSession();
      if (version !== generation.current) return;
      const address = session.authenticated ? session.address : null;
      if (localSelected && (!localAddress || address?.toLowerCase() !== localAddress.toLowerCase())) {
        setWallet(null);
        return;
      }
      if (localProvider && address) {
        const accounts = await localProvider.request({ method: 'eth_accounts' }) as string[];
        if (version !== generation.current) return;
        if (accounts[0]?.toLowerCase() !== address.toLowerCase()) { setWallet(null); return; }
      }
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
        const publicProvider: Eip1193Provider = { request: async ({ method, params }) => {
          const response = await fetch(MAINNET_READ_RPC, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
          if (!response.ok) throw new Error('Public RPC is unavailable.');
          const payload = await response.json() as { result?: string; error?: { message?: string } };
          if (payload.error || !/^0x[0-9a-f]+$/i.test(payload.result ?? '')) throw new Error(payload.error?.message ?? 'Invalid public RPC balance.');
          return payload.result;
        } };
        const provider = localSelected ? localProvider ?? publicProvider : window.ethereum;
        if (!provider) throw new Error('Wallet connection is unavailable in this Telegram browser. A compatible wallet provider is required.');
        const readOnly = localSelected && !localProvider;
        const accounts = readOnly ? [address] : await provider.request({ method: 'eth_accounts' }) as string[];
        if (accounts[0]?.toLowerCase() !== address.toLowerCase()) throw new Error('Select the signed-in wallet to read your Mainnet balance.');
        const chain = readOnly ? NETWORKS.mainnet.chainId : Number(await provider.request({ method: 'eth_chainId' }));
        if (chain !== NETWORKS.mainnet.chainId) throw new Error('Switch your wallet to Arc Mainnet to read its balance.');
        const raw = await provider.request({ method: 'eth_getBalance', params: [address, 'latest'] }) as string;
        if (version === generation.current) setBalance((BigInt(raw) / 1_000_000_000_000n).toString());
      }
    } catch (reason) {
      if (version === generation.current) setError(reason instanceof Error ? reason.message : 'Network data is unavailable.');
    } finally {
      if (version === generation.current) setLoading(false);
    }
  }, [network, localProvider, localAddress, localSelected]);

  useEffect(() => {
    void refresh();
    const changed = () => { if (!syncing.current) void refresh(); };
    window.addEventListener('mercenta-auth-change', changed);
    window.addEventListener('mercenta-wallet-balance-refresh', changed);
    window.addEventListener('mercenta-order-completed', changed);
    const provider = localSelected ? localProvider : window.ethereum;
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
  }, [refresh, localProvider, localSelected]);

  const latestRefresh = useRef(refresh);
  latestRefresh.current = refresh;

  async function connect(externalOnly = false) {
    if (connecting) return;
    setConnecting(true);
    setError('');
    try {
      const selectedLocal = externalOnly ? null : localProvider;
      if (!externalOnly && localSelected && !selectedLocal) throw new Error('Unlock your Mercenta wallet before signing.');
      const provider = selectedLocal ?? window.ethereum;
      if (!provider) throw new Error('Create or unlock your Mercenta wallet, or connect an external wallet.');
      const address = selectedLocal ? (await provider.request({ method: 'eth_requestAccounts' }) as `0x${string}`[])[0] : await connectWallet();
      if (!selectedLocal && !await ensureArcChain(network === 'mainnet')) throw new Error(`Switch to ${NETWORKS[network].name} in your wallet and retry.`);
      if (!address) throw new Error('No wallet account selected.');
      const session = await fetchSession();
      if (!session.authenticated || session.address?.toLowerCase() !== address.toLowerCase()) await signInWithWallet(address, provider);
      await latestRefresh.current();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Wallet connection failed.');
    } finally { setConnecting(false); }
  }

  return { wallet, balance, summary, orders, mainnetOrders, loading, error, connecting, connect, refresh };
}
