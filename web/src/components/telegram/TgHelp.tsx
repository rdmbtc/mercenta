'use client';

import React, { useState } from 'react';
import {
  HelpCircle,
  ExternalLink,
  Send,
  Activity,
  ChevronDown,
  MessageSquare,
  Zap,
  ShieldCheck,
  Bot,
} from 'lucide-react';

import { useTgLocale } from './tg-locale';

interface TgHelpProps {
  triggerHaptic?: (type?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => void;
}

export function TgHelp({ triggerHaptic }: TgHelpProps) {
  const { t } = useTgLocale();
  const FAQS = [
    {
      q: t('What changes between Testnet and Mainnet?', 'Чем отличаются Testnet и Mainnet?'),
      a: t('Testnet uses an Arc test account and non-redeemable delivery. Mainnet uses real USDC from your connected wallet and requires a signed server quote. Balances and purchases are separate.', 'Testnet использует тестовый аккаунт Arc и не предоставляет реальные товары. Mainnet использует реальные USDC из подключённого кошелька и требует подписанного сервером ценового предложения. Балансы и покупки раздельные.'),
      icon: <Zap className="size-4 text-[#b2e5ff] shrink-0 mt-0.5" />,
    },
    {
      q: t('Which chains can I use to deposit USDC?', 'В каких сетях можно пополнить USDC?'),
      a: t('Test deposits must be sent on Arc Testnet (5042002) and verified before account credit. Mainnet purchases use Arc Mainnet (5042). Available funding methods are shown in Add USDC; never send to an address on a different network.', 'Тестовые пополнения отправляются в Arc Testnet (5042002) и проверяются перед зачислением. Покупки в Mainnet используют Arc Mainnet (5042). Доступные способы пополнения показаны в разделе «Добавить USDC»; никогда не отправляйте средства на адрес в другой сети.'),
      icon: <ShieldCheck className="size-4 text-[#6ee9ff] shrink-0 mt-0.5" />,
    },
    {
      q: t('What is the 5-Gate Policy Engine?', 'Что такое 5-Gate Policy Engine?'),
      a: t('A deterministic safety layer protecting businesses and AI agents from unconstrained spending, supplier price slippage, and front-running by enforcing gross margin floors (>=2.5%) and daily velocity limits.', 'Детерминированный уровень защиты бизнеса и ИИ-агентов от бесконтрольных расходов, проскальзывания цен поставщика и фронтраннинга. Он обеспечивает минимальную валовую маржу (>=2.5%) и дневные лимиты операций.'),
      icon: <ShieldCheck className="size-4 text-[#b2e5ff] shrink-0 mt-0.5" />,
    },
    {
      q: t('How can I use a wallet in Telegram?', 'Как использовать кошелёк в Telegram?'),
      a: t('Create or restore an encrypted local Mercenta wallet on this device, or connect an external provider such as MetaMask or Rabby in a compatible browser. Your password encrypts the local key; keep an encrypted backup and your password separately. Mercenta cannot recover the key. Signing and payments require your confirmation.', 'Создайте или восстановите зашифрованный локальный кошелёк Mercenta на этом устройстве либо подключите внешний кошелёк, например MetaMask или Rabby, в совместимом браузере. Пароль шифрует локальный ключ; храните зашифрованную резервную копию и пароль отдельно. Mercenta не может восстановить ключ. Подписи и платежи требуют вашего подтверждения.'),
      icon: <Bot className="size-4 text-[#a855f7] shrink-0 mt-0.5" />,
    },
  ];
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMsg, setTicketMsg] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  function handleSendTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!ticketSubject || !ticketMsg) return;
    triggerHaptic?.('light');
    window.location.href = `mailto:support@mercenta.xyz?subject=${encodeURIComponent(ticketSubject)}&body=${encodeURIComponent(ticketMsg)}`;
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
            <h3 className="font-extrabold text-sm text-white tracking-tight">{t('Support & Developer Hub', 'Поддержка и разработка')}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="size-1.5 rounded-full bg-[#b2e5ff] animate-pulse shadow-[0_0_6px_#b2e5ff]" />
              <span className="text-[10px] font-mono text-[#b2e5ff] font-semibold">{t('Institutional SLA \u00b7 24/7 Monitoring', '\u041a\u043e\u0440\u043f\u043e\u0440\u0430\u0442\u0438\u0432\u043d\u044b\u0439 SLA \u00b7 \u041c\u043e\u043d\u0438\u0442\u043e\u0440\u0438\u043d\u0433 24/7')}</span>
            </div>
          </div>
        </div>
        <p className="text-[#b2b6bd] text-xs leading-relaxed">
          {t('Need help with order fulfillment, API integration, or multi-chain deposits? Contact support by email or check the service status.', 'Нужна помощь с заказом, интеграцией API или пополнением в разных сетях? Напишите в поддержку или проверьте статус сервиса.')}
        </p>
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <a
            href="https://docs.mercenta.xyz" target="_blank" rel="noopener noreferrer"
            onClick={() => triggerHaptic?.('light')}
            className="p-3 rounded-xl bg-black/30 border border-white/8 hover:border-[#1868f2]/50 text-xs flex items-center justify-between transition-all"
          >
            <span className="font-bold text-white">{t('Developer Docs', 'Документация')}</span>
            <ExternalLink className="size-4 text-[#6ee9ff]" />
          </a>
          <a
            href="https://status.mercenta.xyz" target="_blank" rel="noopener noreferrer"
            onClick={() => triggerHaptic?.('light')}
            className="p-3 rounded-xl bg-black/30 border border-white/8 hover:border-[#b2e5ff]/50 text-xs flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#b2e5ff] animate-pulse shadow-[0_0_6px_#b2e5ff]" />
              <span className="font-bold text-white">{t('Status (99.9%)', 'Статус (99.9%)')}</span>
            </div>
            <Activity className="size-4 text-[#b2e5ff]" />
          </a>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-[#0d1117] border border-white/6 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
          <MessageSquare className="size-4 text-[#b2e5ff]" />
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">{t('Frequently Asked Questions', 'Частые вопросы')}</h4>
        </div>
        <div className="space-y-2">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-xl border overflow-hidden transition-all ${
                  isOpen ? 'border-[#b2e5ff]/20 bg-[#051810]' : 'border-white/5 bg-[#07090e]'
                }`}
              >
                <button
                  aria-expanded={isOpen}
                  type="button"
                  onClick={() => { triggerHaptic?.('light'); setOpenFaqIndex(isOpen ? null : idx); }}
                  className="w-full p-3.5 text-left flex items-center justify-between gap-3 text-xs font-bold text-white hover:text-[#b2e5ff] transition-colors"
                >
                  <span className="leading-snug">{faq.q}</span>
                  <ChevronDown className={`size-4 shrink-0 text-[#b2e5ff] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
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
          <Send className="size-4 text-[#b2e5ff]" />
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">{t('Email Support', 'Написать в поддержку')}</h4>
        </div>
        <p className="text-[11px] text-[#b2b6bd]">{t('Opens a draft in your email app to support@mercenta.xyz. Nothing is submitted here; send the email yourself. If no app opens, email this address directly. Never include your private key or password.', 'Откроет черновик в почтовом приложении для support@mercenta.xyz. Здесь ничего не отправляется; отправьте письмо самостоятельно. Если приложение не открылось, напишите на этот адрес напрямую. Никогда не указывайте приватный ключ или пароль.')}</p>
          <form onSubmit={handleSendTicket} className="space-y-3">
            <div>
              <label htmlFor="tg-ticket-subject" className="text-xs text-[#b2b6bd] font-semibold block mb-1">{t('Subject', 'Тема')}</label>
              <input
                id="tg-ticket-subject"
                type="text" value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)}
                placeholder={t('e.g. Need help with Steam voucher activation', 'Например: нужна помощь с активацией ваучера Steam')}
                className="w-full bg-[#07090e] border border-white/6 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-[#4a5568] focus:outline-none focus:border-[#b2e5ff]/50 transition-colors"
                required
              />
            </div>
            <div>
              <label htmlFor="tg-ticket-message" className="text-xs text-[#b2b6bd] font-semibold block mb-1">{t('Message', 'Сообщение')}</label>
              <textarea
                id="tg-ticket-message"
                value={ticketMsg} onChange={(e) => setTicketMsg(e.target.value)}
                placeholder={t('Describe your issue or question in detail...', 'Подробно опишите проблему или вопрос…')}
                rows={3}
                className="w-full bg-[#07090e] border border-white/6 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-[#4a5568] focus:outline-none focus:border-[#b2e5ff]/50 transition-colors resize-none"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl font-extrabold text-xs text-[#07090e] flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #b2e5ff, #b2e5ff)' }}
            >
              <Send className="size-3.5" />
              {t('Open email draft', 'Открыть черновик письма')}
            </button>
          </form>
      </div>
    </div>
  );
}
