'use client';

import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface TgTopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  arcAddress: string;
  triggerHaptic?: (type?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => void;
}

type TopUpChain = 'arc' | 'base' | 'solana' | 'card';

export function TgTopUpModal({ isOpen, onClose, arcAddress, triggerHaptic }: TgTopUpModalProps) {
  const [selectedChain, setSelectedChain] = useState<TopUpChain>('arc');
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  // Placeholder deposit addresses for Base and Solana (user can configure or use treasury router)
  const depositAddresses: Record<TopUpChain, { address: string; network: string; token: string; note: string }> = {
    arc: {
      address: arcAddress || '0x0000000000000000000000000000000000000000',
      network: 'Arc Mainnet (Chain ID 5042)',
      token: 'Native USDC',
      note: 'Transfer native USDC directly to your personal Arc address. Settlements take <1 second with sub-cent gas fees.',
    },
    base: {
      address: arcAddress || '0x0000000000000000000000000000000000000000', // EVM compatible address
      network: 'Base Mainnet (Chain ID 8453)',
      token: 'Native Base USDC (0x8335...29bf)',
      note: 'Send Base USDC directly to this address. Our relayer credits your Mercenta balance automatically.',
    },
    solana: {
      address: 'ArcDepositSolanaRouter11111111111111111111111', // Configurable Solana Treasury
      network: 'Solana Mainnet (SPL)',
      token: 'Solana USDC (EPjFW...Dt1v)',
      note: 'Send SPL USDC on Solana. Include your Telegram ID in the transfer memo for instant balance crediting.',
    },
    card: {
      address: 'https://mercenta.xyz/onramp',
      network: 'Circle & Arc Onramp Kit',
      token: 'Apple Pay, Google Pay, Credit/Debit Cards',
      note: 'Buy USDC instantly with zero prior crypto balance required.',
    },
  };

  const current = depositAddresses[selectedChain];

  function handleCopy(text: string, label: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(label);
      triggerHaptic?.('success');
      setTimeout(() => setCopied(null), 2000);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-[#0c0e14] border border-white/10 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs border border-sky-500/30">
              <Zap className="size-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-white">Top Up Balance</h3>
              <p className="text-[11px] text-white/50">Arc, Base, Solana or Bank Card</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic?.('light');
              onClose();
            }}
            className="size-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Chain Selector Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-black/40 rounded-xl my-4 border border-white/5 text-[11px] font-medium">
          <button
            type="button"
            onClick={() => {
              triggerHaptic?.('light');
              setSelectedChain('arc');
            }}
            className={`py-2 rounded-lg transition-all flex flex-col items-center gap-0.5 ${
              selectedChain === 'arc'
                ? 'bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30 shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <span>Arc</span>
            <span className="text-[9px] opacity-75">Native</span>
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic?.('light');
              setSelectedChain('base');
            }}
            className={`py-2 rounded-lg transition-all flex flex-col items-center gap-0.5 ${
              selectedChain === 'base'
                ? 'bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30 shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <span>Base</span>
            <span className="text-[9px] opacity-75">USDC</span>
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic?.('light');
              setSelectedChain('solana');
            }}
            className={`py-2 rounded-lg transition-all flex flex-col items-center gap-0.5 ${
              selectedChain === 'solana'
                ? 'bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30 shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <span>Solana</span>
            <span className="text-[9px] opacity-75">SPL</span>
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic?.('light');
              setSelectedChain('card');
            }}
            className={`py-2 rounded-lg transition-all flex flex-col items-center gap-0.5 ${
              selectedChain === 'card'
                ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <span>Card</span>
            <span className="text-[9px] opacity-75">Onramp</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="space-y-4 flex-1 overflow-y-auto pr-1">
          {selectedChain !== 'card' ? (
            <>
              {/* Network Specs Pill */}
              <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-white/50">Network / Asset:</span>
                <span className="font-mono text-white/90 font-medium">{current.network} · {current.token}</span>
              </div>

              {/* Address Container */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-white/60 flex items-center justify-between">
                  <span>Your Deposit Address</span>
                  <span className="text-[10px] text-sky-400">Tap to copy</span>
                </label>
                <div
                  onClick={() => handleCopy(current.address, 'addr')}
                  className="p-3 bg-black/60 border border-white/15 rounded-xl cursor-pointer hover:border-sky-500/50 transition-colors flex items-center justify-between gap-2"
                >
                  <span className="font-mono text-xs text-white/90 break-all select-all">
                    {current.address}
                  </span>
                  <div className="shrink-0 size-8 rounded-lg bg-white/5 flex items-center justify-center text-white/80">
                    {copied === 'addr' ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
                  </div>
                </div>
              </div>

              {/* Note callout */}
              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-[11px] text-sky-200/90 leading-relaxed flex items-start gap-2">
                <ShieldCheck className="size-4 text-sky-400 shrink-0 mt-0.5" />
                <span>{current.note}</span>
              </div>
            </>
          ) : (
            /* Card & Fiat Onramp Tab */
            <div className="p-4 rounded-xl bg-gradient-to-b from-emerald-500/10 to-transparent border border-emerald-500/20 text-center space-y-3">
              <div className="size-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <Zap className="size-6" />
              </div>
              <h4 className="font-semibold text-sm text-white">Direct Card Onramp (KYB / Retail)</h4>
              <p className="text-xs text-white/60 leading-relaxed">
                Purchase USDC directly onto your Arc address using Apple Pay, Google Pay, Visa, or Mastercard via Circle &amp; Arc Onramp.
              </p>
              <a
                href="/onramp"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => triggerHaptic?.('medium')}
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-400 text-black font-semibold text-xs hover:bg-emerald-300 transition-colors shadow-lg shadow-emerald-500/20"
              >
                <span>Open Onramp Portal</span>
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          )}

          {/* Official Bridge Suggestion */}
          <div className="pt-2 border-t border-white/5">
            <a
              href="https://bridge.arc.io"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => triggerHaptic?.('light')}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 text-xs text-white/70 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Bridge USDC from Ethereum / Arbitrum</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-sky-400 font-mono">
                <span>bridge.arc.io</span>
                <ArrowRight className="size-3" />
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
