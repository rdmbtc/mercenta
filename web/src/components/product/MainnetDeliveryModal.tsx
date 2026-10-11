'use client';
import {useState} from 'react';
import {Modal} from './ProductShell';
import {type MainnetOrder} from '@/lib/mainnet-orders';
import {CheckCircle2,Copy,Check,ExternalLink,ShieldCheck,KeyRound} from 'lucide-react';

export function MainnetDeliveryModal({
  order,
  ru,
  onClose,
}: {
  order: MainnetOrder;
  ru: boolean;
  onClose: () => void;
}) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [allCopied, setAllCopied] = useState(false);

  async function copyKey(code: string, idx: number) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2500);
    } catch {}
  }

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(order.codes.join('\n'));
      setAllCopied(true);
      setTimeout(() => setAllCopied(false), 2500);
    } catch {}
  }

  const amountUsdc = (Number(order.amount_units) / 1_000_000).toFixed(2);
  const dateStr = new Date(order.created_at).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  const isTopup = order.codes.some(c => c.startsWith('TOPUP_CREDITED:')) || order.name.toLowerCase().includes('telegram');
  const recipient = order.codes.find(c => c.startsWith('TOPUP_CREDITED:'))?.replace('TOPUP_CREDITED:', '') || '';

  return (
    <Modal
      title={isTopup ? (ru ? 'Прямое зачисление цифрового товара' : 'Direct Top-Up Delivery') : (ru ? 'Ключ активации цифрового товара' : 'Digital Goods Activation Key')}
      onClose={onClose}
    >
      <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(72, 187, 120, 0.1)', border: '1px solid rgba(72, 187, 120, 0.3)', borderRadius: '10px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#68d391'}}>
            <CheckCircle2 size={20}/>
            <span style={{fontWeight: 700, fontSize: '14px'}}>
              {ru ? (isTopup ? 'Заказ исполнен · Товар зачислен' : 'Заказ исполнен · Товар выдан') : (isTopup ? 'Order Fulfilled · Top-Up Credited' : 'Order Fulfilled · Delivered')}
            </span>
          </div>
          <span style={{fontSize: '11px', background: '#22543d', color: '#9ae6b4', padding: '2px 8px', borderRadius: '4px', fontWeight: 600}}>
            ARC MAINNET · 5042
          </span>
        </div>

        <div>
          <h4 style={{margin: '0 0 6px', fontSize: '16px', fontWeight: 700}}>
            {order.name}
          </h4>
          <p style={{margin: 0, fontSize: '13px', color: '#a0aec0'}}>
            {isTopup
              ? (ru ? 'Товар зачислен напрямую на баланс указанного аккаунта.' : 'Top-up credited directly to designated recipient account.')
              : (ru ? 'Цифровой код активации / ваучер для вашей учетной записи.' : 'Redeemable activation code / voucher for your account.')}
          </p>
        </div>

        {isTopup ? (
          <div style={{background: 'rgba(15, 23, 42, 0.75)', border: '1px solid #334155', borderRadius: '10px', padding: '14px'}}>
            <span style={{fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px'}}>
              <ShieldCheck size={14}/>
              {ru ? 'Получатель пополнения:' : 'Top-Up Recipient:'}
            </span>
            <div style={{marginTop: '10px', padding: '12px 14px', background: '#090d16', border: '1px solid #2d3748', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span style={{fontFamily: 'monospace', fontSize: '16px', fontWeight: 700, color: '#68d391'}}>
                {recipient || 'Аккаунт получателя'}
              </span>
              <span style={{fontSize: '12px', color: '#9ae6b4', background: '#22543d', padding: '2px 8px', borderRadius: '4px', fontWeight: 600}}>
                {ru ? 'Зачислено' : 'Credited'}
              </span>
            </div>
          </div>
        ) : (
          <div style={{background: 'rgba(15, 23, 42, 0.75)', border: '1px solid #334155', borderRadius: '10px', padding: '14px'}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px'}}>
              <span style={{fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px'}}>
                <KeyRound size={14}/>
                {ru ? (order.codes.length > 1 ? 'Ключи активации:' : 'Ключ активации:') : (order.codes.length > 1 ? 'Activation keys:' : 'Activation key:')}
              </span>
              {order.codes.length > 1 && (
                <button
                  className="ma-link"
                  style={{fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px'}}
                  onClick={copyAll}
                >
                  {allCopied ? <Check size={13}/> : <Copy size={13}/>}
                  <span>{allCopied ? (ru ? 'Все скопированы' : 'All copied') : (ru ? 'Скопировать все' : 'Copy all')}</span>
                </button>
              )}
            </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
            {order.codes.map((code, idx) => (
              <div
                key={code + idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: '#090d16',
                  border: '1px solid #2d3748',
                  borderRadius: '8px',
                }}
              >
                <code style={{fontFamily: 'monospace', fontSize: '16px', fontWeight: 700, color: '#63b3ed', letterSpacing: '0.08em'}}>
                  {code}
                </code>
                <button
                  className="mp-button outline"
                  style={{padding: '6px 12px', fontSize: '12px', minHeight: '32px', gap: '6px'}}
                  onClick={() => copyKey(code, idx)}
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check size={14} style={{color: '#68d391'}}/>
                      <span style={{color: '#68d391'}}>{ru ? 'Скопировано!' : 'Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14}/>
                      <span>{ru ? 'Скопировать' : 'Copy'}</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
        )}

        <div style={{background: 'rgba(26, 32, 44, 0.4)', borderRadius: '8px', padding: '12px', border: '1px solid #2d3748'}}>
          <span style={{fontSize: '11px', fontWeight: 600, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
            {ru ? 'Детали квитанции' : 'Receipt Details'}
          </span>
          <dl style={{display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 14px', fontSize: '12px', margin: '8px 0 0'}}>
            <dt style={{color: '#718096'}}>{ru ? 'Сумма:' : 'Amount:'}</dt>
            <dd style={{fontWeight: 600, color: '#68d391'}}>{amountUsdc} USDC</dd>
            <dt style={{color: '#718096'}}>{ru ? 'Дата:' : 'Date:'}</dt>
            <dd style={{color: '#e2e8f0'}}>{dateStr}</dd>
            <dt style={{color: '#718096'}}>{ru ? 'ID заказа:' : 'Order ID:'}</dt>
            <dd style={{fontFamily: 'monospace', fontSize: '11px', color: '#cbd5e0'}}>{order.id}</dd>
            <dt style={{color: '#718096'}}>Arc Tx:</dt>
            <dd style={{wordBreak: 'break-all'}}>
              <a
                href={`https://explorer.arc.io/tx/${order.tx_hash}`}
                target="_blank"
                rel="noreferrer"
                style={{color: '#63b3ed', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none'}}
              >
                {order.tx_hash.slice(0, 10)}…{order.tx_hash.slice(-8)} <ExternalLink size={11}/>
              </a>
            </dd>
          </dl>
        </div>

        <div style={{fontSize: '12px', color: '#a0aec0', lineHeight: 1.6, padding: '10px 12px', background: 'rgba(49, 130, 206, 0.08)', border: '1px solid rgba(49, 130, 206, 0.25)', borderRadius: '8px'}}>
          <ShieldCheck size={14} style={{display: 'inline', verticalAlign: 'middle', marginRight: '6px', color: '#63b3ed'}}/>
          <span>
            {ru
              ? 'Инструкция: Скопируйте полученный ключ активации и активируйте его в соответствующей платформе (Steam, PlayStation, App Store или веб-сервисе). Код подтвержден транзакцией в блокчейне Arc.'
              : 'Instructions: Copy the activation key and redeem it in your account on the designated platform (Steam, PlayStation, App Store or web console). Verified on-chain via Arc.'}
          </span>
        </div>

        <div style={{display: 'flex', gap: '10px', marginTop: '4px'}}>
          <a
            className="mp-button outline full"
            href={`https://explorer.arc.io/tx/${order.tx_hash}`}
            target="_blank"
            rel="noreferrer"
            style={{textAlign: 'center', justifyContent: 'center', textDecoration: 'none'}}
          >
            {ru ? 'Проверить в Arc Explorer' : 'View on Arc Explorer'} <ExternalLink size={14}/>
          </a>
          <button className="mp-button full" onClick={onClose} style={{justifyContent: 'center'}}>
            {ru ? 'Закрыть' : 'Close'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
