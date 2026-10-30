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
import { RollingNumber } from '@/components/panelui/rolling-number';

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
        if (tg.setHeaderColor) tg.setHeaderColor('#07090e');
        if (tg.setBackgroundColor) tg.setBackgroundColor('#07090e');

        if (tg.initDataUnsafe?.user) {
          setTgUser({
            firstName: tg.initDataUnsafe.user.first_name || 'Member',
            username: tg.initDataUnsafe.user.username,
          });
        }
      }
    } catch (e) {
      console.warn('Telegram WebApp SDK running in preview mode:', e);
    }
  }, []);

  function handleTabSwitch(tab: TgTab) {
    triggerHaptic('light');
    setActiveTab(tab);
  }

  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" />

      <main className="min-h-screen bg-[#07090e] text-white flex flex-col justify-between selection:bg-sky-500/30 selection:text-white relative z-10">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-40 bg-[#0c101a]/95 backdrop-blur-xl border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-lg shadow-black/40">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-emerald-400 p-[1.5px] shadow-sm shadow-sky-500/30">
              <div className="size-full bg-[#090c14] rounded-[10px] flex items-center justify-center font-extrabold text-xs text-white">
                M
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-white">mercenta.</span>
                <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
              </div>
              <span className="text-[11px] font-mono text-slate-300 font-medium block">
                {tgUser ? `Hi, ${tgUser.firstName}` : 'Arc Mainnet · 5042'}
              </span>
            </div>
          </div>

          {/* Quick Balance & Top Up Pill with RollingNumber */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              setIsTopUpOpen(true);
            }}
            className="flex items-center gap-2 pl-3.5 pr-2 py-1.5 rounded-full bg-[#141928] hover:bg-[#1b2238] border border-slate-700 hover:border-slate-600 text-xs font-mono transition-all active:scale-95 shadow-md shadow-black/40"
          >
            <div className="flex items-center gap-1.5 text-white font-bold">
              <span>$</span>
              <RollingNumber value={wallet.balanceUsdc} />
              <span className="text-[10px] text-emerald-400 font-semibold px-1 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                USDC
              </span>
            </div>
            <div className="size-6 rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 flex items-center justify-center shadow-sm shadow-emerald-400/40">
              <Plus className="size-3.5 stroke-[3]" />
            </div>
          </button>
        </header>

        {/* Tab Content Container */}
        <section className="flex-1 px-3.5 pt-3.5 max-w-lg mx-auto w-full">
          {activeTab === 'catalog' && (
            <TgCatalog
              balanceUsdc={wallet.balanceUsdc}
              onDeductBalance={(amt) => {
                updateBalance(-amt);
                return true;
              }}
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
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0c101a]/98 backdrop-blur-2xl border-t border-slate-800 px-3 py-2 flex items-center justify-around max-w-lg mx-auto shadow-2xl shadow-black">
          <button
            type="button"
            onClick={() => handleTabSwitch('catalog')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3.5 rounded-xl transition-all ${
              activeTab === 'catalog'
                ? 'bg-sky-500/15 border border-sky-400/40 text-sky-300 font-bold shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <ShoppingBag className="size-5" />
            <span className="text-[11px] tracking-tight">Catalog</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch('settings')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3.5 rounded-xl transition-all ${
              activeTab === 'settings'
                ? 'bg-sky-500/15 border border-sky-400/40 text-sky-300 font-bold shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <ShieldCheck className="size-5" />
            <span className="text-[11px] tracking-tight">Policy</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch('profile')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3.5 rounded-xl transition-all ${
              activeTab === 'profile'
                ? 'bg-sky-500/15 border border-sky-400/40 text-sky-300 font-bold shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <User className="size-5" />
            <span className="text-[11px] tracking-tight">Profile</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch('help')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3.5 rounded-xl transition-all ${
              activeTab === 'help'
                ? 'bg-sky-500/15 border border-sky-400/40 text-sky-300 font-bold shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <HelpCircle className="size-5" />
            <span className="text-[11px] tracking-tight">Help</span>
          </button>
        </nav>
      </main>
    </>
  );
}
