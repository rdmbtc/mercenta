'use client';
import { useState, useEffect } from 'react';
import { Wallet, RefreshCw, Shield, Bell, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Frame } from '@/components/panelui/frame';
import type { NetworkMode } from '@/lib/network-profile';
import { testAmount } from '@/lib/test-checkout';
import { truncateAddress } from '@/lib/wallet';
import { MainnetDeliveryModal } from '@/components/product/MainnetDeliveryModal';
import { OrderDeliveryDialog } from '@/components/product/TestCheckout';
import type { MainnetOrder } from '@/lib/mainnet-orders';
import type { useTelegramNetwork } from './useTelegramNetwork';
import { useTgLocale } from './tg-locale';
import type { AdminOrderRecord, AdminTelemetrySummary } from '@/lib/telegram-admin';

type NetworkState = ReturnType<typeof useTelegramNetwork>;

export function TgProfile({ network, state, onOpenTopUp }: { network: NetworkMode; state: NetworkState; onOpenTopUp: () => void }) {
  const { t, ru } = useTgLocale();
  const [delivery, setDelivery] = useState<MainnetOrder | null>(null);
  const [testDelivery, setTestDelivery] = useState<string | null>(null);

  // Admin store view state
  const [adminMode, setAdminMode] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminOrders, setAdminOrders] = useState<AdminOrderRecord[]>([]);
  const [adminTelemetry, setAdminTelemetry] = useState<AdminTelemetrySummary | null>(null);
  const [selectedAdminOrder, setSelectedAdminOrder] = useState<AdminOrderRecord | null>(null);
  const [testNotifySent, setTestNotifySent] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('section') === 'orders') document.getElementById('tg-orders')?.scrollIntoView();
    if (params.get('admin') === 'true') setAdminMode(true);
  }, []);

  const loadAdminOrders = async () => {
    setAdminLoading(true);
    try {
      const res = await fetch('/api/telegram/admin/orders?limit=25');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAdminOrders(data.orders || []);
          setAdminTelemetry(data.telemetry || null);
        }
      }
    } catch {
      // Graceful offline fallback
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (adminMode) {
      void loadAdminOrders();
    }
  }, [adminMode]);

  const triggerTestNotification = async () => {
    try {
      const res = await fetch('/api/x402/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: 'gaming-steam-voucher',
          quantity: 1,
          recipient: '@admin_test',
        }),
      });
      // 402 is expected challenge which exercises protocol
      if (res.status === 402 || res.ok) {
        setTestNotifySent(true);
        setTimeout(() => setTestNotifySent(false), 4000);
      }
    } catch {}
  };

  const status = (value: string) => ru ? ({ FULFILLED: 'Выдан', PENDING: 'Ожидает выдачи', RECORDED: 'Перевод сохранён', SIMULATED_FULFILLED: 'Тестовая выдача' }[value] ?? value) : value;

  return <section className="tg-wallet-view">
    <Frame className="tg-frame tg-wallet-panel">
      <Frame.Header><Frame.Title as="h2">{network === 'mainnet' ? t('Wallet balance', 'Баланс кошелька') : t('Test account balance', 'Баланс тестового счёта')}</Frame.Title><Frame.Action><Wallet size={20} aria-hidden="true" /></Frame.Action></Frame.Header>
      <Frame.Panel><Frame.Row><Frame.Content>
        <p className="tg-wallet-amount">{state.loading ? t('Loading…', 'Загрузка…') : state.balance === null ? t('Unavailable', 'Недоступен') : testAmount(state.balance)} <small>{network === 'mainnet' ? 'USDC' : 'test USDC'}</small></p>
        <Frame.Description>{state.wallet ? truncateAddress(state.wallet) : t('Sign in to read your balance. No sample funds are displayed.', 'Войдите, чтобы увидеть баланс. Примерные средства не отображаются.')}</Frame.Description>
        <Frame.Description>{network === 'mainnet' ? t('Real funds in your connected Arc wallet. Testnet funds are separate.', 'Реальные средства в вашем Arc-кошельке. Testnet-баланс учитывается отдельно.') : t('Verified test account funds. Not redeemable for real USDC.', 'Подтверждённые тестовые средства. Не обмениваются на реальные USDC.')}</Frame.Description>
      </Frame.Content></Frame.Row></Frame.Panel>
      <Frame.Footer className="tg-wallet-actions"><button className="tg-action" disabled={!state.wallet || state.loading} onClick={onOpenTopUp}>{network === 'mainnet' ? t('Add USDC', 'Пополнить USDC') : t('Add test USDC', 'Пополнить test USDC')}</button><button className="tg-secondary" disabled={state.loading} onClick={() => void state.refresh()}><RefreshCw size={16} />{t('Refresh', 'Обновить')}</button></Frame.Footer>
    </Frame>

    {/* Section toggle: My Purchases vs Store Admin View */}
    <div style={{ display: 'flex', gap: '8px', margin: '16px 0 8px', width: '100%' }}>
      <button
        type="button"
        className="tg-secondary"
        style={{
          flex: 1,
          padding: '10px 14px',
          borderRadius: '10px',
          background: !adminMode ? '#161d27' : 'transparent',
          color: !adminMode ? '#b2e5ff' : '#96a3b4',
          borderColor: !adminMode ? '#b2e5ff' : 'rgba(255, 255, 255, 0.08)',
          fontWeight: !adminMode ? 600 : 400,
          cursor: 'pointer',
        }}
        onClick={() => setAdminMode(false)}
      >
        {t('My Purchases', 'Мои покупки')}
      </button>
      <button
        type="button"
        className="tg-secondary"
        style={{
          flex: 1,
          padding: '10px 14px',
          borderRadius: '10px',
          background: adminMode ? '#161d27' : 'transparent',
          color: adminMode ? '#b2e5ff' : '#96a3b4',
          borderColor: adminMode ? '#b2e5ff' : 'rgba(255, 255, 255, 0.08)',
          fontWeight: adminMode ? 600 : 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          cursor: 'pointer',
        }}
        onClick={() => setAdminMode(true)}
      >
        <Shield size={15} />
        {t('Store Admin View', '🛡️ Все заказы магазина')}
      </button>
    </div>

    {/* View 1: Customer Purchases */}
    {!adminMode && (
      <Frame className="tg-frame tg-order-history" id="tg-orders"><Frame.Header><Frame.Title as="h2">{t('Your purchases', 'Мои покупки')}</Frame.Title></Frame.Header><Frame.Panel>
        {!state.wallet ? <p>{t('Sign in to view private purchase history.', 'Войдите для просмотра истории покупок.')}</p> : state.loading ? <p role="status">{t('Loading purchases…', 'Загрузка покупок…')}</p> : state.error ? <p role="status">{t('History may be unavailable or incomplete. Refresh to retry.', 'История может быть недоступна или неполна. Обновите данные.')}</p> : null}
        {network === 'mainnet' ? state.mainnetOrders.map(order => <button className="tg-order" key={order.id} onClick={() => setDelivery(order)}><strong>{order.name}</strong><span>{testAmount(order.amount_units)} USDC · {status(order.status)}</span><span>{t('View order record', 'Открыть заказ')}</span></button>) : state.orders.map(order => <div className="tg-order" key={order.id}><strong>{order.name}</strong><span>{testAmount(order.amount_units)} test USDC · {status(order.status)}</span>{order.product_id?.startsWith('catalog-test:') && <button className="tg-secondary" onClick={() => setTestDelivery(order.id)}>{t('View test delivery', 'Тестовая выдача')}</button>}</div>)}
        {state.wallet && !state.loading && !state.error && !(network === 'mainnet' ? state.mainnetOrders.length : state.orders.length) && <p>{t('No purchases on this network yet.', 'В этой сети пока нет покупок.')}</p>}
      </Frame.Panel></Frame>
    )}

    {/* View 2: Store Admin Orders & Telemetry */}
    {adminMode && (
      <Frame className="tg-frame tg-order-history">
        <Frame.Header>
          <Frame.Title as="h2">{t('Storewide Order History & Telemetry', 'История заказов и сводка магазина')}</Frame.Title>
          <Frame.Action>
            <button
              onClick={() => void loadAdminOrders()}
              style={{ background: 'none', border: 'none', color: '#b2e5ff', cursor: 'pointer', padding: 4 }}
              aria-label="Refresh store telemetry"
            >
              <RefreshCw size={17} className={adminLoading ? 'animate-spin' : ''} />
            </button>
          </Frame.Action>
        </Frame.Header>
        <Frame.Panel>
          {/* Telemetry Strip */}
          {adminTelemetry && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '12px 16px', background: '#10151d', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div>
                <small style={{ color: '#96a3b4', fontSize: '11px' }}>{t('Total Orders', 'Всего заказов')}</small>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '16px', color: '#f3f6fa' }}>{adminTelemetry.totalOrders}</p>
              </div>
              <div>
                <small style={{ color: '#96a3b4', fontSize: '11px' }}>{t('Gross Sales', 'Выручка')}</small>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: '#b2e5ff' }}>{adminTelemetry.totalVolumeUsdcFormatted} <span style={{ fontSize: '11px' }}>USDC</span></p>
              </div>
              <div>
                <small style={{ color: '#96a3b4', fontSize: '11px' }}>{t('Fulfilled', 'Исполнено')}</small>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '16px', color: '#86efac' }}>{adminTelemetry.fulfilledOrders}</p>
              </div>
            </div>
          )}

          {/* Quick Notification Test Button */}
          <div style={{ padding: '12px 16px', display: 'flex', gap: '8px', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <button
              type="button"
              className="tg-secondary"
              style={{
                flex: 1,
                fontSize: '12px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: '#161d27',
                color: testNotifySent ? '#86efac' : '#b2e5ff',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
              }}
              onClick={triggerTestNotification}
            >
              {testNotifySent ? <CheckCircle2 size={14} /> : <Bell size={14} />}
              {testNotifySent ? t('Alert Dispatched to Bot!', 'Уведомление отправлено в бот!') : t('Test Push Alert to Bot Admins', 'Тест пуш-уведомления админам')}
            </button>
          </div>

          {adminLoading && <p role="status">{t('Loading store purchase history…', 'Загрузка общей истории заказов…')}</p>}

          {!adminLoading && adminOrders.length === 0 && (
            <p>{t('No orders have been recorded in the store yet.', 'В базе данных магазина пока нет заказов.')}</p>
          )}

          {!adminLoading && adminOrders.map((o) => (
            <button
              className="tg-order"
              key={o.id}
              onClick={() => setSelectedAdminOrder(o)}
              style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', textAlign: 'left', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: '#f3f6fa' }}>{o.product_name}</strong>
                <span style={{ color: '#b2e5ff', fontWeight: 600 }}>{o.amount_usdc_formatted} USDC</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#96a3b4' }}>
                <span>ID: #{o.id.slice(0, 10)} · {truncateAddress(o.customer_wallet)}</span>
                <span style={{ color: o.status === 'FULFILLED' ? '#86efac' : '#fde047' }}>{status(o.status)}</span>
              </div>
              <span style={{ fontSize: '11px', color: '#96a3b4' }}>
                {new Date(o.created_at).toISOString().slice(0, 16).replace('T', ' ')} UTC
              </span>
            </button>
          ))}
        </Frame.Panel>
      </Frame>
    )}

    {/* Admin Order Detail Modal */}
    {selectedAdminOrder && (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(8, 11, 16, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px',
        }}
        onClick={() => setSelectedAdminOrder(null)}
      >
        <div
          style={{
            background: '#10151d',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            maxWidth: '460px',
            width: '100%',
            padding: '24px',
            color: '#f3f6fa',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#b2e5ff' }}>
              {t('Order Details', 'Детали заказа')}
            </h3>
            <span style={{ fontSize: '12px', background: '#161d27', padding: '4px 8px', borderRadius: '6px', color: '#86efac' }}>
              {selectedAdminOrder.status}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div>
              <small style={{ color: '#96a3b4', display: 'block' }}>{t('Product', 'Товар')}</small>
              <strong style={{ fontSize: '15px' }}>{selectedAdminOrder.product_name}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <small style={{ color: '#96a3b4', display: 'block' }}>{t('Amount', 'Сумма')}</small>
                <strong style={{ color: '#b2e5ff', fontSize: '16px' }}>{selectedAdminOrder.amount_usdc_formatted} USDC</strong>
              </div>
              <div>
                <small style={{ color: '#96a3b4', display: 'block' }}>{t('Network', 'Сеть')}</small>
                <span>Arc Mainnet (5042)</span>
              </div>
            </div>

            <div>
              <small style={{ color: '#96a3b4', display: 'block' }}>{t('Customer Wallet', 'Кошелек покупателя')}</small>
              <code style={{ fontSize: '12px', background: '#080b10', padding: '4px 6px', borderRadius: '4px', wordBreak: 'break-all' }}>
                {selectedAdminOrder.customer_wallet}
              </code>
            </div>

            <div>
              <small style={{ color: '#96a3b4', display: 'block' }}>{t('Order Reference ID', 'ID заказа')}</small>
              <code style={{ fontSize: '12px', background: '#080b10', padding: '4px 6px', borderRadius: '4px', wordBreak: 'break-all' }}>
                #{selectedAdminOrder.id}
              </code>
            </div>

            {selectedAdminOrder.payment_tx_hash && (
              <div>
                <small style={{ color: '#96a3b4', display: 'block' }}>{t('Payment Transaction', 'Хеш транзакции оплаты')}</small>
                <a
                  href={`https://explorer.arc.io/tx/${selectedAdminOrder.payment_tx_hash}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#b2e5ff', textDecoration: 'underline', fontSize: '12px' }}
                >
                  {selectedAdminOrder.payment_tx_hash.slice(0, 16)}…{selectedAdminOrder.payment_tx_hash.slice(-8)}
                  <ExternalLink size={12} />
                </a>
              </div>
            )}

            <div>
              <small style={{ color: '#96a3b4', display: 'block' }}>{t('Created At', 'Время создания')}</small>
              <span>{new Date(selectedAdminOrder.created_at).toISOString().replace('T', ' ').slice(0, 19)} UTC</span>
            </div>
          </div>

          <button
            type="button"
            className="tg-action"
            style={{ width: '100%', marginTop: '20px', padding: '12px', borderRadius: '10px' }}
            onClick={() => setSelectedAdminOrder(null)}
          >
            {t('Close', 'Закрыть')}
          </button>
        </div>
      </div>
    )}

    {delivery && <MainnetDeliveryModal order={delivery} ru={ru} onClose={() => setDelivery(null)} />}
    {testDelivery && <OrderDeliveryDialog id={testDelivery} ru={ru} onClose={() => setTestDelivery(null)} />}
  </section>;
}
