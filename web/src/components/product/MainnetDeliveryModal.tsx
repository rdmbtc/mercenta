'use client';
import {useState} from 'react';
import './mainnet-record.css';
import {Modal} from './ProductShell';
import {mainnetReceiptExport, mainnetAmountDisplay, type MainnetOrder} from '@/lib/mainnet-orders';
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
  const [copiedOrderId, setCopiedOrderId] = useState(false);

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

  async function copyOrderId(id: string) {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedOrderId(true);
      setTimeout(() => setCopiedOrderId(false), 2500);
    } catch {}
  }

  const amountUsdc = mainnetAmountDisplay(order.amount_units);
  const downloadReceipt = () => {const blob=new Blob([JSON.stringify(mainnetReceiptExport(order),null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='mercenta-receipt-'+order.tx_hash.slice(2,10)+'.json';a.click();URL.revokeObjectURL(url);};
  const exportAction = <button type="button" className="mp-button outline full" onClick={downloadReceipt}>{ru ? 'Скачать квитанцию без секретных кодов' : 'Download redacted receipt'}</button>;
  if (order.status !== 'FULFILLED' || order.delivery_source !== 'provider_response') {
    const fallbackDate = new Date(order.created_at).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    return (
      <Modal title={ru ? 'Квитанция заказа' : 'Order record'} onClose={onClose}>
        <section className="mc-receipt mainnet-record-receipt">
          <span className="mc-kicker">ARC MAINNET / {order.status}</span>
          <h3>{order.name}</h3>
          <p>{ru ? 'Этот сохранённый перевод не доказывает выдачу товара. Проверьте подтверждение провайдера и историю покупки; не оплачивайте повторно.' : 'This saved transfer reference does not prove delivery. Check the provider confirmation and purchase history before sending another payment.'}</p>
          <p className="mainnet-record-amount">{amountUsdc} <span>USDC</span></p>

          <div className="mainnet-receipt-details" style={{margin: '10px 0'}}>
            <span className="mainnet-receipt-details-title">{ru ? 'Детали заказа' : 'Order Details'}</span>
            <dl className="mainnet-receipt-dl">
              <div className="mainnet-receipt-row">
                <dt>{ru ? 'Дата:' : 'Date:'}</dt>
                <dd className="mainnet-receipt-date">{fallbackDate}</dd>
              </div>
              <div className="mainnet-receipt-row">
                <dt>{ru ? 'ID заказа:' : 'Order ID:'}</dt>
                <dd className="mainnet-receipt-order-id">
                  <span className="mainnet-receipt-id-text">{order.id}</span>
                  <button
                    type="button"
                    className="mainnet-id-copy-btn"
                    onClick={() => copyOrderId(order.id)}
                    title={ru ? 'Скопировать ID заказа' : 'Copy Order ID'}
                    aria-label={ru ? 'Скопировать ID заказа' : 'Copy Order ID'}
                  >
                    {copiedOrderId ? <Check size={12} style={{color: '#68d391'}}/> : <Copy size={12}/>}
                  </button>
                </dd>
              </div>
              <div className="mainnet-receipt-row">
                <dt>Arc Tx:</dt>
                <dd className="mainnet-receipt-tx">
                  <a href={`https://explorer.arc.io/tx/${order.tx_hash}`} target="_blank" rel="noreferrer">
                    {order.tx_hash.slice(0, 10)}…{order.tx_hash.slice(-8)} <ExternalLink size={11}/>
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          <a className="mp-button outline full" href={`https://explorer.arc.io/tx/${order.tx_hash}`} target="_blank" rel="noreferrer">Arc Explorer <ExternalLink size={14}/></a>
          {exportAction}
          <a href="/support">{ru ? 'Связаться с поддержкой' : 'Contact support'}</a>
        </section>
      </Modal>
    );
  }
  const dateStr = new Date(order.created_at).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  const nameLower = (order.name || '').toLowerCase();
  const isTopup = order.codes.some(c => c.startsWith('TOPUP_') || c.startsWith('DIRECT_TOPUP'))
    || nameLower.includes('telegram')
    || nameLower.includes('pubg')
    || nameLower.includes('free fire')
    || nameLower.includes('freefire')
    || nameLower.includes('mobile legends')
    || nameLower.includes('mlbb')
    || nameLower.includes('top-up')
    || nameLower.includes('topup')
    || (order.product_id ? order.product_id.includes('topup') : false);
  const topupCode = order.codes.find(c => c.startsWith('TOPUP_') || c.startsWith('DIRECT_TOPUP'));
  let recipient = '';
  if (topupCode) {
    if (topupCode.startsWith('TOPUP_CREDITED:')) {
      recipient = topupCode.replace('TOPUP_CREDITED:', '').trim();
    } else if (topupCode.startsWith('TOPUP_RECORDED:')) {
      const raw = topupCode.replace('TOPUP_RECORDED:', '').trim();
      recipient = raw.startsWith('0x') && raw.length > 20 ? `${raw.slice(0, 8)}…${raw.slice(-6)}` : raw;
    } else {
      recipient = topupCode.replace(/^[^:]+:\s*/, '').trim();
    }
  }
  if (!recipient) {
    recipient = order.initiator ? (order.initiator.length > 20 ? `${order.initiator.slice(0, 8)}…${order.initiator.slice(-6)}` : order.initiator) : '';
  }

  return (
    <Modal
      title={isTopup ? (ru ? 'Прямое зачисление цифрового товара' : 'Direct Top-Up Delivery') : (ru ? 'Ключ активации цифрового товара' : 'Digital Goods Activation Key')}
      onClose={onClose}
    >
      <div className="mainnet-delivery-container">
        <div className="mainnet-status-banner">
          <div className="mainnet-status-banner-left">
            <CheckCircle2 size={20}/>
            <span className="mainnet-status-banner-title">
              {ru ? (isTopup ? 'Заказ исполнен · Товар зачислен' : 'Заказ исполнен · Товар выдан') : (isTopup ? 'Order Fulfilled · Top-Up Credited' : 'Order Fulfilled · Delivered')}
            </span>
          </div>
          <span className="mainnet-status-banner-badge">
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
          <div className="mainnet-activation-box">
            <span className="mainnet-activation-title">
              <ShieldCheck size={14}/>
              {ru ? 'Получатель пополнения:' : 'Top-Up Recipient:'}
            </span>
            <div className="mainnet-topup-recipient-row">
              <span className="mainnet-topup-recipient-text">
                {recipient || (ru ? 'Аккаунт получателя' : 'Recipient account')}
              </span>
              <span className="mainnet-topup-status-badge">
                {ru ? 'Зачислено' : 'Credited'}
              </span>
            </div>
          </div>
        ) : (
          <div className="mainnet-activation-box">
            <div className="mainnet-activation-header">
              <span className="mainnet-activation-title">
                <KeyRound size={14}/>
                {ru ? (order.codes.length > 1 ? 'Ключи активации:' : 'Ключ активации:') : (order.codes.length > 1 ? 'Activation keys:' : 'Activation key:')}
              </span>
              {order.codes.length > 1 && (
                <button
                  type="button"
                  className="mainnet-copy-all-btn"
                  onClick={copyAll}
                >
                  {allCopied ? <Check size={13}/> : <Copy size={13}/>}
                  <span>{allCopied ? (ru ? 'Все скопированы' : 'All copied') : (ru ? 'Скопировать все' : 'Copy all')}</span>
                </button>
              )}
            </div>

            <div className="mainnet-activation-list">
              {order.codes.map((code, idx) => (
                <div key={code + idx} className="mainnet-activation-row">
                  <code className="mainnet-activation-code">
                    {code}
                  </code>
                  <button
                    type="button"
                    className="mp-button outline mainnet-activation-copy-btn"
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

        <div className="mainnet-receipt-details">
          <span className="mainnet-receipt-details-title">
            {ru ? 'Детали квитанции' : 'Receipt Details'}
          </span>
          <dl className="mainnet-receipt-dl">
            <div className="mainnet-receipt-row">
              <dt>{ru ? 'Сумма:' : 'Amount:'}</dt>
              <dd className="mainnet-receipt-amount">{amountUsdc} USDC</dd>
            </div>
            <div className="mainnet-receipt-row">
              <dt>{ru ? 'Дата:' : 'Date:'}</dt>
              <dd className="mainnet-receipt-date">{dateStr}</dd>
            </div>
            <div className="mainnet-receipt-row">
              <dt>{ru ? 'ID заказа:' : 'Order ID:'}</dt>
              <dd className="mainnet-receipt-order-id">
                <span className="mainnet-receipt-id-text">{order.id}</span>
                <button
                  type="button"
                  className="mainnet-id-copy-btn"
                  onClick={() => copyOrderId(order.id)}
                  title={ru ? 'Скопировать ID заказа' : 'Copy Order ID'}
                  aria-label={ru ? 'Скопировать ID заказа' : 'Copy Order ID'}
                >
                  {copiedOrderId ? <Check size={12} style={{color: '#68d391'}}/> : <Copy size={12}/>}
                </button>
              </dd>
            </div>
            <div className="mainnet-receipt-row">
              <dt>Arc Tx:</dt>
              <dd className="mainnet-receipt-tx">
                <a
                  href={`https://explorer.arc.io/tx/${order.tx_hash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {order.tx_hash.slice(0, 10)}…{order.tx_hash.slice(-8)} <ExternalLink size={11}/>
                </a>
              </dd>
            </div>
          </dl>
        </div>

        <div className="mainnet-receipt-instructions">
          <ShieldCheck size={14} style={{display: 'inline', verticalAlign: 'middle', marginRight: '6px', color: '#63b3ed'}}/>
          <span>
            {ru
              ? 'Инструкция: Скопируйте полученный ключ активации и активируйте его в соответствующей платформе (Steam, PlayStation, App Store или веб-сервисе). Подтверждение оплаты не доказывает активацию кода.'
              : 'Instructions: Copy the activation key and redeem it in your account on the designated platform (Steam, PlayStation, App Store or web console). Payment confirmation does not prove code redemption.'}
          </span>
        </div>

        {exportAction}
        <div className="mainnet-modal-actions">
          <a
            className="mp-button outline full mainnet-modal-action-btn"
            href={`https://explorer.arc.io/tx/${order.tx_hash}`}
            target="_blank"
            rel="noreferrer"
          >
            {ru ? 'Проверить в Arc Explorer' : 'View on Arc Explorer'} <ExternalLink size={14}/>
          </a>
          <button type="button" className="mp-button full mainnet-modal-action-btn" onClick={onClose}>
            {ru ? 'Закрыть' : 'Close'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
