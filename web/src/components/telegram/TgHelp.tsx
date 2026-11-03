'use client';

import React, { useState } from 'react';
import { HelpCircle, ExternalLink, Send, Activity, ChevronDown, MessageSquare } from 'lucide-react';
import { Frame } from '@/components/panelui/frame';
import { useTgLocale } from './tg-locale';

interface TgHelpProps {
  triggerHaptic?: (type?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => void;
}

export function TgHelp({ triggerHaptic }: TgHelpProps) {
  const { t } = useTgLocale();
  const faqs = [
    {
      q: t('What changes between Testnet and Mainnet?', 'Чем отличаются Testnet и Mainnet?'),
      a: t('Testnet uses an Arc test account and non-redeemable delivery. Mainnet uses real USDC from your connected wallet and requires a signed server quote. Balances and purchases are separate.', 'Testnet использует тестовый аккаунт Arc и не предоставляет реальные товары. Mainnet использует реальные USDC из подключённого кошелька и требует подписанного сервером ценового предложения. Балансы и покупки раздельные.'),
    },
    {
      q: t('Which chains can I use to deposit USDC?', 'В каких сетях можно пополнить USDC?'),
      a: t('Test deposits must be sent on Arc Testnet (5042002) and verified before account credit. Mainnet purchases use Arc Mainnet (5042). Available funding methods are shown in Add USDC; never send to an address on a different network.', 'Тестовые пополнения отправляются в Arc Testnet (5042002) и проверяются перед зачислением. Покупки в Mainnet используют Arc Mainnet (5042). Доступные способы пополнения показаны в разделе «Добавить USDC»; никогда не отправляйте средства на адрес в другой сети.'),
    },
    {
      q: t('What is the 5-Gate Policy Engine?', 'Что такое 5-Gate Policy Engine?'),
      a: t('A deterministic safety layer protecting businesses and AI agents from unconstrained spending, supplier price slippage, and front-running by enforcing gross margin floors (>=2.5%) and daily velocity limits.', 'Детерминированный уровень защиты бизнеса и ИИ-агентов от бесконтрольных расходов, проскальзывания цен поставщика и фронтраннинга. Он обеспечивает минимальную валовую маржу (>=2.5%) и дневные лимиты операций.'),
    },
    {
      q: t('Where can I find product activation guides?', 'Где найти инструкцию по активации товара?'),
      a: t('Each product in the catalogue and each fulfilled order in Purchases displays a dedicated Activation Guide with the official redemption portal (Steam, PlayStation, Microsoft/Xbox, Apple, Spotify, etc.) and step-by-step instructions.', 'Каждый товар в каталоге и каждый исполненный заказ в разделе «Мои покупки» содержит подробную инструкцию по активации с прямой ссылкой на официальный портал погашения (Steam, PlayStation, Microsoft/Xbox, Apple, Spotify и др.) и пошаговым руководством.'),
    },
    {
      q: t('How can I use a wallet in Telegram?', 'Как использовать кошелёк в Telegram?'),
      a: t('Create or restore an encrypted local Mercenta wallet on this device, or connect an external provider such as MetaMask or Rabby in a compatible browser. Your password encrypts the local key; keep an encrypted backup and your password separately. Mercenta cannot recover the key. Signing and payments require your confirmation.', 'Создайте или восстановите зашифрованный локальный кошелёк Mercenta на этом устройстве либо подключите внешний кошелёк, например MetaMask или Rabby, в совместимом браузере. Пароль шифрует локальный ключ; храните зашифрованную резервную копию и пароль отдельно. Mercenta не может восстановить ключ. Подписи и платежи требуют вашего подтверждения.'),
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

  return <div className="tg-help">
    <Frame className="tg-frame">
      <Frame.Header>
        <Frame.Title as="h2">{t('Support & Developer Hub', 'Поддержка и разработка')}</Frame.Title>
        <Frame.Action><HelpCircle size={20} aria-hidden="true" /></Frame.Action>
      </Frame.Header>
      <Frame.Panel>
        <Frame.Row><Frame.Content><Frame.Description>{t('Need help with order fulfillment, API integration, or multi-chain deposits? Contact support by email or check the service status.', 'Нужна помощь с заказом, интеграцией API или пополнением в разных сетях? Напишите в поддержку или проверьте статус сервиса.')}</Frame.Description></Frame.Content></Frame.Row>
        <Frame.Row href="https://t.me/mercentabot?start=support" target="_blank" rel="noopener noreferrer"><Frame.Content><Frame.Title as="p">{t('Private Telegram support', 'Личное обращение в Telegram')}</Frame.Title><Frame.Description>{t('Send /support to open a private ticket. Only you and the store administrator can access the conversation.', 'Отправьте /support для создания личного тикета. Переписка доступна только вам и администратору магазина.')}</Frame.Description></Frame.Content><Frame.Media><MessageSquare size={17} aria-hidden="true" /></Frame.Media></Frame.Row>
        <Frame.Row href="https://docs.mercenta.xyz" target="_blank" rel="noopener noreferrer" onClick={() => triggerHaptic?.('light')}>
          <Frame.Content><Frame.Title as="p">{t('Developer Docs', 'Документация')}</Frame.Title></Frame.Content>
          <Frame.Media><ExternalLink size={17} aria-hidden="true" /></Frame.Media>
        </Frame.Row>
        <Frame.Row href="https://status.mercenta.xyz" target="_blank" rel="noopener noreferrer" onClick={() => triggerHaptic?.('light')}>
          <Frame.Media><Activity size={17} aria-hidden="true" /></Frame.Media>
          <Frame.Content><Frame.Title as="p">{t('Service status', 'Статус сервиса')}</Frame.Title></Frame.Content>
          <Frame.Media><ExternalLink size={17} aria-hidden="true" /></Frame.Media>
        </Frame.Row>
      </Frame.Panel>
    </Frame>

    <Frame className="tg-frame">
      <Frame.Header><Frame.Title as="h2">{t('Frequently Asked Questions', 'Частые вопросы')}</Frame.Title><Frame.Action><MessageSquare size={18} aria-hidden="true" /></Frame.Action></Frame.Header>
      <Frame.Panel>
        {faqs.map((faq, idx) => {
          const isOpen = openFaqIndex === idx;
          return <div className="tg-faq" key={faq.q}>
            <button aria-expanded={isOpen} aria-controls={`tg-faq-${idx}`} type="button" onClick={() => { triggerHaptic?.('light'); setOpenFaqIndex(isOpen ? null : idx); }}>
              <span>{faq.q}</span><ChevronDown size={17} aria-hidden="true" className={isOpen ? 'tg-faq-open' : undefined} />
            </button>
            <p id={`tg-faq-${idx}`} hidden={!isOpen}>{faq.a}</p>
          </div>;
        })}
      </Frame.Panel>
    </Frame>

    <Frame className="tg-frame">
      <Frame.Header><Frame.Title as="h2">{t('Launch your storefront', 'Запустить свой магазин')}</Frame.Title></Frame.Header>
      <Frame.Panel>
        <Frame.Row><Frame.Content><Frame.Description>{t('Download the configurable RU/EN Telegram starter. Bring your own bot token, name and support contact. Uses your VPS and SQLite, without paid bot services.', 'Скачайте настраиваемый Telegram-шаблон RU/EN. Укажите свой токен бота, название и поддержку. Работает на вашем VPS с SQLite, без платных бот-сервисов.')}</Frame.Description><Frame.Description>{t('This is a storefront linked to a Mini App. Independent payments, merchant markup and procurement require a separate verified integration.', 'Это витрина с переходом в Mini App. Собственная оплата, наценка и закупка требуют отдельной проверенной интеграции.')}</Frame.Description></Frame.Content></Frame.Row>
        <Frame.Row href="/downloads/mercenta-shop-template.zip"><Frame.Content><Frame.Title as="p">{t('Download shop starter · ZIP', 'Скачать шаблон магазина · ZIP')}</Frame.Title></Frame.Content><Frame.Media><ExternalLink size={17} aria-hidden="true" /></Frame.Media></Frame.Row>
      </Frame.Panel>
    </Frame>

    <Frame className="tg-frame">
      <Frame.Header><Frame.Title as="h2">{t('Email Support', 'Написать в поддержку')}</Frame.Title><Frame.Action><Send size={18} aria-hidden="true" /></Frame.Action></Frame.Header>
      <Frame.Panel><form onSubmit={handleSendTicket} className="tg-support-form">
        <p>{t('Opens a draft in your email app to support@mercenta.xyz. Nothing is submitted here; send the email yourself. If no app opens, email this address directly. Never include your private key or password.', 'Откроет черновик в почтовом приложении для support@mercenta.xyz. Здесь ничего не отправляется; отправьте письмо самостоятельно. Если приложение не открылось, напишите на этот адрес напрямую. Никогда не указывайте приватный ключ или пароль.')}</p>
        <div><label htmlFor="tg-ticket-subject">{t('Subject', 'Тема')}</label>
          <input id="tg-ticket-subject" type="text" value={ticketSubject} onChange={e => setTicketSubject(e.target.value)} placeholder={t('e.g. Need help with Steam voucher activation', 'Например: нужна помощь с активацией ваучера Steam')} required />
        </div>
        <div><label htmlFor="tg-ticket-message">{t('Message', 'Сообщение')}</label>
          <textarea id="tg-ticket-message" value={ticketMsg} onChange={e => setTicketMsg(e.target.value)} placeholder={t('Describe your issue or question in detail...', 'Подробно опишите проблему или вопрос…')} rows={3} required />
        </div>
        <button type="submit" className="tg-action"><Send size={16} aria-hidden="true" />{t('Open email draft', 'Открыть черновик письма')}</button>
      </form></Frame.Panel>
    </Frame>
  </div>;
}
