'use client';

import React, { useState } from 'react';
import { CreditCard, ArrowRight, ShieldCheck, Zap, Copy, Check, ExternalLink, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface ArcOnrampKitProps {
  defaultAddress?: string;
  defaultAmount?: string;
  lang?: 'en' | 'ru';
}

export function ArcOnrampKit({ defaultAddress = '', defaultAmount = '50', lang = 'en' }: ArcOnrampKitProps) {
  const ru = lang === 'ru';
  const [address, setAddress] = useState(defaultAddress);
  const [amount, setAmount] = useState(defaultAmount);
  const [currency, setCurrency] = useState<'USD' | 'EUR'>('USD');
  const [rail, setRail] = useState<'card' | 'cctp'>('card');
  const [sourceChain, setSourceChain] = useState<'base' | 'arbitrum' | 'ethereum' | 'solana'>('base');
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [completed, setCompleted] = useState(false);

  const parsedAmount = Math.max(1, parseFloat(amount) || 0);
  const feeRate = rail === 'card' ? 0.015 : 0.001; // 1.5% fiat card fee vs 0.1% CCTP bridge fee
  const estimatedFee = (parsedAmount * feeRate).toFixed(2);
  const netUsdc = Math.max(0, parsedAmount - parseFloat(estimatedFee)).toFixed(2);

  const onrampUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/onramp?address=${encodeURIComponent(address)}&amount=${amount}&rail=${rail}`
    : `https://mainnet.mercenta.xyz/onramp?address=${encodeURIComponent(address)}&amount=${amount}&rail=${rail}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(onrampUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInitiate = () => {
    setSimulating(true);
    setCompleted(false);
    setTimeout(() => {
      setSimulating(false);
      setCompleted(true);
    }, 1800);
  };

  return (
    <div style={{
      maxWidth: '680px',
      margin: '0 auto',
      background: 'rgba(10, 16, 23, 0.95)',
      border: '1px solid rgba(0, 210, 255, 0.25)',
      borderRadius: '16px',
      padding: '2rem',
      boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6), 0 0 32px rgba(0, 210, 255, 0.08)',
      backdropFilter: 'blur(16px)',
      color: '#fff',
      fontFamily: 'var(--font-sans, system-ui, sans-serif)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '11px', letterSpacing: '0.08em', color: '#00d2ff', textTransform: 'uppercase', fontWeight: 600 }}>
            {ru ? 'ОФИЦИАЛЬНЫЙ ШЛЮЗ ARC ONRAMP' : 'OFFICIAL ARC ONRAMP GATEWAY'}
          </span>
          <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '4px 0 0', letterSpacing: '-0.02em' }}>
            {ru ? 'Пополнение баланса Arc USDC' : 'Fund Your Arc USDC Balance'}
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', color: '#10b981' }}>
          <Zap size={14} />
          <span>Arc Mainnet (5042)</span>
        </div>
      </div>

      {/* Rail Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '1.5rem', background: 'rgba(255, 255, 255, 0.03)', padding: '4px', borderRadius: '10px' }}>
        <button
          type="button"
          onClick={() => { setRail('card'); setCompleted(false); }}
          style={{
            padding: '10px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: rail === 'card' ? 600 : 500,
            background: rail === 'card' ? 'rgba(0, 210, 255, 0.15)' : 'transparent',
            color: rail === 'card' ? '#00d2ff' : '#92a6b6',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <CreditCard size={16} />
          {ru ? 'Банковская карта / Apple Pay' : 'Debit Card / Apple Pay'}
        </button>
        <button
          type="button"
          onClick={() => { setRail('cctp'); setCompleted(false); }}
          style={{
            padding: '10px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: rail === 'cctp' ? 600 : 500,
            background: rail === 'cctp' ? 'rgba(0, 210, 255, 0.15)' : 'transparent',
            color: rail === 'cctp' ? '#00d2ff' : '#92a6b6',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <ExternalLink size={16} />
          {ru ? 'Мост Circle CCTP (L2/Solana)' : 'Circle CCTP Cross-Chain Bridge'}
        </button>
      </div>

      {/* Amount Selector */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ display: 'block', fontSize: '12px', color: '#92a6b6', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {ru ? 'Сумма к оплате' : 'Amount to pay'}
        </label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          {['20', '50', '100', '250'].map(val => (
            <button
              key={val}
              type="button"
              onClick={() => { setAmount(val); setCompleted(false); }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: amount === val ? 600 : 500,
                background: amount === val ? 'rgba(0, 210, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                border: amount === val ? '1px solid #00d2ff' : '1px solid rgba(255, 255, 255, 0.08)',
                color: amount === val ? '#00d2ff' : '#fff',
                cursor: 'pointer'
              }}
            >
              ${val}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={e => { setAmount(e.target.value); setCompleted(false); }}
            placeholder={ru ? 'Другая сумма' : 'Custom amount'}
            style={{
              flex: 1,
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#fff',
              fontSize: '15px'
            }}
          />
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value as 'USD' | 'EUR')}
            style={{
              width: '90px',
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#fff',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
      </div>

      {/* Recipient Address */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ display: 'block', fontSize: '12px', color: '#92a6b6', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {ru ? 'Адрес получателя на Arc (0x...)' : 'Arc Recipient Wallet (0x...)'}
        </label>
        <input
          type="text"
          value={address}
          onChange={e => { setAddress(e.target.value); setCompleted(false); }}
          placeholder="0x..."
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: '8px',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#fff',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '13px'
          }}
        />
      </div>

      {/* Cross-chain source selector if rail === 'cctp' */}
      {rail === 'cctp' && (
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#92a6b6', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {ru ? 'Исходная сеть (откуда переводим)' : 'Source Network (Origin)'}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {(['base', 'arbitrum', 'ethereum', 'solana'] as const).map(net => (
              <button
                key={net}
                type="button"
                onClick={() => setSourceChain(net)}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: sourceChain === net ? 600 : 500,
                  textTransform: 'capitalize',
                  background: sourceChain === net ? 'rgba(0, 210, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                  border: sourceChain === net ? '1px solid #00d2ff' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: sourceChain === net ? '#00d2ff' : '#92a6b6',
                  cursor: 'pointer'
                }}
              >
                {net}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Summary Box */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.35)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '10px',
        padding: '14px 16px',
        marginBottom: '1.5rem',
        fontSize: '13px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#92a6b6' }}>
          <span>{ru ? 'Комиссия шлюза' : 'Gateway Fee'}</span>
          <span>~{estimatedFee} {currency} ({rail === 'card' ? '1.5%' : '0.1%'})</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#92a6b6' }}>
          <span>{ru ? 'Время зачисления на Arc' : 'Settlement Time'}</span>
          <span style={{ color: '#10b981', fontWeight: 500 }}>&lt; 3s (Malachite Finality)</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontWeight: 600, fontSize: '15px' }}>
          <span>{ru ? 'Будет зачислено USDC' : 'Estimated Arc USDC Received'}</span>
          <span style={{ color: '#00d2ff' }}>{netUsdc} USDC</span>
        </div>
      </div>

      {/* Action Button */}
      {completed ? (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '10px',
          padding: '16px',
          textAlign: 'center',
          color: '#10b981',
          marginBottom: '1rem'
        }}>
          <ShieldCheck size={28} style={{ margin: '0 auto 8px' }} />
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
            {ru ? 'Запрос на пополнение успешно обработан!' : 'Onramp Session Initiated!'}
          </h4>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#ade4fb' }}>
            {ru
              ? `Ожидайте зачисления ${netUsdc} USDC на ваш кошелёк Arc в течение нескольких секунд.`
              : `Expect ${netUsdc} USDC deposited to your Arc wallet within seconds via Malachite consensus.`}
          </p>
        </div>
      ) : (
        <button
          type="button"
          disabled={simulating || parsedAmount <= 0}
          onClick={handleInitiate}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '10px',
            border: 'none',
            background: '#00d2ff',
            color: '#000',
            fontWeight: 700,
            fontSize: '15px',
            cursor: simulating ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 0 20px rgba(0, 210, 255, 0.3)',
            transition: 'all 0.2s',
            opacity: simulating ? 0.7 : 1
          }}
        >
          {simulating ? (
            <>
              <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
              {ru ? 'Обработка через шлюз Arc...' : 'Routing through Arc Gateway...'}
            </>
          ) : (
            <>
              {ru ? 'Начать пополнение →' : 'Initiate Arc Onramp →'}
              <ArrowRight size={18} />
            </>
          )}
        </button>
      )}

      {/* Shareable Link Helper */}
      <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#92a6b6' }}>
        <span>{ru ? 'Прямая ссылка для агента или пользователя' : 'Shareable link for agents / users'}</span>
        <button
          type="button"
          onClick={handleCopyLink}
          style={{
            background: 'transparent',
            border: 'none',
            color: copied ? '#10b981' : '#00d2ff',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? (ru ? 'Скопировано!' : 'Copied!') : (ru ? 'Скопировать ссылку' : 'Copy link')}
        </button>
      </div>

      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <Link href="/app" style={{ color: '#92a6b6', fontSize: '13px', textDecoration: 'none' }}>
          ← {ru ? 'Вернуться в консоль Mercenta' : 'Back to Mercenta Console'}
        </Link>
      </div>
    </div>
  );
}
