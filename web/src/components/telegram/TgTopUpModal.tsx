'use client';

import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, ArrowRight, ShieldCheck, Zap, CreditCard } from 'lucide-react';

interface TgTopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  arcAddress: string;
  triggerHaptic?: (type?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => void;
}

type TopUpChain = 'arc' | 'base' | 'solana' | 'card';

const TABS: Array<{ id: TopUpChain; label: string; sub: string }> = [
  { id: 'arc',    label: 'Arc',    sub: 'Native' },
  { id: 'base',   label: 'Base',   sub: 'USDC' },
  { id: 'solana', label: 'Solana', sub: 'SPL' },
  { id: 'card',   label: 'Card',   sub: 'Onramp' },
];

export function TgTopUpModal({ isOpen, onClose, arcAddress, triggerHaptic }: TgTopUpModalProps) {
  const [selectedChain, setSelectedChain] = useState<TopUpChain>('arc');
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const depositInfo: Record<TopUpChain, { address: string; network: string; token: string; note: string }> = {
    arc: {
      address: arcAddress || '0x0000000000000000000000000000000000000000',
      network: 'Arc Mainnet (5042)',
      token: 'Native USDC',
      note: 'Transfer native USDC to your personal Arc address. Settlements complete in <1 second with sub-cent gas fees.',
    },
    base: {
      address: arcAddress || '0x0000000000000000000000000000000000000000',
      network: 'Base Mainnet (8453)',
      token: 'Base USDC (0x8335...29bf)',
      note: 'Send Base USDC directly to this address. Our relayer credits your Mercenta balance automatically.',
    },
    solana: {
      address: 'ArcDepositSolanaRouter11111111111111111111111',
      network: 'Solana Mainnet (SPL)',
      token: 'Solana USDC (EPjFW...Dt1v)',
      note: 'Send SPL USDC on Solana. Include your Telegram ID in the transfer memo for instant crediting.',
    },
    card: {
      address: 'https://mercenta.xyz/onramp',
      network: 'Circle & Arc Onramp',
      token: 'Apple Pay, Google Pay, Visa, Mastercard',
      note: 'Buy USDC instantly with zero prior crypto balance required.',
    },
  };

  const current = depositInfo[selectedChain];

  function handleCopy(text: string, label: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(label);
      triggerHaptic?.('success');
      setTimeout(() => setCopied(null), 2000);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-[#0d1117] border border-white/8 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Modal Header */}
        <div
          className="px-5 pt-5 pb-4 border-b border-white/5"
          style={{ background: 'linear-gradient(180deg, #051810 0%, #0d1117 100%)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="size-9 rounded-xl flex items-center justify-center shadow-lg"
                style={{ background: 'linear-gradient(135deg, #10b981, #00ca8e)' }}
              >
                <Zap className="size-5 text-[#07090e]" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">Top Up Balance</h3>
                <p className="text-[10px] font-mono text-[#00ca8e] font-semibold mt-0.5">Arc \u00b7 Base \u00b7 Solana \u00b7 Bank Card</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { triggerHaptic?.('light'); onClose(); }}
              className="size-8 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all border border-white/6"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Chain Tab Selector */}
        <div className="px-5 py-3">
          <div className="grid grid-cols-4 gap-1 p-1 bg-[#07090e] rounded-xl border border-white/5 text-xs font-bold">
            {TABS.map((tab) => {
              const isActive = selectedChain === tab.id;
              const isCard = tab.id === 'card';
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => { triggerHaptic?.('light'); setSelectedChain(tab.id); }}
                  className={`py-2 rounded-lg transition-all flex flex-col items-center gap-0.5 ${
                    isActive ? 'text-[#07090e] font-extrabold shadow-md' : 'text-[#4a5568] hover:text-[#b2b6bd]'
                  }`}
                  style={isActive ? {
                    background: isCard
                      ? 'linear-gradient(135deg, #1868f2, #6ee9ff)'
                      : 'linear-gradient(135deg, #10b981, #00ca8e)',
                  } : {}}
                >
                  <span>{tab.label}</span>
                  <span className="text-[9px] font-mono">{tab.sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">
          {selectedChain !== 'card' ? (
            <>
              {/* Network badge */}
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#07090e] border border-white/5 text-xs">
                <span className="text-[#b2b6bd] font-medium">Network / Asset</span>
                <span className="font-mono text-[#10b981] font-bold">{current.network} \u00b7 {current.token}</span>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Your Deposit Address</span>
                  <span className="text-[11px] text-[#10b981] font-semibold">Tap to copy</span>
                </label>
                <div
                  onClick={() => handleCopy(current.address, 'addr')}
                  className="p-3 bg-[#07090e] border border-white/6 rounded-xl cursor-pointer hover:border-[#10b981]/50 transition-all flex items-center justify-between gap-2 shadow-inner"
                >
                  <span className="font-mono text-xs text-white font-medium break-all select-all">{current.address}</span>
                  <div className="shrink-0 size-8 rounded-lg bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center">
                    {copied === 'addr' ? <Check className="size-4 text-[#10b981] stroke-[3]" /> : <Copy className="size-4 text-[#10b981]" />}
                  </div>
                </div>
              </div>

              {/* Note */}
              <div className="p-3.5 rounded-xl bg-[#07090e] border border-[#10b981]/15 text-xs text-[#b2b6bd] leading-relaxed flex items-start gap-2.5">
                <ShieldCheck className="size-4 text-[#10b981] shrink-0 mt-0.5" />
                <span>{current.note}</span>
              </div>
            </>
          ) : (
            /* Card Tab */
            <div
              className="p-5 rounded-2xl border border-[#1868f2]/20 text-center space-y-4"
              style={{ background: 'linear-gradient(135deg, #050a1c, #060d1f)' }}
            >
              <div
                className="size-14 rounded-2xl flex items-center justify-center mx-auto shadow-lg"
                style={{ background: 'linear-gradient(135deg, #1868f2, #6ee9ff)' }}
              >
                <CreditCard className="size-7 text-white" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white">Direct Card Onramp</h4>
                <p className="text-xs text-[#b2b6bd] leading-relaxed mt-1">
                  Buy USDC with Apple Pay, Google Pay, Visa, or Mastercard via Circle & Arc Onramp.
                </p>
              </div>
              <a
                href="/onramp" target="_blank" rel="noopener noreferrer"
                onClick={() => triggerHaptic?.('medium')}
                className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl font-extrabold text-xs text-white transition-all shadow-lg active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #1868f2, #6ee9ff)' }}
              >
                Open Onramp Portal <ExternalLink className="size-3.5 stroke-[3]" />
              </a>
            </div>
          )}

          {/* Arc Bridge */}
          <div className="pt-1 border-t border-white/5">
            <a
              href="https://bridge.arc.io" target="_blank" rel="noopener noreferrer"
              onClick={() => triggerHaptic?.('light')}
              className="flex items-center justify-between p-3 rounded-xl bg-[#07090e] hover:bg-[#0a0f18] border border-white/5 hover:border-[#10b981]/30 text-xs text-white transition-all"
            >
              <div className="flex items-center gap-2">
                <div
                  className="size-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, #10b981, #00ca8e)' }}
                >
                  <Zap className="size-3.5 text-[#07090e]" />
                </div>
                <div>
                  <p className="font-bold text-white">Arc Official Bridge</p>
                  <p className="text-[10px] text-[#b2b6bd]">bridge.arc.io</p>
                </div>
              </div>
              <ArrowRight className="size-4 text-[#10b981]" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
