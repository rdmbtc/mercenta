'use client';

import { useTgLocale } from './tg-locale';
import { useEffect, useState } from 'react';
import { Search, ShoppingBag } from 'lucide-react';
import { refreshPublicCatalog, unpackBrowse } from '@/lib/public-catalog-client';
import type { CatalogProduct } from '@/lib/supplier';
import type { NetworkMode } from '@/lib/network-profile';
import { CatalogItemDialog } from '@/components/product/CatalogItemDialog';
import { ProductImage } from '@/components/product/ProductImage';

const categories = [
  ['all', 'All products'], ['gaming', 'Gaming'], ['streaming', 'Entertainment'],
  ['creator', 'Creators'], ['developer', 'Developer'], ['cloud', 'Compute'],
];

export function TgCatalog({ network, wallet, readOnly, onConnect, onLock, walletProvider }: {
  walletProvider?: import('@/lib/wallet').Eip1193Provider;
  network: NetworkMode;
  wallet: string | null;
  readOnly: boolean;
  onConnect: () => void;
  onLock: (locked: boolean) => void;
}) {
  const { t, lang, ru } = useTgLocale();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState<CatalogProduct | null>(null);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(false);
    refreshPublicCatalog().then(data => {
      if (live) setProducts(unpackBrowse(data).products);
    }).catch(() => { if (live) setError(true); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [attempt]);

  const filtered = products.filter(product =>
    (category === 'all' || product.category === category) &&
    `${product.name} ${product.brand} ${product.countryCode ?? ''}`.toLowerCase().includes(search.trim().toLowerCase())
  );

  return <section className="tg-live-catalog" id="tg-products" aria-label={`${network} catalogue`}>
    <label className="tg-search"><Search size={18} aria-hidden="true" />
      <input aria-label={t('Search products', 'Поиск товаров')} value={search} onChange={event => setSearch(event.target.value)} placeholder={t('Search games, subscriptions, tools…', 'Игры, подписки, инструменты…')} />
    </label>
    <div className="tg-category-tabs" aria-label="Product categories">
      {categories.map(([id, label]) => <button type="button" key={id} aria-pressed={category === id} onClick={() => setCategory(id)}>{ru ? ({ all: 'Все товары', gaming: 'Игры', streaming: 'Подписки', creator: 'Авторам', developer: 'Разработка', cloud: 'Вычисления' } as Record<string, string>)[id] : label}</button>)}
    </div>
    <p className="tg-network-note">{network === 'mainnet'
      ? t('Arc Mainnet · Real USDC. Review a signed quote before authorizing payment.', 'Arc Mainnet · Реальные USDC. Проверьте котировку перед подтверждением оплаты.')
      : t('Arc Testnet · Test USDC. Test deliveries cannot be redeemed.', 'Arc Testnet · Тестовые USDC. Тестовые коды нельзя активировать.')}</p>
    {loading ? <p className="tg-state" role="status">{t('Loading current products…', 'Загружаем товары…')}</p>
      : error ? <div className="tg-state" role="alert"><h2>{t('Catalogue unavailable', 'Каталог недоступен')}</h2><p>{t('Prices and stock could not be verified. No sample inventory is substituted.', 'Не удалось проверить цены и наличие. Примерные товары не подставляются.')}</p><button className="tg-action" onClick={() => setAttempt(value => value + 1)}>{t('Retry catalogue', 'Повторить загрузку')}</button></div>
        : filtered.length ? <div className="tg-product-grid">{filtered.slice(0, 60).map(product => <button className="tg-product" key={product.id} onClick={() => setSelected(product)}>
          <ProductImage name={product.name} category={product.category} imageUrl={product.imageUrl} className="tg-product-image" />
          <div className="tg-product-copy"><span>{product.countryCode || t('Region in details', 'Регион в описании')}</span><h2>{product.name}</h2><p>{t('From', 'От')} <strong>{product.minPrice.toFixed(2)} {product.currency}</strong></p><span className="tg-product-details">{t('Choose an option', 'Выбрать вариант')}</span></div>
        </button>)}</div>
          : <div className="tg-state"><ShoppingBag size={28} /><h2>{t('No matching products', 'Ничего не найдено')}</h2><p>{t('Try another search or category.', 'Измените запрос или категорию.')}</p><button className="tg-action" onClick={() => { setSearch(''); setCategory('all'); }}>{t('Reset filters', 'Сбросить фильтры')}</button></div>}
    {filtered.length > 60 && <p className="tg-network-note">{t('Showing the first 60 matches. Refine your search to find a specific product.', 'Показаны первые 60 результатов. Уточните запрос, чтобы найти нужный товар.')}</p>}
    {selected && <CatalogItemDialog key={`${network}:${wallet}:${selected.id}`} product={selected} lang={lang} wallet={wallet} readOnly={readOnly} isMainnet={network === 'mainnet'} walletProvider={walletProvider} onLockChange={onLock} onClose={() => setSelected(null)} onConnect={onConnect} />}
  </section>;
}
