'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/product/ProductShell';
import { DepositIntentForm } from '@/components/product/DepositIntentForm';
import { AddUsdcDialog } from '@/components/onramp/AddUsdcDialog';
import { checkoutApi, testAmount } from '@/lib/test-checkout';
import type { NetworkMode } from '@/lib/network-profile';
import type { TelegramSummary } from './useTelegramNetwork';

type Deposit = Record<string, string | number | null>;

export function TgTopUpModal({ network, summary, wallet, onClose, onRefresh, onLock, onConnect }: {
  network: NetworkMode;
  summary: TelegramSummary | null;
  wallet: string | null;
  onClose: () => void;
  onRefresh: () => void;
  onLock: (locked: boolean) => void;
  onConnect: () => void;
}) {
  const [deposit, setDeposit] = useState<Deposit | null>(null);
  const [hash, setHash] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [credited, setCredited] = useState(false);
  const [productionFunding, setProductionFunding] = useState<boolean | null>(null);

  useEffect(() => {
    if (network !== 'mainnet') return;
    let live = true;
    fetch('/api/onramp/config', { cache: 'no-store' }).then(async response => {
      if (!response.ok) throw new Error('FUNDING_UNAVAILABLE');
      const config = await response.json();
      if (live) setProductionFunding(config.enabled === true && config.environment === 'production');
    }).catch(() => { if (live) setProductionFunding(false); });
    return () => { live = false; };
  }, [network]);

  useEffect(() => {
    if (network !== 'mainnet') return;
    onLock(true);
    return () => onLock(false);
  }, [network, onLock]);

  if (network === 'mainnet') {
    if (productionFunding !== true) return <Modal title="Add Mainnet USDC" onClose={onClose}><p role="status">{productionFunding === null ? 'Checking Mainnet funding availability…' : 'Production funding is unavailable on this origin. Sandbox funding is not offered as real USDC.'}</p></Modal>;
    return <AddUsdcDialog onClose={() => { onClose(); onRefresh(); }} />;
  }

  async function create(body: { requestId: string; amount: string }) {
    onLock(true);
    setBusy(true);
    try { return await checkoutApi<Deposit>('deposits', body); }
    finally { onLock(false); setBusy(false); }
  }

  async function verify() {
    if (!deposit || busy) return;
    setBusy(true);
    onLock(true);
    setError('');
    try {
      const result = await checkoutApi<Deposit>(`deposits/${deposit.id}/verify`, { txHash: hash });
      setDeposit(result);
      setCredited(result.status === 'CREDITED');
      onRefresh();
    } catch { setError('Deposit could not be verified. No credit is assumed. Check the hash and retry the same deposit.'); }
    finally { setBusy(false); onLock(false); }
  }

  return <Modal title="Add test USDC" canClose={!busy} onClose={onClose}>
    <div className="tg-funding">
      <p>Arc Testnet only. Create an intent, transfer test USDC manually, then verify. An intent does not move or credit funds.</p>
      {!deposit ? <DepositIntentForm wallet={wallet} receiver={summary?.merchantAddress ?? null} readOnly={!summary || !!summary.readOnly || !summary.depositConfigured} busy={busy} lang="en" create={create} onCreated={setDeposit} onSwitchWallet={onConnect} /> : <>
        <h3>Deposit destination</h3><code>{String(deposit.receiver)}</code>
        <p>{testAmount(String(deposit.expected_units))} test USDC</p>
        <p>Send only on Arc Testnet. Keep test USDC for network fees. Do not send Mainnet funds.</p>
        {credited ? <p role="status">Deposit verified and credited.</p> : <><label htmlFor="tg-deposit-hash">Transaction hash</label><input id="tg-deposit-hash" value={hash} disabled={busy} onChange={event => setHash(event.target.value)} placeholder="0x…" /><button className="tg-action" disabled={busy || !/^0x[a-fA-F0-9]{64}$/.test(hash)} onClick={() => void verify()}>{busy ? 'Verifying…' : 'Verify deposit'}</button></>}
      </>}
      {error && <p role="alert">{error}</p>}
    </div>
  </Modal>;
}
