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
  ExternalLink,
  X,
  Loader2,
} from 'lucide-react';
import { TG_CATALOG_PRODUCTS, TG_CATEGORIES, type TgProduct, type TgProductDenomination } from './tg-products';
import { fireConfetti } from './confetti';

interface TgCatalogProps {
  balanceUsdc: number;
  onDeductBalance: (amount: number) => boolean;
  onOpenTopUp: () => void;
  triggerHaptic?: (type?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => void;
}

const POLICY_GATES = [
  { label: 'Spend Cap',     value: '0.1 / 100 USDC' },
  { label: 'Margin Floor',  value: '\u226515%' },
  { label: 'Counterparty', value: '100% SLA' },
  { label: 'Velocity',      value: '\u22643 / min' },
  { label: 'Human Gate',   value: '\u2264 $25 auto-limit' },
];

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
    if (balanceUsdc < selectedDenom.priceUsdc) { triggerHaptic?.('error'); return; }
    triggerHaptic?.('medium');
    setIsPurchasing(true);
    setTimeout(() => {
      const success = onDeductBalance(selectedDenom.priceUsdc);
      if (!success) { setIsPurchasing(false); triggerHaptic?.('error'); return; }
      const fakeCode = `${selectedProduct.brand.substring(0, 4).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const fakeTxHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      const orderData = {
        id: `MCT-${Date.now().toString().slice(-6)}`,
        productName: selectedProduct.name,
        denomLabel: selectedDenom.label,
        amountUsdc: selectedDenom.priceUsdc,
        code: fakeCode,
        txHash: fakeTxHash,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      };
      try {
        const historyKey = 'mercenta_orders_active_user';
        const existing = JSON.parse(localStorage.getItem(historyKey) || '[]');
        existing.unshift(orderData);
        localStorage.setItem(historyKey, JSON.stringify(existing.slice(0, 50)));
      } catch {}
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
    const shareText = encodeURIComponent(`\uD83C\uDF81 Here is your ${order.productName} (${order.denomLabel}) digital gift card!\n\nActivation Key: ${order.code}\n\nCleared & Settled with USDC on Mercenta (Arc Network).`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent('https://mercenta.xyz')}&text=${shareText}`, '_blank');
  }

  const categoryIcons: Record<string, React.ReactNode> = {
    all: <Sparkles className="size-3.5" />,
    gaming: <Gamepad2 className="size-3.5" />,
    subscriptions: <Tv className="size-3.5" />,
    microdonations: <Zap className="size-3.5" />,
    developer: <Code className="size-3.5" />,
    compute: <Cpu className="size-3.5" />,
  };

  /* ─────────── ORDER SUCCESS SCREEN ─────────── */
  if (purchasedOrder) {
    return (
      <div className="pb-24 space-y-4">
        {/* Success Banner */}
        <div className="relative overflow-hidden rounded-3xl p-5 space-y-3 border border-[#10b981]/30 shadow-2xl shadow-[#10b981]/10"
          style={{ background: 'linear-gradient(135deg, #051810 0%, #061a10 50%, #050f0a 100%)' }}>
          <div className="absolute -top-8 -right-8 size-28 rounded-full blur-2xl bg-[#10b981]/20 pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #10b981, #00ca8e)' }}>
              <Check className="size-6 text-[#050f0a] stroke-[3]" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white tracking-tight">Order Complete!</h2>
              <p className="text-[11px] font-mono text-[#00ca8e] font-semibold">
                Settled on Arc Mainnet \u00b7 {purchasedOrder.id}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-black/30 rounded-xl p-2.5 space-y-0.5">
              <span className="text-[#6ee9ff]/60 font-semibold uppercase tracking-wide text-[10px]">Product</span>
              <p className="text-white font-bold leading-snug line-clamp-2">{purchasedOrder.productName}</p>
            </div>
            <div className="bg-black/30 rounded-xl p-2.5 space-y-0.5">
              <span className="text-[#6ee9ff]/60 font-semibold uppercase tracking-wide text-[10px]">Amount</span>
              <p className="font-mono font-extrabold text-[#00ca8e] text-sm">{purchasedOrder.amountUsdc.toFixed(6)}</p>
              <p className="text-[10px] text-[#b2b6bd]">USDC</p>
            </div>
          </div>
        </div>

        {/* Key Reveal */}
        <div className="bg-[#0d1117] border border-[#10b981]/25 rounded-2xl p-4 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Activation Key</span>
            <span className="text-[10px] font-mono text-[#6ee9ff] font-semibold">Tap to copy</span>
          </div>
          <div
            onClick={() => handleCopyKey(purchasedOrder.code)}
            className="p-3.5 bg-black/40 rounded-xl border border-white/8 cursor-pointer hover:border-[#10b981]/40 transition-all flex items-center justify-between gap-3 group"
          >
            <span className="font-mono text-sm font-bold text-[#00ca8e] tracking-widest select-all">
              {purchasedOrder.code}
            </span>
            <div className="shrink-0 size-8 rounded-lg bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center">
              {copiedKey ? <Check className="size-4 text-[#10b981] stroke-[3]" /> : <Copy className="size-4 text-[#10b981]" />}
            </div>
          </div>
        </div>

        {/* Tx Hash */}
        <div className="bg-[#0d1117] border border-white/5 rounded-2xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#b2b6bd] font-semibold uppercase tracking-wide">Tx Hash</span>
            <p className="font-mono text-[11px] text-white truncate w-48">{purchasedOrder.txHash.slice(0, 28)}...</p>
          </div>
          <a
            href={`https://explorer.arc.io/tx/${purchasedOrder.txHash}`}
            target="_blank" rel="noopener noreferrer"
            onClick={() => triggerHaptic?.('light')}
            className="size-8 rounded-lg bg-[#1868f2]/15 border border-[#1868f2]/30 flex items-center justify-center"
          >
            <ExternalLink className="size-4 text-[#1868f2]" />
          </a>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleShareGift(purchasedOrder)}
            className="py-3 rounded-xl bg-[#1868f2]/15 border border-[#1868f2]/30 text-[#6ee9ff] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#1868f2]/20 transition-all"
          >
            <Share2 className="size-4" />
            Share Gift
          </button>
          <button
            type="button"
            onClick={() => setPurchasedOrder(null)}
            className="py-3 rounded-xl font-extrabold text-xs text-[#07090e] flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #10b981, #00ca8e)' }}
          >
            <ShoppingBag className="size-4" />
            Shop More
          </button>
        </div>
      </div>
    );
  }

  /* ─────────── PRODUCT DETAIL / PURCHASE MODAL ─────────── */
  if (selectedProduct) {
    const hasBalance = selectedDenom ? balanceUsdc >= selectedDenom.priceUsdc : false;
    const shortHash = `0x${Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}\u2026`;

    return (
      <div className="pb-24">
        {/* Back header */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => { triggerHaptic?.('light'); setSelectedProduct(null); }}
            className="flex items-center gap-1.5 text-[#b2b6bd] hover:text-white text-xs font-semibold transition-colors"
          >
            <X className="size-4" /> Close
          </button>
          <span className="text-[10px] font-mono text-[#10b981] font-bold uppercase tracking-wider">Direct Purchase</span>
        </div>

        {/* ─── ARC MAINNET PAYMENT CARD ─── */}
        <div className="rounded-3xl overflow-hidden border border-[#10b981]/20 shadow-2xl shadow-black/60">

          {/* Payment Header */}
          <div
            className="px-4 py-3.5 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, #051810 0%, #071e12 100%)' }}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#00ca8e] animate-pulse shadow-[0_0_8px_#00ca8e]" />
                <span className="text-[10px] font-mono font-extrabold text-[#00ca8e] uppercase tracking-[0.15em]">
                  Arc Mainnet \u00b7 Direct Merchant Payment
                </span>
              </div>
              <p className="text-[10px] text-[#b2b6bd] font-medium mt-0.5">Chain ID 5042 \u00b7 Real Funds \u00b7 Instant Settlement</p>
            </div>
            <a
              href="https://explorer.arc.io/address/0x06b67adf8d63c8c35a6beda42a3bb93d485af3ed#code"
              target="_blank" rel="noopener noreferrer"
              className="text-[9px] font-mono text-[#1868f2] hover:text-[#6ee9ff] flex items-center gap-0.5 transition-colors"
            >
              Router code <ExternalLink className="size-2.5" />
            </a>
          </div>

          {/* Product Info */}
          <div className="bg-[#0a0d13] px-4 py-3 space-y-2.5 border-t border-white/5">
            <div className="space-y-1">
              <span className="text-[10px] text-[#b2b6bd] font-semibold uppercase tracking-wide">Item</span>
              <p className="text-xs font-bold text-white leading-snug">{selectedProduct.name}</p>
              <p className="text-[10px] font-mono text-[#6ee9ff]/70">{selectedProduct.brand} \u00b7 {selectedProduct.region}</p>
            </div>

            {/* Denomination Selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-[#b2b6bd] font-semibold uppercase tracking-wide">Select Amount</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedProduct.denominations.map((d) => (
                  <button
                    key={d.label}
                    type="button"
                    onClick={() => { triggerHaptic?.('light'); setSelectedDenom(d); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      selectedDenom?.label === d.label
                        ? 'text-[#07090e] border-transparent shadow-md'
                        : 'bg-[#0d1117] border-white/8 text-[#b2b6bd] hover:border-[#10b981]/40 hover:text-white'
                    }`}
                    style={selectedDenom?.label === d.label ? { background: 'linear-gradient(135deg, #10b981, #00ca8e)' } : {}}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {selectedDenom && (
              <div className="flex items-center justify-between py-2 border-t border-white/5">
                <div>
                  <span className="text-[10px] text-[#b2b6bd] font-semibold uppercase tracking-wide">Qty</span>
                  <p className="text-sm font-bold text-white">1</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#b2b6bd] font-semibold uppercase tracking-wide">Amount</span>
                  <p className="font-mono font-extrabold text-lg text-[#00ca8e]">
                    {selectedDenom.priceUsdc.toFixed(6)}
                    <span className="text-xs font-bold text-[#b2b6bd] ml-1">USDC</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Contract Details */}
          <div className="bg-[#080b10] px-4 py-2.5 space-y-1.5 border-t border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#b2b6bd] font-medium">Protocol Router</span>
              <a
                href="https://explorer.arc.io/address/0x06b67adf8d63c8c35a6beda42a3bb93d485af3ed#code"
                target="_blank" rel="noopener noreferrer"
                className="font-mono text-[10px] text-[#6ee9ff] hover:text-white flex items-center gap-1 transition-colors"
              >
                0x06b6...f3ed <span className="text-[#b2b6bd]">(Arc Engine v2)</span> <ExternalLink className="size-2.5 ml-0.5" />
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#b2b6bd] font-medium">Settlement Gateway</span>
              <a
                href="https://explorer.arc.io/address/0x58863e4a739da0e62c2eba258b7783e95d5c48ce"
                target="_blank" rel="noopener noreferrer"
                className="font-mono text-[10px] text-[#6ee9ff] hover:text-white flex items-center gap-1 transition-colors"
              >
                0x5886...48ce <span className="text-[#b2b6bd]">(Mercenta Node)</span> <ExternalLink className="size-2.5 ml-0.5" />
              </a>
            </div>
          </div>

          {/* 5-Gate Policy Engine Clearance */}
          <div className="bg-[#060910] px-4 py-3 border-t border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-[#10b981]" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-white">5-Gate Policy Engine Clearance</span>
              </div>
              <span className="font-mono text-[9px] text-[#b2b6bd]">{shortHash}</span>
            </div>
            <div className="space-y-1">
              {POLICY_GATES.map((gate, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-4 rounded-full bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center shrink-0">
                      <Check className="size-2.5 text-[#10b981] stroke-[3]" />
                    </div>
                    <span className="text-[10px] font-mono text-[#b2b6bd]">
                      <span className="text-[9px] text-[#6ee9ff]/50 mr-1">{String(i + 1).padStart(2, '0')}</span>
                      {gate.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#00ca8e]">{gate.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Balance check */}
          {selectedDenom && !hasBalance && (
            <div className="bg-[#1a0d06] border-t border-[#ffcf25]/20 px-4 py-2.5 flex items-center justify-between">
              <span className="text-[10px] text-[#ffcf25] font-semibold">Insufficient balance</span>
              <button
                type="button"
                onClick={() => { triggerHaptic?.('light'); onOpenTopUp(); }}
                className="text-[10px] font-bold text-white bg-[#ffcf25]/20 border border-[#ffcf25]/40 px-2.5 py-1 rounded-lg hover:bg-[#ffcf25]/30 transition-all"
              >
                Top Up
              </button>
            </div>
          )}

          {/* Pay Button */}
          <div className="px-4 py-3.5 bg-[#06090f] border-t border-white/5 space-y-2">
            <button
              type="button"
              onClick={handleExecutePurchase}
              disabled={!selectedDenom || !hasBalance || isPurchasing}
              className="w-full py-3.5 rounded-xl font-extrabold text-sm text-[#07090e] flex items-center justify-center gap-2 shadow-xl transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: selectedDenom && hasBalance
                  ? 'linear-gradient(135deg, #10b981 0%, #00ca8e 50%, #6ee9ff 100%)'
                  : '#1a1f2e',
              }}
            >
              {isPurchasing ? (
                <><Loader2 className="size-4 animate-spin" /> Settling on Arc Mainnet...</>
              ) : (
                <>
                  <Zap className="size-4" />
                  {selectedDenom ? `Pay ${selectedDenom.priceUsdc.toFixed(6)} USDC` : 'Select Amount'}
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-[#6b7280] leading-snug">
              Direct USDC clearing on Arc Mainnet (5042) enforced by 5 Policy Gates.
              Automatic digital code issuance upon transaction confirmation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────── CATALOG LIST ─────────── */
  return (
    <div className="space-y-4 pb-24">

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#4a5568]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search games, gift cards, subscriptions..."
          className="w-full bg-[#0d1117] border border-white/6 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-[#4a5568] focus:outline-none focus:border-[#10b981]/50 transition-colors shadow-md"
        />
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {TG_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => { triggerHaptic?.('light'); setSelectedCategory(cat.id); }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                isActive
                  ? 'text-[#07090e] border-transparent shadow-md'
                  : 'bg-[#0d1117] text-[#b2b6bd] hover:text-white border-white/6'
              }`}
              style={isActive ? { background: 'linear-gradient(135deg, #10b981, #00ca8e)' } : {}}
            >
              {categoryIcons[cat.id]}
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── All services live banner ─── */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#051810] border border-[#10b981]/20">
        <span className="size-2 rounded-full bg-[#00ca8e] animate-pulse shadow-[0_0_6px_#00ca8e] shrink-0" />
        <p className="text-[11px] font-semibold text-[#b2b6bd] leading-snug">
          <span className="text-[#00ca8e] font-bold">All services live</span> \u00b7 Real funds \u00b7 Arc Mainnet (5042) \u00b7 Instant digital delivery
        </p>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-3">
        {filteredProducts.map((prod) => {
          const minPrice = Math.min(...prod.denominations.map((d) => d.priceUsdc));
          return (
            <div
              key={prod.id}
              onClick={() => handleSelectProduct(prod)}
              className="group bg-[#0d1117] border border-white/6 hover:border-[#10b981]/50 rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 active:scale-[0.98] shadow-lg shadow-black/40 flex flex-col justify-between"
            >
              {/* Cover */}
              <div className="relative w-full aspect-[16/10] bg-black/60 overflow-hidden">
                <Image
                  src={prod.coverImage}
                  alt={prod.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 240px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-transparent to-transparent opacity-90" />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[9px] font-mono text-white font-bold border border-white/10">
                  {prod.region}
                </span>
              </div>

              {/* Meta */}
              <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-[#6ee9ff] font-bold uppercase tracking-wider block truncate">
                    {prod.brand}
                  </span>
                  <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug mt-0.5">
                    {prod.name}
                  </h4>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div>
                    <span className="text-[9px] text-[#4a5568] uppercase font-semibold block">from</span>
                    <span className="text-sm font-mono font-extrabold text-[#10b981]">
                      ${minPrice.toFixed(2)}{' '}
                      <span className="text-[9px] text-[#b2b6bd] font-medium">USDC</span>
                    </span>
                  </div>
                  <span className="size-7 rounded-lg bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 group-hover:bg-[#10b981] group-hover:text-[#07090e] flex items-center justify-center text-sm font-extrabold transition-all">
                    +
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-16 space-y-2">
          <p className="text-2xl">\uD83D\uDD0D</p>
          <p className="text-xs font-semibold text-[#b2b6bd]">No products found for &ldquo;{search}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
