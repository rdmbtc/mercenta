'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, User, ShieldCheck, HelpCircle, Zap, X } from 'lucide-react';
import { TgCatalog } from './TgCatalog';
import { TgProfile } from './TgProfile';
import { TgPolicySettings } from './TgPolicySettings';
import { TgHelp } from './TgHelp';
import { TgTopUpModal } from './TgTopUpModal';
import { useArcWallet } from './useArcWallet';

type Tab = 'store' | 'profile' | 'policy' | 'help';

const NAV_TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: 'store',  label: 'Store',    icon: <ShoppingBag className="size-5" /> },
  { id: 'profile',label: 'Wallet',   icon: <User className="size-5" /> },
  { id: 'policy', label: 'Policy',   icon: <ShieldCheck className="size-5" /> },
  { id: 'help',   label: 'Help',     icon: <HelpCircle className="size-5" /> },
];

export function TgApp() {
  const [activeTab, setActiveTab] = useState<Tab>('store');
  const [topUpOpen, setTopUpOpen] = useState(false);
  const { wallet, deductBalance } = useArcWallet();

  function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') {
    if (typeof window === 'undefined') return;
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) return;
    try {
      if (['success', 'warning', 'error'].includes(type)) {
        tg.HapticFeedback?.notificationOccurred(type);
      } else {
        tg.HapticFeedback?.impactOccurred(type);
      }
    } catch {}
  }

  function handleTabChange(tab: Tab) {
    triggerHaptic('light');
    setActiveTab(tab);
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col">

      {/* ── App Header ── */}
      <header className="sticky top-0 z-30 bg-[#07090e]/95 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between px-4 h-14">

          {/* Brand Mark */}
          <div className="flex items-center gap-2.5">
            <div
              className="size-8 rounded-xl flex items-center justify-center font-black text-sm text-[#07090e] shadow-lg"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #00ca8e 50%, #6ee9ff 100%)' }}
            >
              M
            </div>
            <div>
              <span className="text-sm font-extrabold tracking-tight text-white">Mercenta</span>
              <div className="flex items-center gap-1 mt-[-1px]">
                <span className="size-1.5 rounded-full bg-[#00ca8e] animate-pulse shadow-[0_0_6px_#00ca8e]" />
                <span className="text-[9px] font-mono font-bold text-[#00ca8e] uppercase tracking-widest">Mainnet Live</span>
              </div>
            </div>
          </div>

          {/* Balance Pill */}
          <button
            type="button"
            onClick={() => { triggerHaptic('light'); setTopUpOpen(true); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0d1117] border border-white/8 hover:border-[#10b981]/50 transition-all shadow-sm"
          >
            <Zap className="size-3.5 text-[#10b981]" />
            <span className="font-mono text-xs font-bold text-white">
              ${wallet.balanceUsdc.toFixed(2)}
            </span>
            <span className="text-[10px] font-mono text-[#6ee9ff] font-semibold">USDC</span>
          </button>
        </div>
      </header>

      {/* ── Tab Content ── */}
      <main className="flex-1 overflow-y-auto px-4 pt-4">
        {activeTab === 'store'  && (
          <TgCatalog
            balanceUsdc={wallet.balanceUsdc}
            onDeductBalance={deductBalance}
            onOpenTopUp={() => setTopUpOpen(true)}
            triggerHaptic={triggerHaptic}
          />
        )}
        {activeTab === 'profile' && (
          <TgProfile
            wallet={wallet}
            onOpenTopUp={() => setTopUpOpen(true)}
            onResetWallet={() => {}
            }
            triggerHaptic={triggerHaptic}
          />
        )}
        {activeTab === 'policy' && (
          <TgPolicySettings triggerHaptic={triggerHaptic} />
        )}
        {activeTab === 'help' && (
          <TgHelp triggerHaptic={triggerHaptic} />
        )}
      </main>

      {/* ── Bottom Nav ── */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-[#07090e]/95 backdrop-blur-xl border-t border-white/5 pb-safe">
        <div className="grid grid-cols-4 h-16">
          {NAV_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`flex flex-col items-center justify-center gap-1 transition-all ${
                  isActive
                    ? 'text-[#10b981]'
                    : 'text-[#4a5568] hover:text-[#718096]'
                }`}
              >
                <div className={`relative flex items-center justify-center size-9 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#10b981]/12 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                    : ''
                }`}>
                  {isActive && (
                    <span className="absolute inset-0 rounded-xl border border-[#10b981]/20" />
                  )}
                  {tab.icon}
                </div>
                <span className={`text-[10px] font-bold ${
                  isActive ? 'text-[#10b981]' : 'text-[#4a5568]'
                }`}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Top Up Modal ── */}
      <TgTopUpModal
        isOpen={topUpOpen}
        onClose={() => setTopUpOpen(false)}
        arcAddress={wallet.address}
        triggerHaptic={triggerHaptic}
      />
    </div>
  );
}
