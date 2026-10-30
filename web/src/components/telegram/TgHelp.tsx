'use client';

import React, { useState } from 'react';
import { HelpCircle, ExternalLink, Send, ShieldCheck, Activity } from 'lucide-react';

interface TgHelpProps {
  triggerHaptic?: (type?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => void;
}

export function TgHelp({ triggerHaptic }: TgHelpProps) {
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMsg, setTicketMsg] = useState('');
  const [ticketSent, setTicketSent] = useState(false);

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
    <div className="space-y-5 pb-24 text-white">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-500/10 via-purple-500/10 to-emerald-500/10 border border-white/10 space-y-2">
        <div className="flex items-center gap-2 text-sky-400">
          <HelpCircle className="size-5" />
          <h3 className="font-semibold text-sm text-white">Support &amp; Developer Hub</h3>
        </div>
        <p className="text-xs text-white/60 leading-relaxed">
          Need assistance with order fulfillment, API integration, or multi-chain deposits? Our team and automated status bots are here 24/7.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <a
            href="https://docs.mercenta.xyz"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => triggerHaptic?.('light')}
            className="p-2.5 rounded-xl bg-black/40 border border-white/10 hover:border-sky-500/40 text-xs flex items-center justify-between transition-colors"
          >
            <span>Developer Docs</span>
            <ExternalLink className="size-3.5 text-sky-400" />
          </a>
          <a
            href="https://status.mercenta.xyz"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => triggerHaptic?.('light')}
            className="p-2.5 rounded-xl bg-black/40 border border-white/10 hover:border-emerald-500/40 text-xs flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Status (99.9%)</span>
            </div>
            <Activity className="size-3.5 text-emerald-400" />
          </a>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-white/80 px-1">
          Frequently Asked Questions
        </h4>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="group p-3 rounded-2xl bg-[#0e111a] border border-white/10 open:border-sky-500/30 transition-colors"
            >
              <summary className="text-xs font-medium text-white/90 cursor-pointer list-none flex items-center justify-between">
                <span>{faq.q}</span>
                <span className="text-sky-400 transition-transform group-open:rotate-180">↓</span>
              </summary>
              <p className="text-[11px] text-white/60 mt-2 pt-2 border-t border-white/5 leading-relaxed">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>

      {/* Support Ticket Form */}
      <div className="p-4 rounded-2xl bg-[#0e111a] border border-white/10 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
          <Send className="size-4 text-sky-400" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-white/80">
            Submit Support Ticket
          </h4>
        </div>

        {ticketSent ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
            <ShieldCheck className="size-6 text-emerald-400 mx-auto" />
            <h5 className="font-semibold text-xs text-white">Ticket Submitted Successfully</h5>
            <p className="text-[10px] text-white/60">
              Our operator team will respond directly to your Telegram chat shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendTicket} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] text-white/50 block">Subject / Order ID</label>
              <input
                type="text"
                required
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="e.g. Issue with Steam code or deposit question"
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-sky-500/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-white/50 block">Message Details</label>
              <textarea
                required
                rows={3}
                value={ticketMsg}
                onChange={(e) => setTicketMsg(e.target.value)}
                placeholder="Describe what happened and include transaction hash if applicable..."
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-sky-500/50 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Send className="size-3.5" />
              <span>Send Ticket to Operator</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
