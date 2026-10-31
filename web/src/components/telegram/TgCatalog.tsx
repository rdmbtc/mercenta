'use client';

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
      <input aria-label="Search products" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search games, subscriptions, tools…" />
    </label>
    <div className="tg-category-tabs" aria-label="Product categories">
      {categories.map(([id, label]) => <button type="button" key={id} aria-pressed={category === id} onClick={() => setCategory(id)}>{label}</button>)}
    </div>
    <p className="tg-network-note">{network === 'mainnet'
      ? 'Arc Mainnet · Real USDC. Review a signed quote before authorizing payment.'
      : 'Arc Testnet · Test USDC. Test deliveries cannot be redeemed.'}</p>
    {loading ? <p className="tg-state" role="status">Loading current products…</p>
      : error ? <div className="tg-state" role="alert"><h2>Catalogue unavailable</h2><p>Prices and stock could not be verified. No sample inventory is substituted.</p><button className="tg-action" onClick={() => setAttempt(value => value + 1)}>Retry catalogue</button></div>
        : filtered.length ? <div className="tg-product-grid">{filtered.slice(0, 60).map(product => <button className="tg-product" key={product.id} onClick={() => setSelected(product)}>
          <ProductImage name={product.name} category={product.category} imageUrl={product.imageUrl} className="tg-product-image" />
          <div className="tg-product-copy"><span>{product.countryCode || 'Region in details'}</span><h2>{product.name}</h2><p>From <strong>{product.minPrice.toFixed(2)} {product.currency}</strong></p><span className="tg-product-details">Choose an option</span></div>
        </button>)}</div>
          : <div className="tg-state"><ShoppingBag size={28} /><h2>No matching products</h2><p>Try another search or category.</p><button className="tg-action" onClick={() => { setSearch(''); setCategory('all'); }}>Reset filters</button></div>}
    {filtered.length > 60 && <p className="tg-network-note">Showing the first 60 matches. Refine your search to find a specific product.</p>}
    {selected && <CatalogItemDialog key={`${network}:${wallet}:${selected.id}`} product={selected} lang="en" wallet={wallet} readOnly={readOnly} isMainnet={network === 'mainnet'} walletProvider={walletProvider} onLockChange={onLock} onClose={() => setSelected(null)} onConnect={onConnect} />}
  </section>;
}
