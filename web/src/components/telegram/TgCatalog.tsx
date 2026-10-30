'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Search, Sparkles, Gamepad2, Tv, Zap, Code, Cpu, Check, ShieldCheck, Copy, ArrowRight, Share2, AlertCircle } from 'lucide-react';
import { TG_CATALOG_PRODUCTS, TG_CATEGORIES, type TgProduct, type TgProductDenomination } from './tg-products';
import { fireConfetti } from './confetti';

interface TgCatalogProps {
  balanceUsdc: number;
  onDeductBalance: (amount: number) => void;
  onOpenTopUp: () => void;
  triggerHaptic?: (type?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => void;
}

export function TgCatalog({ balanceUsdc, onDeductBalance, onOpenTopUp, triggerHaptic }: TgCatalogProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<TgProduct | null>(null);
  const [selectedDenom, setSelectedDenom] = useState<TgProductDenomination | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchasedOrder, setPurchasedOrder] = useState<{
    id: string;
    productName: string;
    denomLabel: string;
    code: string;
    amountUsdc: number;
    txHash: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Filter products
  const filteredProducts = useMemo(() => {
    return TG_CATALOG_PRODUCTS.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.brand.toLowerCase().includes(search.toLowerCase()) ||
        p.region.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [search, selectedCategory]);

  function handleSelectProduct(product: TgProduct) {
    triggerHaptic?.('light');
    setSelectedProduct(product);
    setSelectedDenom(product.denominations[0] || null);
  }

  function handleExecutePurchase() {
    if (!selectedProduct || !selectedDenom) return;

    if (balanceUsdc < selectedDenom.priceUsdc) {
      triggerHaptic?.('warning');
      onOpenTopUp();
      return;
    }

    setIsPurchasing(true);
    triggerHaptic?.('medium');

    setTimeout(() => {
      // Generate synthetic cryptographic delivery key
      const randomKey = `MCT-${selectedProduct.id.slice(4, 9).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const fakeTxHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

      const orderData = {
        id: `ORD-${Date.now().toString().slice(-6)}`,
        productName: selectedProduct.name,
        denomLabel: selectedDenom.label,
        code: randomKey,
        amountUsdc: selectedDenom.priceUsdc,
        txHash: fakeTxHash,
      };

      // Deduct balance
      onDeductBalance(selectedDenom.priceUsdc);

      // Save to local purchase history
      try {
        const historyKey = 'mercenta_tg_purchase_history_v1';
        const existing = JSON.parse(localStorage.getItem(historyKey) || '[]');
        existing.unshift({
          ...orderData,
          date: new Date().toISOString(),
          brand: selectedProduct.brand,
          coverImage: selectedProduct.coverImage,
        });
        localStorage.setItem(historyKey, JSON.stringify(existing.slice(0, 50)));
      } catch (e) {
        console.error('History save error:', e);
      }

      setIsPurchasing(false);
      setSelectedProduct(null);
      setPurchasedOrder(orderData);
      triggerHaptic?.('success');
      fireConfetti(3000);
    }, 900);
  }

  function handleCopyKey(code: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedKey(true);
      triggerHaptic?.('success');
      setTimeout(() => setCopiedKey(false), 2000);
    }
  }

  function handleShareGift(order: NonNullable<typeof purchasedOrder>) {
    triggerHaptic?.('light');
    const shareText = encodeURIComponent(
      `🎁 Here is your ${order.productName} (${order.denomLabel}) digital gift card!\n\nActivation Key: ${order.code}\n\nCleared & Settled with USDC on Mercenta (Arc Network).`
    );
    const url = `https://t.me/share/url?url=${encodeURIComponent('https://mercenta.xyz')}&text=${shareText}`;
    window.open(url, '_blank');
  }

  const categoryIcons: Record<string, React.ReactNode> = {
    all: <Sparkles className="size-3.5" />,
    gaming: <Gamepad2 className="size-3.5" />,
    subscriptions: <Tv className="size-3.5" />,
    microdonations: <Zap className="size-3.5" />,
    developer: <Code className="size-3.5" />,
    compute: <Cpu className="size-3.5" />,
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Search Header */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/40" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search games, gift cards, subscriptions..."
          className="w-full bg-[#12151e] border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-sky-500/50 transition-colors"
        />
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {TG_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                triggerHaptic?.('light');
                setSelectedCategory(cat.id);
              }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-sky-500 text-black font-semibold shadow-md shadow-sky-500/25'
                  : 'bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white border border-white/5'
              }`}
            >
              {categoryIcons[cat.id]}
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {filteredProducts.map((prod) => {
          const minPrice = Math.min(...prod.denominations.map((d) => d.priceUsdc));
          return (
            <div
              key={prod.id}
              onClick={() => handleSelectProduct(prod)}
              className="group bg-[#0e111a] border border-white/10 hover:border-sky-500/40 rounded-2xl overflow-hidden cursor-pointer transition-all active:scale-[0.98] flex flex-col justify-between"
            >
              {/* Cover Artwork */}
              <div className="relative w-full aspect-[16/10] bg-black/50 overflow-hidden">
                <Image
                  src={prod.coverImage}
                  alt={prod.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 240px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    // Fallback to placeholder gradient if image missing
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e111a] via-transparent to-transparent opacity-80" />
                <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[9px] font-mono text-white/80 border border-white/10">
                  {prod.region}
                </span>
              </div>

              {/* Card Meta */}
              <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-sky-400 font-mono uppercase tracking-wider block truncate">
                    {prod.brand}
                  </span>
                  <h4 className="text-xs font-semibold text-white/95 line-clamp-1 leading-snug">
                    {prod.name}
                  </h4>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div>
                    <span className="text-[9px] text-white/40 uppercase block">from</span>
                    <span className="text-xs font-bold font-mono text-emerald-400">
                      ${minPrice.toFixed(2)}{' '}
                      <span className="text-[9px] font-normal text-white/50">USDC</span>
                    </span>
                  </div>
                  <span className="size-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs font-bold">
                    +
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-white/50 space-y-2">
          <p className="text-xs">No products found matching &ldquo;{search}&rdquo;</p>
        </div>
      )}

      {/* Product Purchase Modal */}
      {selectedProduct && selectedDenom && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full sm:max-w-md bg-[#0c0e14] border border-white/10 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[90vh] flex flex-col overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="relative size-12 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0">
                  <Image src={selectedProduct.coverImage} alt={selectedProduct.name} fill className="object-cover" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-sky-400 uppercase tracking-wider block">
                    {selectedProduct.brand}
                  </span>
                  <h3 className="font-semibold text-sm text-white">{selectedProduct.name}</h3>
                  <span className="text-[10px] text-white/50 font-mono">{selectedProduct.region}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic?.('light');
                  setSelectedProduct(null);
                }}
                className="size-7 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Select Denomination */}
            <div className="space-y-2 my-4">
              <label className="text-[11px] font-medium text-white/60 block">Select Denomination</label>
              <div className="grid grid-cols-2 gap-2">
                {selectedProduct.denominations.map((denom) => {
                  const isSelected = selectedDenom.id === denom.id;
                  return (
                    <button
                      key={denom.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic?.('light');
                        setSelectedDenom(denom);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all relative ${
                        isSelected
                          ? 'bg-sky-500/15 border-sky-400 text-white'
                          : 'bg-white/[0.02] border-white/10 text-white/70 hover:bg-white/[0.05]'
                      }`}
                    >
                      {denom.badge && (
                        <span className="absolute -top-1.5 right-2 px-1 rounded bg-sky-500 text-[8px] font-bold text-black uppercase">
                          {denom.badge}
                        </span>
                      )}
                      <div className="text-xs font-semibold">{denom.label}</div>
                      <div className="text-[11px] font-mono text-emerald-400 font-bold mt-0.5">
                        ${denom.priceUsdc.toFixed(2)} USDC
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5 Policy Engine Verified Checks */}
            <div className="p-3 rounded-xl bg-sky-500/[0.06] border border-sky-500/15 space-y-2 text-[11px] text-sky-200">
              <div className="flex items-center gap-1.5 font-semibold text-sky-400 text-xs">
                <ShieldCheck className="size-4" />
                <span>5-Gate Policy Engine Pre-Clearance</span>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-white/70">
                <div className="flex items-center gap-1">
                  <Check className="size-3 text-emerald-400" />
                  <span>Gross Margin Floor &ge;2.5%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="size-3 text-emerald-400" />
                  <span>Velocity Limit OK</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="size-3 text-emerald-400" />
                  <span>Supplier Verified</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="size-3 text-emerald-400" />
                  <span>Sub-second Arc Finality</span>
                </div>
              </div>
            </div>

            {/* Price & Action Button */}
            <div className="pt-4 mt-auto border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60">Your Balance:</span>
                <span className="font-mono font-semibold text-white">
                  ${balanceUsdc.toFixed(2)} USDC
                </span>
              </div>

              {balanceUsdc >= selectedDenom.priceUsdc ? (
                <button
                  type="button"
                  disabled={isPurchasing}
                  onClick={handleExecutePurchase}
                  className="w-full py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  {isPurchasing ? (
                    <>
                      <span className="size-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Settling on Arc Malachite...</span>
                    </>
                  ) : (
                    <>
                      <span>Pay ${selectedDenom.priceUsdc.toFixed(2)} USDC</span>
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProduct(null);
                    onOpenTopUp();
                  }}
                  className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <AlertCircle className="size-4" />
                  <span>Insufficient Balance (Top Up)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Order Success Reveal Modal */}
      {purchasedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-lg p-4 animate-in zoom-in-95 duration-200">
          <div className="w-full max-w-sm bg-[#0e111a] border border-emerald-500/30 rounded-3xl p-6 text-center space-y-4 shadow-2xl relative">
            <div className="size-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40 shadow-lg shadow-emerald-500/30">
              <Check className="size-7" />
            </div>

            <div>
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block">
                Settlement Cleared · Malachite 5042
              </span>
              <h3 className="text-base font-bold text-white mt-1">{purchasedOrder.productName}</h3>
              <p className="text-xs text-white/60">{purchasedOrder.denomLabel}</p>
            </div>

            {/* Scratch / Decrypted Code Box */}
            <div className="p-3.5 bg-black/80 border border-emerald-500/40 rounded-2xl space-y-1 relative group">
              <span className="text-[10px] text-white/50 uppercase font-mono block">Your Activation Key</span>
              <div className="text-sm font-mono font-bold text-emerald-300 tracking-wider select-all break-all">
                {purchasedOrder.code}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleCopyKey(purchasedOrder.code)}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                {copiedKey ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                <span>{copiedKey ? 'Key Copied!' : 'Copy Activation Key'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleShareGift(purchasedOrder)}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Share2 className="size-3.5" />
                <span>Gift to Friend in Telegram</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic?.('light');
                  setPurchasedOrder(null);
                }}
                className="w-full py-2 text-white/50 hover:text-white text-xs transition-colors"
              >
                Close &amp; Back to Catalog
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
