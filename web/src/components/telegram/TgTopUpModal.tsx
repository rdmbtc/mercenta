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

  const depositAddresses: Record<TopUpChain, { address: string; network: string; token: string; note: string }> = {
    arc: {
      address: arcAddress || '0x0000000000000000000000000000000000000000',
      network: 'Arc Mainnet (Chain ID 5042)',
      token: 'Native USDC',
      note: 'Transfer native USDC directly to your personal Arc address. Settlements take <1 second with sub-cent gas fees.',
    },
    base: {
      address: arcAddress || '0x0000000000000000000000000000000000000000',
      network: 'Base Mainnet (Chain ID 8453)',
      token: 'Native Base USDC (0x8335...29bf)',
      note: 'Send Base USDC directly to this address. Our relayer credits your Mercenta balance automatically.',
    },
    solana: {
      address: 'ArcDepositSolanaRouter11111111111111111111111',
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
      <div className="w-full sm:max-w-md bg-[#121626] border border-slate-700 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs border border-sky-500/40">
              <Zap className="size-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Top Up Balance</h3>
              <p className="text-[11px] text-slate-300 font-medium">Arc, Base, Solana or Bank Card</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic?.('light');
              onClose();
            }}
            className="size-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors border border-slate-600"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Chain Selector Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-[#0a0d16] rounded-xl my-4 border border-slate-700 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              triggerHaptic?.('light');
              setSelectedChain('arc');
            }}
            className={`py-2 rounded-lg transition-all flex flex-col items-center gap-0.5 ${
              selectedChain === 'arc'
                ? 'bg-sky-500 text-slate-950 font-extrabold shadow-md shadow-sky-500/30'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>Arc</span>
            <span className="text-[9px] font-mono">Native</span>
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic?.('light');
              setSelectedChain('base');
            }}
            className={`py-2 rounded-lg transition-all flex flex-col items-center gap-0.5 ${
              selectedChain === 'base'
                ? 'bg-sky-500 text-slate-950 font-extrabold shadow-md shadow-sky-500/30'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>Base</span>
            <span className="text-[9px] font-mono">USDC</span>
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic?.('light');
              setSelectedChain('solana');
            }}
            className={`py-2 rounded-lg transition-all flex flex-col items-center gap-0.5 ${
              selectedChain === 'solana'
                ? 'bg-sky-500 text-slate-950 font-extrabold shadow-md shadow-sky-500/30'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>Solana</span>
            <span className="text-[9px] font-mono">SPL</span>
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic?.('light');
              setSelectedChain('card');
            }}
            className={`py-2 rounded-lg transition-all flex flex-col items-center gap-0.5 ${
              selectedChain === 'card'
                ? 'bg-emerald-400 text-slate-950 font-extrabold shadow-md shadow-emerald-400/30'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>Card</span>
            <span className="text-[9px] font-mono">Onramp</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="space-y-4 flex-1 overflow-y-auto pr-1">
          {selectedChain !== 'card' ? (
            <>
              {/* Network Specs Pill */}
              <div className="flex items-center justify-between text-xs px-3.5 py-2.5 rounded-xl bg-[#0a0d16] border border-slate-700">
                <span className="text-slate-300 font-medium">Network / Asset:</span>
                <span className="font-mono text-emerald-400 font-bold">{current.network} · {current.token}</span>
              </div>

              {/* Address Container */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Your Deposit Address</span>
                  <span className="text-[11px] text-sky-400 font-semibold">Tap to copy</span>
                </label>
                <div
                  onClick={() => handleCopy(current.address, 'addr')}
                  className="p-3 bg-[#0a0d16] border border-slate-700 rounded-xl cursor-pointer hover:border-sky-400 transition-colors flex items-center justify-between gap-2 shadow-sm"
                >
                  <span className="font-mono text-xs text-white font-medium break-all select-all">
                    {current.address}
                  </span>
                  <div className="shrink-0 size-8 rounded-lg bg-slate-800 flex items-center justify-center text-white border border-slate-600">
                    {copied === 'addr' ? <Check className="size-4 text-emerald-400 stroke-[3]" /> : <Copy className="size-4" />}
                  </div>
                </div>
              </div>

              {/* Note callout */}
              <div className="p-3.5 rounded-xl bg-[#0a0d16] border border-sky-500/30 text-xs text-slate-200 leading-relaxed flex items-start gap-2.5 font-normal">
                <ShieldCheck className="size-4 text-sky-400 shrink-0 mt-0.5" />
                <span>{current.note}</span>
              </div>
            </>
          ) : (
            /* Card & Fiat Onramp Tab */
            <div className="p-4 rounded-xl bg-[#0a0d16] border border-emerald-500/30 text-center space-y-3">
              <div className="size-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                <Zap className="size-6" />
              </div>
              <h4 className="font-bold text-sm text-white">Direct Card Onramp (KYB / Retail)</h4>
              <p className="text-xs text-slate-200 leading-relaxed font-normal">
                Purchase USDC directly onto your Arc address using Apple Pay, Google Pay, Visa, or Mastercard via Circle &amp; Arc Onramp.
              </p>
              <a
                href="/onramp"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => triggerHaptic?.('medium')}
                className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-400 text-slate-950 font-extrabold text-xs hover:bg-emerald-300 transition-colors shadow-lg shadow-emerald-500/20"
              >
                <span>Open Onramp Portal</span>
                <ExternalLink className="size-3.5 stroke-[3]" />
              </a>
            </div>
          )}

          {/* Official Bridge Suggestion */}
          <div className="pt-2 border-t border-slate-700/60">
            <a
              href="https://bridge.arc.io"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => triggerHaptic?.('light')}
              className="flex items-center justify-between p-3 rounded-xl bg-[#0a0d16] hover:bg-[#0e1320] border border-slate-700 text-xs text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
                <span className="font-bold text-white">Bridge USDC from Ethereum / Arbitrum</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-sky-400 font-mono font-bold">
                <span>bridge.arc.io</span>
                <ArrowRight className="size-3.5 stroke-[3]" />
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
