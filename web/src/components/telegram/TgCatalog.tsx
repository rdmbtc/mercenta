'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Search,
  Check,
  Copy,
  ShieldCheck,
  Share2,
  Sparkles,
  Gamepad2,
  Tv,
  Zap,
  Code,
  Cpu,
  ArrowRight,
  AlertCircle,
  X,
} from 'lucide-react';
import { TG_CATALOG_PRODUCTS, TG_CATEGORIES, type TgProduct, type TgProductDenomination } from './tg-products';
import { fireConfetti } from './confetti';

interface TgCatalogProps {
  balanceUsdc: number;
  onDeductBalance: (amount: number) => boolean;
  onOpenTopUp: () => void;
  triggerHaptic?: (type?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => void;
}

export function TgCatalog({
  balanceUsdc,
  onDeductBalance,
  onOpenTopUp,
  triggerHaptic,
}: TgCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<TgProduct | null>(null);
  const [selectedDenom, setSelectedDenom] = useState<TgProductDenomination | null>(null);
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);
  const [purchasedOrder, setPurchasedOrder] = useState<{
    id: string;
    productName: string;
    denomLabel: string;
    amountUsdc: number;
    code: string;
    txHash: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  // Filter products
  const filteredProducts = TG_CATALOG_PRODUCTS.filter((prod) => {
    const matchesCategory = selectedCategory === 'all' || prod.category === selectedCategory;
    const matchesSearch =
      search.trim() === '' ||
      prod.name.toLowerCase().includes(search.toLowerCase()) ||
      prod.brand.toLowerCase().includes(search.toLowerCase()) ||
      prod.region.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  function handleSelectProduct(prod: TgProduct) {
    triggerHaptic?.('light');
    setSelectedProduct(prod);
    setSelectedDenom(prod.denominations[0] || null);
  }

  function handleExecutePurchase() {
    if (!selectedProduct || !selectedDenom) return;

    if (balanceUsdc < selectedDenom.priceUsdc) {
      triggerHaptic?.('error');
      return;
    }

    triggerHaptic?.('medium');
    setIsPurchasing(true);

    // Simulate instant sub-second Arc consensus settlement
    setTimeout(() => {
      const success = onDeductBalance(selectedDenom.priceUsdc);
      if (!success) {
        setIsPurchasing(false);
        triggerHaptic?.('error');
        return;
      }

      // Generate realistic cryptographic redemption key
      const fakeCode = `${selectedProduct.brand.substring(0, 4).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const fakeTxHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

      const orderData = {
        id: `MCT-${Date.now().toString().slice(-6)}`,
        productName: selectedProduct.name,
        denomLabel: selectedDenom.label,
        amountUsdc: selectedDenom.priceUsdc,
        code: fakeCode,
        txHash: fakeTxHash,
        date: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      // Save order to history
      try {
        const historyKey = 'mercenta_orders_active_user';
        const existing = JSON.parse(localStorage.getItem(historyKey) || '[]');
        existing.unshift(orderData);
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
    <div className="space-y-4 pb-24">
      {/* Search Header */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search games, gift cards, subscriptions..."
          className="w-full bg-[#131828] border border-slate-700/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-400 transition-colors shadow-md shadow-black/30"
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
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/25'
                  : 'bg-[#131828] text-slate-200 hover:text-white border border-slate-700/70'
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
              className="group bg-[#121626] border border-slate-700/80 hover:border-sky-400/80 rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 active:scale-[0.98] shadow-lg shadow-black/40 flex flex-col justify-between"
            >
              {/* Cover Artwork */}
              <div className="relative w-full aspect-[16/10] bg-black/60 overflow-hidden">
                <Image
                  src={prod.coverImage}
                  alt={prod.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 240px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121626] via-transparent to-transparent opacity-80" />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#0a0d16]/90 backdrop-blur-md text-[10px] font-mono text-white font-bold border border-slate-600 shadow-sm">
                  {prod.region}
                </span>
              </div>

              {/* Card Meta */}
              <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-mono text-sky-300 font-bold uppercase tracking-wider block truncate">
                    {prod.brand}
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1 leading-snug">
                    {prod.name}
                  </h4>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
                  <div>
                    <span className="text-[10px] text-slate-300 uppercase font-semibold block">from</span>
                    <span className="text-xs sm:text-sm font-mono font-extrabold text-emerald-400">
                      ${minPrice.toFixed(2)}{' '}
                      <span className="text-[10px] text-slate-300 font-medium">USDC</span>
                    </span>
                  </div>
                  <span className="size-7 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 group-hover:bg-sky-500 group-hover:text-black flex items-center justify-center text-xs font-extrabold transition-colors shadow-sm shadow-sky-500/20">
                    +
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-slate-300 space-y-2">
          <p className="text-xs font-semibold">No products found matching &ldquo;{search}&rdquo;</p>
        </div>
      )}

      {/* Product Purchase Modal */}
      {selectedProduct && selectedDenom && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full sm:max-w-md bg-[#121626] border border-slate-700 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[90vh] flex flex-col overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-700/60">
              <div className="flex items-center gap-3">
                <div className="relative size-12 rounded-xl overflow-hidden bg-black/50 border border-slate-700 shrink-0">
                  <Image src={selectedProduct.coverImage} alt={selectedProduct.name} fill className="object-cover" />
                </div>
                <div>
                  <span className="text-[11px] font-mono text-sky-300 font-bold uppercase tracking-wider block">
                    {selectedProduct.brand}
                  </span>
                  <h3 className="font-bold text-sm text-white">{selectedProduct.name}</h3>
                  <span className="text-[10px] text-slate-300 font-mono font-semibold">{selectedProduct.region}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic?.('light');
                  setSelectedProduct(null);
                }}
                className="size-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors border border-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Select Denomination */}
            <div className="space-y-2 my-4">
              <label className="text-xs font-bold text-white block">Select Denomination</label>
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
                      className={`p-3 rounded-xl border text-left transition-all relative ${
                        isSelected
                          ? 'bg-emerald-500/15 border-2 border-emerald-400 text-white font-bold shadow-md shadow-emerald-500/20'
                          : 'bg-[#0a0d16] border-slate-700 text-slate-200 hover:border-slate-600 font-medium'
                      }`}
                    >
                      {denom.badge && (
                        <span className="absolute -top-1.5 right-2 px-1.5 py-0.2 rounded bg-sky-500 text-[9px] font-extrabold text-slate-950 uppercase shadow-sm">
                          {denom.badge}
                        </span>
                      )}
                      <div className="text-xs font-bold text-white">{denom.label}</div>
                      <div className="text-xs font-mono text-emerald-400 font-extrabold mt-0.5">
                        ${denom.priceUsdc.toFixed(2)} USDC
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5 Policy Engine Verified Checks */}
            <div className="p-3 rounded-xl bg-[#0a0d16] border border-sky-500/30 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-sky-300 text-xs">
                <ShieldCheck className="size-4 text-sky-400" />
                <span>5-Gate Policy Engine Pre-Clearance</span>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs text-slate-200 font-medium">
                <div className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-emerald-400 stroke-[3]" />
                  <span>Gross Margin Floor &ge;2.5%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-emerald-400 stroke-[3]" />
                  <span>Velocity Limit OK</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-emerald-400 stroke-[3]" />
                  <span>Supplier Verified</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-emerald-400 stroke-[3]" />
                  <span>Sub-second Arc Finality</span>
                </div>
              </div>
            </div>

            {/* Price & Action Button */}
            <div className="pt-4 mt-auto border-t border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Available Balance:</span>
                <span className="font-mono font-bold text-white">
                  ${balanceUsdc.toFixed(2)} USDC
                </span>
              </div>

              {balanceUsdc >= selectedDenom.priceUsdc ? (
                <button
                  type="button"
                  disabled={isPurchasing}
                  onClick={handleExecutePurchase}
                  className="w-full py-3.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  {isPurchasing ? (
                    <>
                      <span className="size-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Settling on Arc Malachite...</span>
                    </>
                  ) : (
                    <>
                      <span>Pay ${selectedDenom.priceUsdc.toFixed(2)} USDC</span>
                      <ArrowRight className="size-4 stroke-[3]" />
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
                  className="w-full py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 active:scale-[0.99]"
                >
                  <AlertCircle className="size-4 stroke-[3]" />
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
          <div className="w-full max-w-sm bg-[#121626] border-2 border-emerald-500/40 rounded-3xl p-6 text-center space-y-4 shadow-2xl relative">
            <div className="size-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40 shadow-lg shadow-emerald-500/30">
              <Check className="size-7 stroke-[3]" />
            </div>

            <div>
              <span className="text-[10px] font-mono text-emerald-400 font-extrabold uppercase tracking-widest block">
                Settlement Cleared · Malachite 5042
              </span>
              <h3 className="text-base font-bold text-white mt-1">{purchasedOrder.productName}</h3>
              <p className="text-xs text-slate-200 font-medium">{purchasedOrder.denomLabel}</p>
            </div>

            {/* Key Delivery Box */}
            <div className="p-3.5 bg-black/95 border-2 border-emerald-500/60 rounded-2xl space-y-1 relative group">
              <span className="text-[10px] text-slate-300 uppercase font-mono font-bold block">
                Your Activation Key
              </span>
              <div className="text-sm font-mono font-extrabold text-emerald-300 tracking-wider select-all break-all">
                {purchasedOrder.code}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleCopyKey(purchasedOrder.code)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-600"
              >
                {copiedKey ? <Check className="size-3.5 text-emerald-400 stroke-[3]" /> : <Copy className="size-3.5" />}
                <span>{copiedKey ? 'Key Copied!' : 'Copy Activation Key'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleShareGift(purchasedOrder)}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 transition-colors shadow-md shadow-sky-500/25"
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
                className="w-full py-2 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
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
