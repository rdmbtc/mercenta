'use client';
import { useState, useEffect } from 'react';
import { Wallet, RefreshCw } from 'lucide-react';
import { Frame } from '@/components/panelui/frame';
import type { NetworkMode } from '@/lib/network-profile';
import { testAmount } from '@/lib/test-checkout';
import { truncateAddress } from '@/lib/wallet';
import { MainnetDeliveryModal } from '@/components/product/MainnetDeliveryModal';
import { OrderDeliveryDialog } from '@/components/product/TestCheckout';
import type { MainnetOrder } from '@/lib/mainnet-orders';
import type { useTelegramNetwork } from './useTelegramNetwork';
import { useTgLocale } from './tg-locale';
type NetworkState = ReturnType<typeof useTelegramNetwork>;
export function TgProfile({ network, state, onOpenTopUp }: { network: NetworkMode; state: NetworkState; onOpenTopUp: () => void }) {
  const { t, ru } = useTgLocale();
  const [delivery, setDelivery] = useState<MainnetOrder | null>(null);
  const [testDelivery, setTestDelivery] = useState<string | null>(null);
  useEffect(() => { if (new URLSearchParams(location.search).get('section') === 'orders') document.getElementById('tg-orders')?.scrollIntoView(); }, []);
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
    <Frame className="tg-frame tg-order-history" id="tg-orders"><Frame.Header><Frame.Title as="h2">{t('Your purchases', 'Мои покупки')}</Frame.Title></Frame.Header><Frame.Panel>
      {!state.wallet ? <p>{t('Sign in to view private purchase history.', 'Войдите для просмотра истории покупок.')}</p> : state.loading ? <p role="status">{t('Loading purchases…', 'Загрузка покупок…')}</p> : state.error ? <p role="status">{t('History may be unavailable or incomplete. Refresh to retry.', 'История может быть недоступна или неполна. Обновите данные.')}</p> : null}
      {network === 'mainnet' ? state.mainnetOrders.map(order => <button className="tg-order" key={order.id} onClick={() => setDelivery(order)}><strong>{order.name}</strong><span>{testAmount(order.amount_units)} USDC · {status(order.status)}</span><span>{t('View order record', 'Открыть заказ')}</span></button>) : state.orders.map(order => <div className="tg-order" key={order.id}><strong>{order.name}</strong><span>{testAmount(order.amount_units)} test USDC · {status(order.status)}</span>{order.product_id?.startsWith('catalog-test:') && <button className="tg-secondary" onClick={() => setTestDelivery(order.id)}>{t('View test delivery', 'Тестовая выдача')}</button>}</div>)}
      {state.wallet && !state.loading && !state.error && !(network === 'mainnet' ? state.mainnetOrders.length : state.orders.length) && <p>{t('No purchases on this network yet.', 'В этой сети пока нет покупок.')}</p>}
    </Frame.Panel></Frame>
    {delivery && <MainnetDeliveryModal order={delivery} ru={ru} onClose={() => setDelivery(null)} />}
    {testDelivery && <OrderDeliveryDialog id={testDelivery} ru={ru} onClose={() => setTestDelivery(null)} />}
  </section>;
}
