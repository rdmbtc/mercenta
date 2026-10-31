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
  Zap,
  ShieldCheck,
  Bot,
} from 'lucide-react';

interface TgHelpProps {
  triggerHaptic?: (type?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => void;
}

const FAQS = [
  {
    q: 'How fast is digital voucher delivery?',
    a: "Instantaneous. Thanks to Arc Network's sub-second Malachite consensus finality and our pre-vetted wholesale integrations, cryptographic keys are decrypted and delivered to your screen in under 2 seconds.",
    icon: <Zap className="size-4 text-[#10b981] shrink-0 mt-0.5" />,
  },
  {
    q: 'Which chains can I use to deposit USDC?',
    a: 'We natively support Arc Mainnet (5042) for zero-friction gas-free payments. You can also top up via Base USDC, Solana SPL USDC, or credit/debit cards through the integrated Circle Onramp.',
    icon: <ShieldCheck className="size-4 text-[#6ee9ff] shrink-0 mt-0.5" />,
  },
  {
    q: 'What is the 5-Gate Policy Engine?',
    a: 'A deterministic safety layer protecting businesses and AI agents from unconstrained spending, supplier price slippage, and front-running by enforcing gross margin floors (>=2.5%) and daily velocity limits.',
    icon: <ShieldCheck className="size-4 text-[#10b981] shrink-0 mt-0.5" />,
  },
  {
    q: 'Can I launch my own Telegram Store using Mercenta?',
    a: 'Yes! Use our 1-click Client Bot Template. Set your custom shop name and markup % (e.g. +15%), connect your Mercenta API Key, and accept payments via Telegram Stars or crypto while Mercenta fulfills orders wholesale.',
    icon: <Bot className="size-4 text-[#a855f7] shrink-0 mt-0.5" />,
  },
];

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

  return (
    <div className="space-y-4 pb-24 text-white">

      {/* Header Banner */}
      <div
        className="relative overflow-hidden p-4 rounded-3xl border border-[#1868f2]/20 shadow-2xl shadow-black/50 space-y-3"
        style={{ background: 'linear-gradient(135deg, #050a1c 0%, #060d1f 60%, #050810 100%)' }}
      >
        <div className="absolute -top-10 -right-10 size-32 bg-[#1868f2]/15 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-2.5">
          <div
            className="size-9 rounded-xl flex items-center justify-center shadow-lg border border-[#1868f2]/30"
            style={{ background: 'linear-gradient(135deg, #1868f2, #6ee9ff)' }}
          >
            <HelpCircle className="size-5 text-white" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white tracking-tight">Support & Developer Hub</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="size-1.5 rounded-full bg-[#00ca8e] animate-pulse shadow-[0_0_6px_#00ca8e]" />
              <span className="text-[10px] font-mono text-[#00ca8e] font-semibold">Institutional SLA \u00b7 24/7 Monitoring</span>
            </div>
          </div>
        </div>
        <p className="text-[#b2b6bd] text-xs leading-relaxed">
          Need help with order fulfillment, API integration, or multi-chain deposits? Our team and automated status bots are here 24/7.
        </p>
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <a
            href="https://docs.mercenta.xyz" target="_blank" rel="noopener noreferrer"
            onClick={() => triggerHaptic?.('light')}
            className="p-3 rounded-xl bg-black/30 border border-white/8 hover:border-[#1868f2]/50 text-xs flex items-center justify-between transition-all"
          >
            <span className="font-bold text-white">Developer Docs</span>
            <ExternalLink className="size-4 text-[#6ee9ff]" />
          </a>
          <a
            href="https://status.mercenta.xyz" target="_blank" rel="noopener noreferrer"
            onClick={() => triggerHaptic?.('light')}
            className="p-3 rounded-xl bg-black/30 border border-white/8 hover:border-[#10b981]/50 text-xs flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#00ca8e] animate-pulse shadow-[0_0_6px_#00ca8e]" />
              <span className="font-bold text-white">Status (99.9%)</span>
            </div>
            <Activity className="size-4 text-[#10b981]" />
          </a>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-[#0d1117] border border-white/6 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
          <MessageSquare className="size-4 text-[#10b981]" />
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">Frequently Asked Questions</h4>
        </div>
        <div className="space-y-2">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-xl border overflow-hidden transition-all ${
                  isOpen ? 'border-[#10b981]/20 bg-[#051810]' : 'border-white/5 bg-[#07090e]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => { triggerHaptic?.('light'); setOpenFaqIndex(isOpen ? null : idx); }}
                  className="w-full p-3.5 text-left flex items-center justify-between gap-3 text-xs font-bold text-white hover:text-[#10b981] transition-colors"
                >
                  <span className="leading-snug">{faq.q}</span>
                  <ChevronDown className={`size-4 shrink-0 text-[#10b981] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-3.5 pb-3.5 pt-1 flex items-start gap-2 border-t border-white/5">
                    {faq.icon}
                    <p className="text-xs text-[#b2b6bd] leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Support Ticket */}
      <div className="bg-[#0d1117] border border-white/6 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
          <Send className="size-4 text-[#10b981]" />
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">Submit Support Ticket</h4>
        </div>
        {ticketSent ? (
          <div className="p-4 rounded-xl border border-[#10b981]/25 text-center space-y-2"
            style={{ background: 'linear-gradient(135deg, #051810, #061a10)' }}>
            <div
              className="size-10 rounded-full flex items-center justify-center mx-auto shadow-lg"
              style={{ background: 'linear-gradient(135deg, #10b981, #00ca8e)' }}
            >
              <Check className="size-5 text-[#07090e] stroke-[3]" />
            </div>
            <p className="font-extrabold text-sm text-white">Ticket Submitted!</p>
            <p className="text-[11px] text-[#b2b6bd]">Our support engineer will contact you in this chat within 15 minutes.</p>
          </div>
        ) : (
          <form onSubmit={handleSendTicket} className="space-y-3">
            <div>
              <label className="text-xs text-[#b2b6bd] font-semibold block mb-1">Subject</label>
              <input
                type="text" value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="e.g. Need help with Steam voucher activation"
                className="w-full bg-[#07090e] border border-white/6 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-[#4a5568] focus:outline-none focus:border-[#10b981]/50 transition-colors"
                required
              />
            </div>
            <div>
              <label className="text-xs text-[#b2b6bd] font-semibold block mb-1">Message</label>
              <textarea
                value={ticketMsg} onChange={(e) => setTicketMsg(e.target.value)}
                placeholder="Describe your issue or question in detail..."
                rows={3}
                className="w-full bg-[#07090e] border border-white/6 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-[#4a5568] focus:outline-none focus:border-[#10b981]/50 transition-colors resize-none"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl font-extrabold text-xs text-[#07090e] flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #10b981, #00ca8e)' }}
            >
              <Send className="size-3.5" />
              Send Support Ticket
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
