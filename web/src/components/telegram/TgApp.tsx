'use client';

import React, { useState, useEffect } from 'react';
import Script from 'next/script';
import { ShoppingBag, ShieldCheck, User, HelpCircle, Plus } from 'lucide-react';
import { useArcWallet } from './useArcWallet';
import { TgCatalog } from './TgCatalog';
import { TgTopUpModal } from './TgTopUpModal';
import { TgPolicySettings } from './TgPolicySettings';
import { TgProfile } from './TgProfile';
import { TgHelp } from './TgHelp';

export type TgTab = 'catalog' | 'settings' | 'profile' | 'help';

export function TgApp() {
  const [activeTab, setActiveTab] = useState<TgTab>('catalog');
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [tgUser, setTgUser] = useState<{ firstName: string; username?: string } | null>(null);

  const { wallet, updateBalance, resetWallet, triggerHaptic } = useArcWallet();

  // Telegram WebApp setup
  useEffect(() => {
    try {
      const tg = (window as unknown as { Telegram?: { WebApp?: {
        ready: () => void;
        expand: () => void;
        setHeaderColor: (c: string) => void;
        setBackgroundColor: (c: string) => void;
        initDataUnsafe?: { user?: { first_name?: string; username?: string } };
      } } })?.Telegram?.WebApp;

      if (tg) {
        tg.ready();
        tg.expand();
        if (tg.setHeaderColor) tg.setHeaderColor('#07080b');
        if (tg.setBackgroundColor) tg.setBackgroundColor('#07080b');

        if (tg.initDataUnsafe?.user) {
          setTgUser({
            firstName: tg.initDataUnsafe.user.first_name || 'Member',
            username: tg.initDataUnsafe.user.username,
          });
        }
      }
    } catch (e) {
      console.warn('Telegram WebApp SDK not detected, running in standalone web preview mode:', e);
    }
  }, []);

  function handleTabSwitch(tab: TgTab) {
    triggerHaptic('light');
    setActiveTab(tab);
  }

  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" />

      <main className="min-h-screen bg-[#07080b] text-white flex flex-col justify-between selection:bg-sky-500/30 selection:text-white">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-40 bg-[#07080b]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-400 p-[1px] shadow-sm shadow-sky-500/20">
              <div className="size-full bg-[#07080b] rounded-[11px] flex items-center justify-center font-bold text-xs text-white">
                M
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs tracking-tight text-white">mercenta.</span>
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <span className="text-[10px] font-mono text-white/40 block">
                {tgUser ? `Hi, ${tgUser.firstName}` : 'Arc Mainnet · 5042'}
              </span>
            </div>
          </div>

          {/* Quick Balance & Top Up Pill */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              setIsTopUpOpen(true);
            }}
            className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-mono transition-all active:scale-95"
          >
            <div className="flex items-center gap-1">
              <span className="text-white font-bold">${wallet.balanceUsdc.toFixed(2)}</span>
              <span className="text-[10px] text-emerald-400 font-semibold">USDC</span>
            </div>
            <div className="size-5 rounded-full bg-emerald-400 text-black flex items-center justify-center">
              <Plus className="size-3 stroke-[3]" />
            </div>
          </button>
        </header>

        {/* Tab Content Container */}
        <section className="flex-1 px-4 pt-3">
          {activeTab === 'catalog' && (
            <TgCatalog
              balanceUsdc={wallet.balanceUsdc}
              onDeductBalance={(amt) => updateBalance(-amt)}
              onOpenTopUp={() => setIsTopUpOpen(true)}
              triggerHaptic={triggerHaptic}
            />
          )}

          {activeTab === 'settings' && (
            <TgPolicySettings triggerHaptic={triggerHaptic} />
          )}

          {activeTab === 'profile' && (
            <TgProfile
              wallet={wallet}
              onOpenTopUp={() => setIsTopUpOpen(true)}
              onResetWallet={resetWallet}
              triggerHaptic={triggerHaptic}
            />
          )}

          {activeTab === 'help' && (
            <TgHelp triggerHaptic={triggerHaptic} />
          )}
        </section>

        {/* Multi-Chain Top Up Modal */}
        <TgTopUpModal
          isOpen={isTopUpOpen}
          onClose={() => setIsTopUpOpen(false)}
          arcAddress={wallet.address}
          triggerHaptic={triggerHaptic}
        />

        {/* Bottom Navigation Dock */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#090b10]/95 backdrop-blur-2xl border-t border-white/10 px-3 py-2 flex items-center justify-around max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => handleTabSwitch('catalog')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
              activeTab === 'catalog'
                ? 'text-sky-400 font-bold scale-105'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <ShoppingBag className="size-5" />
            <span className="text-[10px]">Catalog</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch('settings')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
              activeTab === 'settings'
                ? 'text-sky-400 font-bold scale-105'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <ShieldCheck className="size-5" />
            <span className="text-[10px]">Policy</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch('profile')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
              activeTab === 'profile'
                ? 'text-sky-400 font-bold scale-105'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <User className="size-5" />
            <span className="text-[10px]">Profile</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch('help')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
              activeTab === 'help'
                ? 'text-sky-400 font-bold scale-105'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <HelpCircle className="size-5" />
            <span className="text-[10px]">Help</span>
          </button>
        </nav>
      </main>
    </>
  );
}
