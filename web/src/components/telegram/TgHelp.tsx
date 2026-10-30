'use client';

import React, { useState } from 'react';
import {
  HelpCircle,
  ExternalLink,
  Send,
  Activity,
  ChevronDown,
  MessageSquare,
  Check,
} from 'lucide-react';

interface TgHelpProps {
  triggerHaptic?: (type?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => void;
}

export function TgHelp({ triggerHaptic }: TgHelpProps) {
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMsg, setTicketMsg] = useState('');
  const [ticketSent, setTicketSent] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  function handleSendTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!ticketSubject || !ticketMsg) return;

    triggerHaptic?.('success');
    setTicketSent(true);
    setTicketSubject('');
    setTicketMsg('');
    setTimeout(() => setTicketSent(false), 4000);
  }

  const faqs = [
    {
      q: 'How fast is digital voucher delivery?',
      a: 'Instantaneous. Thanks to Arc Network’s sub-second Malachite consensus finality and our pre-vetted wholesale integrations, cryptographic keys are decrypted and delivered to your screen in under 2 seconds.',
    },
    {
      q: 'Which chains can I use to deposit USDC?',
      a: 'We natively support Arc Mainnet (5042) for zero-friction gas-free payments. You can also top up via Base USDC, Solana SPL USDC, or credit/debit cards through the integrated Circle Onramp.',
    },
    {
      q: 'What is the 5-Gate Policy Engine?',
      a: 'A deterministic safety layer protecting businesses and AI agents from unconstrained spending, supplier price slippage, and front-running by enforcing gross margin floors (>=2.5%) and daily velocity limits.',
    },
    {
      q: 'Can I launch my own Telegram Store using Mercenta?',
      a: 'Yes! Use our 1-click Client Bot Template. You set your custom shop name and markup % (e.g. +15%), connect your Mercenta API Key, and accept payments via Telegram Stars or crypto while Mercenta fulfills orders wholesale.',
    },
  ];

  return (
    <div className="space-y-4 pb-24 text-white">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#141b2d] via-[#101524] to-[#0c0f1a] border border-sky-500/30 shadow-xl space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/40 shadow-sm shadow-sky-500/30">
            <HelpCircle className="size-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white tracking-tight">Support &amp; Developer Hub</h3>
            <span className="text-[11px] font-mono text-slate-300 font-medium">
              Institutional SLA · 24/7 Monitoring
            </span>
          </div>
        </div>

        <p className="text-slate-200 text-xs leading-relaxed font-normal">
          Need assistance with order fulfillment, API integration, or multi-chain deposits? Our team and automated status bots are here 24/7.
        </p>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <a
            href="https://docs.mercenta.xyz"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => triggerHaptic?.('light')}
            className="p-3 rounded-xl bg-[#0a0d16] border border-slate-700 hover:border-sky-400 text-xs flex items-center justify-between transition-colors shadow-sm"
          >
            <span className="font-bold text-white">Developer Docs</span>
            <ExternalLink className="size-4 text-sky-400" />
          </a>
          <a
            href="https://status.mercenta.xyz"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => triggerHaptic?.('light')}
            className="p-3 rounded-xl bg-[#0a0d16] border border-slate-700 hover:border-emerald-400 text-xs flex items-center justify-between transition-colors shadow-sm"
          >
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
              <span className="font-bold text-white">Status (99.9%)</span>
            </div>
            <Activity className="size-4 text-emerald-400" />
          </a>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-[#121626] border border-slate-700/80 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-700/60">
          <MessageSquare className="size-4 text-sky-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">
            Frequently Asked Questions
          </h4>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-700/70 overflow-hidden bg-[#0a0d16] transition-all"
              >
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic?.('light');
                    setOpenFaqIndex(isOpen ? null : idx);
                  }}
                  className="w-full p-3.5 text-left flex items-center justify-between gap-3 text-xs font-bold text-white hover:text-sky-300 transition-colors"
                >
                  <span className="leading-snug">{faq.q}</span>
                  <ChevronDown
                    className={`size-4 shrink-0 text-sky-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-3.5 pb-3.5 pt-1 text-xs text-slate-200 leading-relaxed border-t border-slate-800 bg-[#0f1424] font-normal">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit Support Ticket Form */}
      <div className="bg-[#121626] border border-slate-700/80 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-700/60">
          <Send className="size-4 text-sky-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">
            Submit Support Ticket
          </h4>
        </div>

        {ticketSent ? (
          <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-center space-y-1.5 animate-in fade-in">
            <div className="size-8 rounded-full bg-emerald-400 text-black flex items-center justify-center mx-auto">
              <Check className="size-4 stroke-[3]" />
            </div>
            <p className="font-bold text-xs text-white">Ticket Submitted Successfully</p>
            <p className="text-[11px] text-slate-200">
              Our support engineer will contact you directly in this Telegram chat within 15 minutes.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendTicket} className="space-y-3">
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">Subject</label>
              <input
                type="text"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="e.g. Need assistance with Steam voucher activation"
                className="w-full bg-[#0a0d16] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-400 transition-colors"
                required
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">Message</label>
              <textarea
                value={ticketMsg}
                onChange={(e) => setTicketMsg(e.target.value)}
                placeholder="Describe your issue or question in detail..."
                rows={3}
                className="w-full bg-[#0a0d16] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-400 transition-colors resize-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition-all shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <Send className="size-3.5 fill-current" />
              <span>Send Support Ticket</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
