'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ShoppingBag, Wallet, ShieldCheck, HelpCircle, ArrowUpRight } from 'lucide-react';
import { TgCatalog } from './TgCatalog';
import { TgProfile } from './TgProfile';
import { TgPolicySettings } from './TgPolicySettings';
import { TgHelp } from './TgHelp';
import { TgTopUpModal } from './TgTopUpModal';
import { useTelegramNetwork } from './useTelegramNetwork';
import { NETWORKS, type NetworkMode } from '@/lib/network-profile';
import { testAmount } from '@/lib/test-checkout';
import './telegram.css';

type Tab = 'store' | 'profile' | 'policy' | 'help';
const NAV_TABS = [
  { id: 'store', label: 'Store', icon: ShoppingBag },
  { id: 'profile', label: 'Wallet', icon: Wallet },
  { id: 'policy', label: 'Controls', icon: ShieldCheck },
  { id: 'help', label: 'Help', icon: HelpCircle },
] as const;
const TAB_INTROS = {
  store: ['Your digital essentials.', 'Games, subscriptions and tools. All in one place.'],
  profile: ['Your wallet.', 'Manage your balance and find your orders.'],
  policy: ['You set the limits.', 'Keep every purchase inside your rules.'],
  help: ['A little help.', 'Answers, documentation and a direct line to support.'],
};

export function TgApp() {
  const [network, setNetwork] = useState<NetworkMode>('testnet');
  const [locked, setLocked] = useState(false);
  return <TelegramNetworkApp key={network} network={network} locked={locked} onLock={setLocked} onNetwork={next => { if (!locked) setNetwork(next); }} />;
}

function TelegramNetworkApp({ network, locked, onLock, onNetwork }: { network: NetworkMode; locked: boolean; onLock: (value: boolean) => void; onNetwork: (network: NetworkMode) => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('store');
  const [topUpOpen, setTopUpOpen] = useState(false);
  const state = useTelegramNetwork(network);
  const busy = locked || state.connecting;
  const chooseTab = (tab: Tab) => {
    if (busy) return;
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  async function connect() {
    onLock(true);
    try { await state.connect(); } finally { onLock(false); }
  }

  return <div className="tg-app" data-network={network} onClickCapture={event => {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
    if (!link) return;
    const target = new URL(link.href, window.location.href);
    if (target.origin !== window.location.origin) return;
    const section = target.searchParams.get('section');
    if ((target.pathname === '/app' && (section === 'orders' || section === 'funds')) || target.pathname === '/support') {
      event.preventDefault();
      if (busy) return;
      chooseTab(target.pathname === '/support' ? 'help' : 'profile');
      if (section === 'funds') setTopUpOpen(true);
    }
  }}>
    <header className="tg-header"><div className="tg-header-inner">
      <button className="tg-brand" disabled={busy} onClick={() => chooseTab('store')} aria-label="Mercenta store"><Image src="/mercenta-mark.webp" alt="" width={30} height={30} /><span>mercenta<span className="tg-brand-dot">.</span></span></button>
      <button className="tg-balance" disabled={busy} onClick={() => state.wallet ? chooseTab('profile') : void connect()}>
        {state.connecting ? 'Connecting…' : state.wallet ? <span>{state.balance === null ? 'Balance unavailable' : testAmount(state.balance)} <small>{NETWORKS[network].asset}</small></span> : 'Connect wallet'}
      </button>
    </div></header>
    <main className="tg-main">
      <div className="tg-network-selector" role="group" aria-label="Network">
        {(['testnet', 'mainnet'] as const).map(mode => <button key={mode} disabled={busy} aria-pressed={network === mode} onClick={() => onNetwork(mode)}>{mode === 'testnet' ? 'Testnet' : 'Mainnet'}</button>)}
      </div>
      <p className="tg-network-status" role="status">{NETWORKS[network].name} · {NETWORKS[network].chainId} · {network === 'mainnet' ? 'Real USDC' : 'Test funds only'}</p>
      {state.error && <div className="tg-network-error" role="alert"><p>{state.error}</p><button className="tg-secondary" disabled={busy || state.loading} onClick={() => void state.refresh()}>Retry network data</button></div>}
      <div className="tg-intro"><h1>{TAB_INTROS[activeTab][0]}</h1><p>{TAB_INTROS[activeTab][1]}</p></div>
      {activeTab === 'store' && <>
        <section className="tg-feature" aria-label={`${NETWORKS[network].name} store`}><div className="tg-feature-copy"><span className="tg-preview-label">{NETWORKS[network].name}</span><h2>Good things.<br />Within your rules.</h2><a href="#tg-products">Browse the catalog <ArrowUpRight size={17} /></a></div><Image src="/policy-gate.webp" alt="" width={1264} height={848} className="tg-feature-art" priority /></section>
        <TgCatalog network={network} wallet={state.wallet} readOnly={network === 'testnet' && (!state.summary || !!state.summary.readOnly)} onConnect={() => void connect()} onLock={onLock} />
      </>}
      {activeTab === 'profile' && <TgProfile network={network} state={state} onOpenTopUp={() => setTopUpOpen(true)} />}
      {activeTab === 'policy' && <><p className="tg-network-note">Preferences on this device only. These controls do not change server-enforced checkout rules.</p><TgPolicySettings key={network} network={network} /></>}
      {activeTab === 'help' && <TgHelp />}
    </main>
    <nav className="tg-nav" aria-label="Main navigation"><div className="tg-nav-inner">{NAV_TABS.map(({ id, label, icon: Icon }) => <button key={id} disabled={busy} onClick={() => chooseTab(id)} aria-current={activeTab === id ? 'page' : undefined}><Icon size={21} strokeWidth={activeTab === id ? 2 : 1.7} /><span>{label}</span></button>)}</div></nav>
    {topUpOpen && <TgTopUpModal network={network} wallet={state.wallet} summary={state.summary} onClose={() => { setTopUpOpen(false); onLock(false); }} onRefresh={() => void state.refresh()} onLock={onLock} onConnect={() => void connect()} />}
  </div>;
}
