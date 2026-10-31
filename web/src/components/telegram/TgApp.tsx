'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ShoppingBag, Wallet, ShieldCheck, HelpCircle, Plus, ArrowUpRight } from 'lucide-react';
import { TgCatalog } from './TgCatalog';
import { TgProfile } from './TgProfile';
import { TgPolicySettings } from './TgPolicySettings';
import { TgHelp } from './TgHelp';
import { TgTopUpModal } from './TgTopUpModal';
import { useArcWallet } from './useArcWallet';
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
  const [activeTab, setActiveTab] = useState<Tab>('store');
  const [topUpOpen, setTopUpOpen] = useState(false);
  const { wallet, deductBalance } = useArcWallet();

  function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') {
    if (typeof window === 'undefined') return;
    const tg = (window as Window & { Telegram?: { WebApp?: { HapticFeedback?: { impactOccurred(t: string): void; notificationOccurred(t: string): void } } } }).Telegram?.WebApp;
    try {
      if (['success', 'warning', 'error'].includes(type)) tg?.HapticFeedback?.notificationOccurred(type);
      else tg?.HapticFeedback?.impactOccurred(type);
    } catch {}
  }

  function handleTabChange(tab: Tab) {
    triggerHaptic();
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  return (
    <div className="tg-app">
      <header className="tg-header">
        <div className="tg-header-inner">
          <button className="tg-brand" onClick={() => handleTabChange('store')} aria-label="Mercenta store">
            <Image src="/mercenta-mark.webp" alt="" width={30} height={30} />
            <span>mercenta<span className="tg-brand-dot">.</span></span>
          </button>
          <button className="tg-balance" onClick={() => { triggerHaptic(); setTopUpOpen(true); }} aria-label={`Balance ${wallet.balanceUsdc.toFixed(2)} USDC. Top up`}>
            <span>{wallet.balanceUsdc.toFixed(2)} <small>USDC</small></span>
            <Plus size={16} />
          </button>
        </div>
      </header>

      <main className="tg-main">
        <div className="tg-intro">
          <h1>{TAB_INTROS[activeTab][0]}</h1>
          <p>{TAB_INTROS[activeTab][1]}</p>
        </div>
        {activeTab === 'store' && (
          <>
            <section className="tg-feature" aria-label="Digital store preview">
              <div className="tg-feature-copy">
                <span className="tg-preview-label">Store preview</span>
                <h2>Good things.<br />Within your rules.</h2>
                <a href="#tg-products">Explore the catalog <ArrowUpRight size={17} /></a>
              </div>
              <Image src="/policy-gate.webp" alt="" width={1264} height={848} className="tg-feature-art" priority />
            </section>
            <TgCatalog balanceUsdc={wallet.balanceUsdc} onDeductBalance={deductBalance} onOpenTopUp={() => setTopUpOpen(true)} triggerHaptic={triggerHaptic} />
          </>
        )}
        {activeTab === 'profile' && <TgProfile wallet={wallet} onOpenTopUp={() => setTopUpOpen(true)} onResetWallet={() => {}} triggerHaptic={triggerHaptic} />}
        {activeTab === 'policy' && <TgPolicySettings triggerHaptic={triggerHaptic} />}
        {activeTab === 'help' && <TgHelp triggerHaptic={triggerHaptic} />}
      </main>

      <nav className="tg-nav" aria-label="Main navigation">
        <div className="tg-nav-inner">
          {NAV_TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => handleTabChange(id)} aria-current={activeTab === id ? 'page' : undefined}>
              <Icon size={21} strokeWidth={activeTab === id ? 2 : 1.7} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>
      <TgTopUpModal isOpen={topUpOpen} onClose={() => setTopUpOpen(false)} arcAddress={wallet.address} triggerHaptic={triggerHaptic} />
    </div>
  );
}
