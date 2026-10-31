'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/product/ProductShell';
import type { useArcWallet } from './useArcWallet';

type LocalWallet = ReturnType<typeof useArcWallet>;
export function TgLocalWallet({ wallet, onSignIn, onExternal, onClose }: { wallet: LocalWallet; onSignIn: () => void; onExternal: () => void; onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [backup, setBackup] = useState('');
  const [exported, setExported] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (wallet.provider) return;
    setExported('');
  }, [wallet.provider]);
  useEffect(() => {
    if (!exported) return;
    const timer = setTimeout(() => setExported(''), 30_000);
    return () => clearTimeout(timer);
  }, [exported]);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(''); setExported('');
    try {
      if (backup) await wallet.restore(backup, password);
      else if (wallet.vault) await wallet.unlock(password);
      else {
        if (password !== confirmation) throw new Error('Passwords do not match.');
        await wallet.create(password);
      }
    } catch (reason) { setError((reason as Error).message); }
    finally { setPassword(''); setConfirmation(''); }
  }
  async function reveal() {
    setError('');
    try { setExported(await wallet.exportKey(password)); }
    catch (reason) { setError((reason as Error).message); }
    finally { setPassword(''); }
  }
  function download() {
    if (!wallet.vault) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(wallet.vault)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `mercenta-wallet-${wallet.address}.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <Modal title="Your Mercenta wallet" canClose={!wallet.busy} onClose={onClose}><div className="tg-local-wallet">
    <p>A non-custodial EVM wallet created on this device. Your password encrypts the key locally; Mercenta cannot recover it. Clearing browser data without a backup can permanently lose access.</p>
    {wallet.address && <code>{wallet.address}</code>}
    {wallet.provider ? <><p role="status">Wallet unlocked. Payments always require separate confirmation.</p><button className="tg-action" onClick={onSignIn}>Sign in with this wallet</button><button className="tg-secondary" onClick={() => { setExported(''); wallet.lock(); }}>Lock wallet</button></> : <form onSubmit={submit}>
      {wallet.legacy && !wallet.vault && <p role="alert">An older unencrypted wallet exists. Encrypting preserves its address and removes the plaintext key only after the encrypted wallet is saved. No new address is generated.</p>}
      <label htmlFor="vault-password">{wallet.vault ? 'Unlock password' : 'Choose a password (12+ characters)'}</label><input id="vault-password" type="password" autoComplete={wallet.vault ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={wallet.vault ? 1 : 12} disabled={wallet.busy} />
      {!wallet.vault && !backup && <><label htmlFor="vault-confirm">Confirm password</label><input id="vault-confirm" type="password" autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} required minLength={12} disabled={wallet.busy} /></>}
      {!wallet.vault && !wallet.legacy && <details><summary>Restore encrypted Mercenta backup</summary><label htmlFor="vault-backup">Mercenta backup JSON</label><textarea id="vault-backup" maxLength={4096} value={backup} onChange={e => setBackup(e.target.value)} /></details>}
      <button className="tg-action" type="submit" disabled={wallet.busy}>{wallet.busy ? 'Securing wallet…' : backup ? 'Restore wallet' : wallet.vault ? 'Unlock wallet' : wallet.legacy ? 'Encrypt existing wallet' : 'Create encrypted wallet'}</button>
    </form>}
    {wallet.vault && <><button className="tg-secondary" onClick={download}>Download encrypted backup</button><p>This is a Mercenta backup, not a MetaMask JSON keystore. Keep the password separately.</p><details onToggle={e => { if (!e.currentTarget.open) { setExported(''); setPassword(''); } }}><summary>Export to MetaMask / Rabby</summary><p>In MetaMask or Rabby, choose Import account → Private key. Never send the key to support or a website. Anyone with this key controls your funds.</p><label htmlFor="vault-export-password">Re-enter your wallet password</label><input id="vault-export-password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /><button className="tg-secondary" onClick={() => void reveal()}>Reveal private key</button>{exported && <><code className="tg-secret">{exported}</code><button className="tg-secondary" onClick={() => setExported('')}>Hide private key</button><p>Visible for 30 seconds. Select and copy only into your wallet application.</p></>}</details></>}
    {(error || wallet.error) && <p role="alert">{error || wallet.error}</p>}
    <button className="tg-secondary" disabled={wallet.busy} onClick={onExternal}>Use MetaMask / Rabby instead</button>
  </div></Modal>;
}

export function TgWalletApproval({ wallet }: { wallet: LocalWallet }) {
  const request = wallet.approval;
  const [remaining, setRemaining] = useState(90);
  useEffect(() => {
    if (!request) return;
    setRemaining(90);
    const timer = setInterval(() => setRemaining(value => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [request]);
  if (!request) return null;
  return <Modal title={request.kind === 'message' ? 'Confirm wallet sign-in' : 'Confirm USDC transfer'} onClose={() => wallet.answer(false)}><div className="tg-local-wallet">
    {request.kind === 'message' ? <><p>This signature proves ownership for Mercenta sign-in. It does not transfer funds.</p><pre>{request.message}</pre></> : <><p>Real funds will leave your wallet. Review every field before approving.</p><dl><dt>Network</dt><dd>{request.chain}</dd><dt>Recipient</dt><dd><code>{request.to}</code></dd><dt>Amount</dt><dd>{request.amount} USDC</dd><dt>Maximum network fee</dt><dd>{request.fee} USDC</dd><dt>Maximum total</dt><dd>{request.total} USDC</dd></dl><p>Confirmation expires in {remaining} seconds.</p></>}
    <button className="tg-action" disabled={remaining === 0} onClick={() => wallet.answer(true)}>{request.kind === 'message' ? 'Sign in' : `Send ${request.amount} USDC`}</button><button className="tg-secondary" onClick={() => wallet.answer(false)}>Cancel</button>
  </div></Modal>;
}
