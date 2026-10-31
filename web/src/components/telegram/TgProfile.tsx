'use client';

import { useState } from 'react';
import { Wallet, RefreshCw } from 'lucide-react';
import type { NetworkMode } from '@/lib/network-profile';
import { testAmount } from '@/lib/test-checkout';
import { truncateAddress } from '@/lib/wallet';
import { MainnetDeliveryModal } from '@/components/product/MainnetDeliveryModal';
import { OrderDeliveryDialog } from '@/components/product/TestCheckout';
import type { MainnetOrder } from '@/lib/mainnet-orders';
import type { useTelegramNetwork } from './useTelegramNetwork';

type NetworkState = ReturnType<typeof useTelegramNetwork>;

export function TgProfile({ network, state, onOpenTopUp }: { network: NetworkMode; state: NetworkState; onOpenTopUp: () => void }) {
  const [delivery, setDelivery] = useState<MainnetOrder | null>(null);
  const [testDelivery, setTestDelivery] = useState<string | null>(null);
  return <section className="tg-wallet-view">
    <div className="tg-wallet-panel">
      <Wallet size={24} />
      <h2>{network === 'mainnet' ? 'Wallet balance' : 'Test account balance'}</h2>
      <p className="tg-wallet-amount">{state.loading ? 'Loading…' : state.balance === null ? 'Unavailable' : testAmount(state.balance)} <small>{network === 'mainnet' ? 'USDC' : 'test USDC'}</small></p>
      <p>{state.wallet ? truncateAddress(state.wallet) : 'Sign in to read your balance. No sample funds are displayed.'}</p>
      <p>{network === 'mainnet' ? 'Real funds in your connected Arc wallet. Testnet funds are separate.' : 'Verified test account funds. Not redeemable for real USDC.'}</p>
      <div className="tg-wallet-actions"><button className="tg-action" disabled={!state.wallet || state.loading} onClick={onOpenTopUp}>{network === 'mainnet' ? 'Add USDC' : 'Add test USDC'}</button><button className="tg-secondary" disabled={state.loading} onClick={() => void state.refresh()}><RefreshCw size={16} /> Refresh</button></div>
    </div>
    <section className="tg-order-history"><h2>Your purchases</h2>
      {!state.wallet ? <p>Sign in to view private purchase history.</p> : state.loading ? <p role="status">Loading purchases…</p> : state.error ? <p role="status">History may be unavailable or incomplete. Refresh to retry.</p> : null}
      {network === 'mainnet' ? state.mainnetOrders.map(order => <button className="tg-order" key={order.id} onClick={() => setDelivery(order)}><strong>{order.name}</strong><span>{testAmount(order.amount_units)} USDC · {order.status}</span><span>View order record</span></button>) : state.orders.map(order => <div className="tg-order" key={order.id}><strong>{order.name}</strong><span>{testAmount(order.amount_units)} test USDC · {order.status}</span>{order.product_id?.startsWith('catalog-test:') && <button className="tg-secondary" onClick={() => setTestDelivery(order.id)}>View test delivery</button>}</div>)}
      {state.wallet && !state.loading && !state.error && !(network === 'mainnet' ? state.mainnetOrders.length : state.orders.length) && <p>No purchases on this network yet.</p>}
    </section>
    {delivery && <MainnetDeliveryModal order={delivery} ru={false} onClose={() => setDelivery(null)} />}
    {testDelivery && <OrderDeliveryDialog id={testDelivery} ru={false} onClose={() => setTestDelivery(null)} />}
  </section>;
}
