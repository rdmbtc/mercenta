'use client';

import { useTgLocale } from './tg-locale';
import { useEffect, useMemo, useState } from 'react';
import { Search, ShoppingBag, Globe, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { refreshPublicCatalog, unpackBrowse } from '@/lib/public-catalog-client';
import type { CatalogProduct } from '@/lib/supplier';
import type { NetworkMode } from '@/lib/network-profile';
import { CatalogItemDialog } from '@/components/product/CatalogItemDialog';
import { CatalogFamilyDialog } from '@/components/product/CatalogFamilyDialog';
import { ProductImage } from '@/components/product/ProductImage';
import {
  groupCatalog,
  regionLabel,
  regionCode,
  familyProducts,
  familyPrice,
  type ProductFamily,
} from '@/lib/catalog-families';

const POPULAR_REGIONS = [
  { code: 'all', en: 'All regions', ru: 'Все регионы', flag: '🌍' },
  { code: 'GLOB', en: 'Global', ru: 'Весь мир', flag: '🌐' },
  { code: 'US', en: 'USA', ru: 'США', flag: '🇺🇸' },
  { code: 'TR', en: 'Turkey', ru: 'Турция', flag: '🇹🇷' },
  { code: 'EU', en: 'Europe', ru: 'Европа', flag: '🇪🇺' },
  { code: 'CIS', en: 'CIS', ru: 'СНГ', flag: '🇷🇺' },
  { code: 'BR', en: 'Brazil', ru: 'Бразилия', flag: '🇧🇷' },
];

const CATEGORIES = [
  { id: 'all', en: 'All products', ru: 'Все товары', icon: '✨' },
  { id: 'gaming', en: 'Gaming', ru: '🎮 Игры', icon: '🎮' },
  { id: 'streaming', en: 'Entertainment', ru: '🎬 Подписки', icon: '🎬' },
  { id: 'creator', en: 'Telegram & Creators', ru: '💎 Telegram Stars', icon: '💎' },
  { id: 'developer', en: 'Developer & AI', ru: '💻 Разработка', icon: '💻' },
  { id: 'cloud', en: 'Cloud Compute', ru: '☁️ Вычисления', icon: '☁️' },
];

const FORMATS = [
  { id: 'all', en: 'All formats', ru: 'Все форматы' },
  { id: 'voucher', en: 'Codes & Cards', ru: 'Коды и карты' },
  { id: 'direct_topup', en: 'Direct Top-Up', ru: 'Пополнение' },
  { id: 'esim', en: 'eSIM', ru: 'eSIM' },
];

export function TgCatalog({
  network,
  wallet,
  readOnly,
  onConnect,
  onLock,
  walletProvider,
}: {
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

  // Filters state with URL parameter initialization
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [region, setRegion] = useState('all');
  const [kind, setKind] = useState('all');
  const [shown, setShown] = useState(24);

  // Selection states
  const [selectedFamily, setSelectedFamily] = useState<{ family: ProductFamily; initialProductId?: string } | null>(null);
  const [selectedDirectProduct, setSelectedDirectProduct] = useState<CatalogProduct | null>(null);

  // Read URL query parameters on mount (e.g. from Telegram Bot deep links)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get('category');
      const reg = params.get('region');
      const k = params.get('kind');
      const q = params.get('q');
      if (cat && CATEGORIES.some(c => c.id === cat)) setCategory(cat);
      if (reg) setRegion(reg);
      if (k && FORMATS.some(f => f.id === k)) setKind(k);
      if (q) setSearch(q);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(false);
    refreshPublicCatalog()
      .then(data => {
        if (live) setProducts(unpackBrowse(data).products);
      })
      .catch(() => {
        if (live) setError(true);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [attempt]);

  // Group catalog products into structured families
  const families = useMemo(() => groupCatalog(products, false), [products]);

  // Extract all unique regions available in the catalog
  const allRegions = useMemo(() => {
    const set = new Set<string>();
    for (const f of families) {
      for (const r of f.regions) {
        if (r && r !== 'UNSPECIFIED') set.add(r);
      }
    }
    return Array.from(set).sort((a, b) => regionLabel(a, ru).localeCompare(regionLabel(b, ru)));
  }, [families, ru]);

  // Filtered families based on category, region, format, and search
  const filteredFamilies = useMemo(() => {
    const q = search.trim().toLowerCase();
    return families.filter(f => {
      // Category match
      if (category !== 'all' && f.category !== category) return false;

      // Format match
      if (kind !== 'all' && f.type !== kind) return false;

      // Region match
      if (region !== 'all') {
        const matchesRegion = f.regions.some(r => {
          if (r === region) return true;
          if (region === 'GLOB' && (r === 'GLOBAL' || r === 'GL' || r === 'GLOB')) return true;
          return false;
        });
        if (!matchesRegion) return false;
      }

      // Search match
      if (q) {
        const matchesSearch =
          f.name.toLowerCase().includes(q) ||
          f.brand.toLowerCase().includes(q) ||
          f.searchText.includes(q) ||
          f.regions.some(r => regionLabel(r, ru).toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [families, category, region, kind, search, ru]);

  const handleOpenFamily = (family: ProductFamily) => {
    // If the family only has 1 product, open CatalogItemDialog directly
    const relevantProducts = familyProducts(family, region);
    if (relevantProducts.length === 1) {
      setSelectedDirectProduct(relevantProducts[0]);
      return;
    }

    // Otherwise open the multi-region selector dialog
    const initialId = region === 'all' ? undefined : relevantProducts[0]?.id;
    setSelectedFamily({ family, initialProductId: initialId });
  };

  const resetFilters = () => {
    setSearch('');
    setCategory('all');
    setRegion('all');
    setKind('all');
    setShown(24);
  };

  const hasActiveFilters = category !== 'all' || region !== 'all' || kind !== 'all' || Boolean(search);

  return (
    <section className="tg-live-catalog" id="tg-products" aria-label={`${network} catalogue`}>
      {/* Search Input */}
      <label className="tg-search">
        <Search size={18} aria-hidden="true" />
        <input
          aria-label={t('Search products', 'Поиск товаров')}
          value={search}
          onChange={event => {
            setSearch(event.target.value);
            setShown(24);
          }}
          placeholder={t('Search games, subscriptions, tools…', 'Игры, подписки, пополнения…')}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            style={{ background: 'none', border: 0, color: 'var(--tg-muted)', cursor: 'pointer', padding: 0 }}
          >
            <X size={16} />
          </button>
        )}
      </label>

      {/* Category Tabs */}
      <div className="tg-category-tabs" aria-label="Product categories">
        {CATEGORIES.map(cat => (
          <button
            type="button"
            key={cat.id}
            aria-pressed={category === cat.id}
            onClick={() => {
              setCategory(cat.id);
              setShown(24);
            }}
          >
            {ru ? cat.ru : `${cat.icon} ${cat.en}`}
          </button>
        ))}
      </div>

      {/* Region & Format Filters */}
      <div className="tg-filter-bar">
        {/* Quick Region Pills */}
        <div className="tg-filter-row" aria-label="Popular regions">
          {POPULAR_REGIONS.map(reg => (
            <button
              type="button"
              key={reg.code}
              className="tg-pill"
              aria-pressed={region === reg.code}
              onClick={() => {
                setRegion(reg.code);
                setShown(24);
              }}
            >
              {reg.flag} {ru ? reg.ru : reg.en}
            </button>
          ))}
        </div>

        {/* Detailed Region Dropdown & Format Selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div className="tg-region-select">
            <Globe size={15} style={{ color: 'var(--tg-muted)', flexShrink: 0 }} />
            <select
              aria-label={t('Filter by region', 'Выбрать регион')}
              value={region}
              onChange={e => {
                setRegion(e.target.value);
                setShown(24);
              }}
            >
              <option value="all">{ru ? '🌍 Все регионы' : '🌍 All regions'}</option>
              {allRegions.map(r => (
                <option key={r} value={r}>
                  {regionLabel(r, ru)}
                </option>
              ))}
            </select>
          </div>

          <div className="tg-region-select">
            <SlidersHorizontal size={15} style={{ color: 'var(--tg-muted)', flexShrink: 0 }} />
            <select
              aria-label={t('Filter by format', 'Формат товара')}
              value={kind}
              onChange={e => {
                setKind(e.target.value);
                setShown(24);
              }}
            >
              {FORMATS.map(f => (
                <option key={f.id} value={f.id}>
                  {ru ? f.ru : f.en}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="tg-active-tags">
          <span style={{ color: 'var(--tg-muted)', fontSize: '11px' }}>{ru ? 'Фильтры:' : 'Filters:'}</span>
          {category !== 'all' && (
            <span className="tg-active-tag">
              {CATEGORIES.find(c => c.id === category)?.[ru ? 'ru' : 'en']}
              <button type="button" onClick={() => setCategory('all')}>
                <X size={12} />
              </button>
            </span>
          )}
          {region !== 'all' && (
            <span className="tg-active-tag">
              {regionLabel(region, ru)}
              <button type="button" onClick={() => setRegion('all')}>
                <X size={12} />
              </button>
            </span>
          )}
          {kind !== 'all' && (
            <span className="tg-active-tag">
              {FORMATS.find(f => f.id === kind)?.[ru ? 'ru' : 'en']}
              <button type="button" onClick={() => setKind('all')}>
                <X size={12} />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={resetFilters}
            style={{
              background: 'none',
              border: 0,
              color: 'var(--tg-muted)',
              fontSize: '11px',
              textDecoration: 'underline',
              cursor: 'pointer',
              marginLeft: '4px',
            }}
          >
            {ru ? 'Сбросить' : 'Clear'}
          </button>
        </div>
      )}

      {/* Network notice */}
      <p className="tg-network-note">
        {network === 'mainnet'
          ? t(
              'Arc Mainnet · Real USDC. Review a signed quote before authorizing payment.',
              'Arc Mainnet · Реальные USDC. Проверьте котировку перед подтверждением оплаты.'
            )
          : t(
              'Arc Testnet · Test USDC. Test deliveries cannot be redeemed.',
              'Arc Testnet · Тестовые USDC. Тестовые коды нельзя активировать.'
            )}
      </p>

      {/* Loading & Error States */}
      {loading ? (
        <p className="tg-state" role="status">
          {t('Loading current products…', 'Загружаем товары…')}
        </p>
      ) : error ? (
        <div className="tg-state" role="alert">
          <h2>{t('Catalogue unavailable', 'Каталог недоступен')}</h2>
          <p>
            {t(
              'Prices and stock could not be verified. No sample inventory is substituted.',
              'Не удалось проверить цены и наличие. Примерные товары не подставляются.'
            )}
          </p>
          <button className="tg-action" onClick={() => setAttempt(value => value + 1)}>
            {t('Retry catalogue', 'Повторить загрузку')}
          </button>
        </div>
      ) : filteredFamilies.length ? (
        <>
          <div className="tg-product-grid">
            {filteredFamilies.slice(0, shown).map(family => {
              const price = familyPrice(family, region);
              const availableInRegion = familyProducts(family, region);
              const regionsList = family.regions.filter(r => r && r !== 'UNSPECIFIED');

              return (
                <button
                  type="button"
                  className="tg-product"
                  key={family.key}
                  onClick={() => handleOpenFamily(family)}
                >
                  <ProductImage
                    name={family.name}
                    category={family.category}
                    imageUrl={family.products[0]?.imageUrl}
                    className="tg-product-image"
                  />
                  <div className="tg-product-copy">
                    {/* Supported regions badges */}
                    <div className="tg-family-regions">
                      {regionsList.slice(0, 3).map(r => (
                        <span key={r} className={`tg-region-tag ${region === r ? 'highlight' : ''}`}>
                          {r}
                        </span>
                      ))}
                      {regionsList.length > 3 && (
                        <span className="tg-region-tag">+{regionsList.length - 3}</span>
                      )}
                    </div>

                    <h2>{family.name}</h2>

                    <p>
                      {t('From', 'От')}{' '}
                      <strong>
                        {price !== null ? price.toFixed(2) : family.products[0]?.minPrice.toFixed(2)}{' '}
                        {family.currency}
                      </strong>
                    </p>

                    <span className="tg-product-details">
                      {family.regions.length > 1
                        ? t(`Choose region (${family.regions.length})`, `Выбрать регион (${family.regions.length})`)
                        : t('Choose an option', 'Выбрать вариант')}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Pagination / Load more */}
          {shown < filteredFamilies.length && (
            <div className="tg-load-more">
              <span>
                {ru ? 'Показано' : 'Showing'} {Math.min(shown, filteredFamilies.length)} / {filteredFamilies.length}
              </span>
              <button
                type="button"
                onClick={() => setShown(n => n + 24)}
              >
                {ru
                  ? `Показать ещё ${Math.min(24, filteredFamilies.length - shown)}`
                  : `Show ${Math.min(24, filteredFamilies.length - shown)} more`}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="tg-state">
          <ShoppingBag size={28} />
          <h2>{t('No matching products', 'Ничего не найдено')}</h2>
          <p>{t('Try another search, category or region.', 'Измените запрос, категорию или регион.')}</p>
          <button className="tg-action" onClick={resetFilters}>
            {t('Reset filters', 'Сбросить фильтры')}
          </button>
        </div>
      )}

      {/* Multi-Region Family Dialog */}
      {selectedFamily && (
        <CatalogFamilyDialog
          key={selectedFamily.family.key}
          family={selectedFamily.family}
          initialProductId={selectedFamily.initialProductId}
          lang={lang}
          wallet={wallet}
          readOnly={readOnly}
          isMainnet={network === 'mainnet'}
          onClose={() => setSelectedFamily(null)}
          onConnect={onConnect}
        />
      )}

      {/* Direct Single-Product Dialog */}
      {selectedDirectProduct && (
        <CatalogItemDialog
          key={`${network}:${wallet}:${selectedDirectProduct.id}`}
          product={selectedDirectProduct}
          lang={lang}
          wallet={wallet}
          readOnly={readOnly}
          isMainnet={network === 'mainnet'}
          walletProvider={walletProvider}
          onLockChange={onLock}
          onClose={() => setSelectedDirectProduct(null)}
          onConnect={onConnect}
        />
      )}
    </section>
  );
}
