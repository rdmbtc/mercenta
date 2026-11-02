'use client';

import { useState, useEffect } from 'react';
import { useArcWallet } from './useArcWallet';
import { TgLocalWallet, TgWalletApproval } from './TgLocalWallet';
import { signOut } from '@/lib/wallet';
import Image from 'next/image';
import { ShoppingBag, Wallet, ShieldCheck, HelpCircle, ArrowUpRight } from 'lucide-react';
import { TgCatalog } from './TgCatalog';
import { TgProfile } from './TgProfile';
import { TgPolicySettings } from './TgPolicySettings';
import { TgHelp } from './TgHelp';
import { TgTopUpModal } from './TgTopUpModal';
import { useTelegramNetwork } from './useTelegramNetwork';
import { NETWORKS, type NetworkMode } from '@/lib/network-profile';
import { testAmount } from '@/lib/test-checkout';
import { TgLocaleProvider, useTgLocale } from './tg-locale';
import './telegram.css';

type Tab = 'store' | 'profile' | 'policy' | 'help';
const NAV_TABS = [
  { id: 'store', label: 'Store', icon: ShoppingBag },
  { id: 'profile', label: 'Wallet', icon: Wallet },
  { id: 'policy', label: 'Controls', icon: ShieldCheck },
  { id: 'help', label: 'Help', icon: HelpCircle },
] as const;
const TAB_INTROS = {
  store: ['Your digital essentials.', 'Games, subscriptions and tools. All in one place.'],
  profile: ['Your wallet.', 'Manage your balance and find your orders.'],
  policy: ['You set the limits.', 'Keep every purchase inside your rules.'],
  help: ['A little help.', 'Answers, documentation and a direct line to support.'],
};

export function TgApp() { return <TgLocaleProvider><TgAppContent /></TgLocaleProvider>; }
function TgAppContent() {
  const [network, setNetwork] = useState<NetworkMode>('testnet');
  const [locked, setLocked] = useState(false);
  const localWallet = useArcWallet(network);
  return <TelegramNetworkApp key={network} localWallet={localWallet} network={network} locked={locked} onLock={setLocked} onNetwork={next => { if (!locked && !localWallet.approval) setNetwork(next); }} />;
}

function TelegramNetworkApp({ localWallet, network, locked, onLock, onNetwork }: { localWallet: ReturnType<typeof useArcWallet>; network: NetworkMode; locked: boolean; onLock: (value: boolean) => void; onNetwork: (network: NetworkMode) => void }) {
  const { ru, t, lang, choose } = useTgLocale();
  const [activeTab, setActiveTab] = useState<Tab>('store');
  useEffect(() => {
    const section = new URLSearchParams(location.search).get('section');
    if (section === 'wallet' || section === 'orders') setActiveTab('profile');
    else if (section === 'help' || section === 'policy') setActiveTab(section);
  }, []);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [external, setExternal] = useState(false);
  const [localSignInPending, setLocalSignInPending] = useState(false);
  const state = useTelegramNetwork(network, external ? undefined : localWallet.provider);
  useEffect(() => {
    if (!localSignInPending || external || !localWallet.provider) return;
    setLocalSignInPending(false);
    onLock(true);
    void signOut().then(() => state.connect()).finally(() => onLock(false));
  }, [localSignInPending, external, localWallet.provider, onLock, state]);
  const busy = locked || state.connecting || !!localWallet.approval || localWallet.busy;
  useEffect(() => {
    if (!external && localWallet.address && !localWallet.provider) {
      void signOut().then(() => window.dispatchEvent(new Event('mercenta-auth-change')));
    }
  }, [external, localWallet.address, localWallet.provider]);
  const chooseTab = (tab: Tab) => {
    if (busy) return;
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  async function connect() {
    if (external || !localWallet.provider) { setWalletOpen(true); return; }
    onLock(true);
    try { await state.connect(); } finally { onLock(false); }
  }

  return <div className="tg-app" data-network={network} onClickCapture={event => {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
    if (!link) return;
    const target = new URL(link.href, window.location.href);
    if (target.origin !== window.location.origin) return;
    const section = target.searchParams.get('section');
    if ((target.pathname === '/app' && (section === 'orders' || section === 'funds')) || target.pathname === '/support') {
      event.preventDefault();
      if (busy) return;
      chooseTab(target.pathname === '/support' ? 'help' : 'profile');
      if (section === 'funds') setTopUpOpen(true);
    }
  }}>
    <header className="tg-header"><div className="tg-header-inner">
      <button className="tg-brand" disabled={busy} onClick={() => chooseTab('store')} aria-label="Mercenta store"><Image src="/mercenta-mark.webp" alt="" width={30} height={30} /><span>mercenta<span className="tg-brand-dot">.</span></span></button>
      <button className="tg-balance" disabled={busy} onClick={() => state.wallet ? chooseTab('profile') : void connect()}>
        {state.connecting ? t('Connecting…', 'Подключение…') : state.wallet ? <span>{state.balance === null ? t('Balance unavailable', 'Баланс недоступен') : testAmount(state.balance)} <small>{NETWORKS[network].asset}</small></span> : t('Connect wallet', 'Подключить кошелёк')}
      </button>
    </div></header>
    <main className="tg-main" lang={lang}>
      <div className="tg-context-toolbar">
        <div className="tg-network-selector" role="group" aria-label={t('Network', 'Сеть')}>
          {(['testnet', 'mainnet'] as const).map(mode => <button key={mode} disabled={busy} aria-pressed={network === mode} onClick={() => onNetwork(mode)}>{mode === 'testnet' ? 'Testnet' : 'Mainnet'}</button>)}
        </div>
        <div className="tg-language-selector" role="group" aria-label={t('Interface language', 'Язык интерфейса')}><button disabled={busy} aria-pressed={ru} onClick={() => choose('ru')}>RU</button><button disabled={busy} aria-pressed={!ru} onClick={() => choose('en')}>EN</button></div>
      </div>
      <p className="tg-network-status" role="status">{NETWORKS[network].name} · {NETWORKS[network].chainId} · {network === 'mainnet' ? t('Real USDC', 'Реальные USDC') : t('Test funds only', 'Только тестовые средства')}</p>
      {state.error && <div className="tg-network-error" role="alert"><p>{ru ? 'Не удалось загрузить данные сети или подключить кошелёк. Проверьте соединение и повторите попытку. Средства не списаны.' : state.error}</p><button className="tg-secondary" disabled={busy || state.loading} onClick={() => void state.refresh()}>{t('Retry network data', 'Повторить загрузку')}</button></div>}
      <div className="tg-intro"><h1>{ru ? { store: 'Всё цифровое. Здесь.', profile: 'Ваш кошелёк.', policy: 'Ваши правила.', help: 'Мы рядом.' }[activeTab] : TAB_INTROS[activeTab][0]}</h1><p>{ru ? { store: 'Игры, подписки и инструменты в одном месте.', profile: 'Баланс, пополнение и история покупок.', policy: 'Настройте предпочтения для следующих покупок.', help: 'Ответы, документация и связь с поддержкой.' }[activeTab] : TAB_INTROS[activeTab][1]}</p></div>
      {activeTab === 'store' && <>
        <section className="tg-feature" aria-label={`${NETWORKS[network].name} store`}><div className="tg-feature-copy"><span className="tg-preview-label">{NETWORKS[network].name}</span><h2>{t('Good things.', 'Хорошие покупки.')} {t('Within your rules.', 'По вашим правилам.')}</h2><a href="#tg-products">{t('Browse the catalog', 'Открыть каталог')} <ArrowUpRight size={17} /></a></div><Image src="/policy-gate.webp" alt="" width={1264} height={848} className="tg-feature-art" priority /></section>
        <TgCatalog key={external ? 'external' : localWallet.provider ? 'local-unlocked' : 'local-locked'} walletProvider={external ? undefined : localWallet.provider ?? undefined} network={network} wallet={state.wallet} readOnly={network === 'testnet' && (!state.summary || !!state.summary.readOnly)} onConnect={() => void connect()} onLock={onLock} />
      </>}
      {activeTab === 'profile' && <><button className="tg-action" onClick={() => setWalletOpen(true)} disabled={busy}>{localWallet.address ? t('Manage encrypted wallet', 'Управление кошельком') : t('Create wallet', 'Создать кошелёк')}</button><TgProfile network={network} state={state} onOpenTopUp={() => setTopUpOpen(true)} /></>}
      {activeTab === 'policy' && <><p className="tg-network-note">{t('Preferences on this device only. These controls do not change server-enforced checkout rules.', 'Настройки только на этом устройстве. Они не изменяют серверные правила оплаты.')}</p><TgPolicySettings key={network} network={network} /></>}
      {activeTab === 'help' && <TgHelp />}
    </main>
    <nav className="tg-nav" aria-label="Main navigation"><div className="tg-nav-inner">{NAV_TABS.map(({ id, label, icon: Icon }) => <button key={id} disabled={busy} onClick={() => chooseTab(id)} aria-current={activeTab === id ? 'page' : undefined}><Icon size={21} strokeWidth={activeTab === id ? 2 : 1.7} /><span>{ru ? { store: 'Магазин', profile: 'Кошелёк', policy: 'Правила', help: 'Помощь' }[id] : label}</span></button>)}</div></nav>
    {walletOpen && <TgLocalWallet wallet={localWallet} onClose={() => setWalletOpen(false)} onSignIn={() => { setExternal(false); setWalletOpen(false); setLocalSignInPending(true); }} onExternal={() => { localWallet.lock(); setExternal(true); setWalletOpen(false); onLock(true); void signOut().then(() => state.connect(true)).finally(() => onLock(false)); }} />}
    <TgWalletApproval wallet={localWallet} />
    {topUpOpen && <TgTopUpModal network={network} wallet={state.wallet} summary={state.summary} onClose={() => { setTopUpOpen(false); onLock(false); }} onRefresh={() => void state.refresh()} onLock={onLock} onConnect={() => void connect()} />}
  </div>;
}
