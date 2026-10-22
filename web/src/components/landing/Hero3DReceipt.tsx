"use client";

import { useEffect, useRef, useState } from "react";
import BrandMark from "./BrandMark";
import { RollingNumber } from "@/components/panelui/rolling-number";
import { ArcSettlementGlobe } from "@/components/panelui/ArcSettlementGlobe";

export interface ClearingOrder {
  id: string;
  name: string;
  category: string;
  sku: string;
  region: string;
  batchInfo: string;
  amount: number;
  cost: number;
  feePct: string;
  feeAmount: number;
  margin: string;
  decision: string;
  network: string;
  checks: string;
  txHash: string;
  latency: string;
}

export const HERO_CLEARING_ORDERS: ClearingOrder[] = [
  {
    id: "MR-ORD-2481",
    name: "Steam Gift Card $100",
    category: "Gaming Keys & Platform Vouchers",
    sku: "STEAM-USD-100-GL",
    region: "GLOBAL",
    batchInfo: "Batch of 21 vouchers",
    amount: 2100,
    cost: 1700.0,
    feePct: "0%",
    feeAmount: 31.5,
    margin: "19.0%",
    decision: "Cleared",
    network: "Arc Mainnet (5042)",
    checks: "5/5 Checks Passed",
    txHash: "0x8f3c...b491",
    latency: "14ms",
  },
  {
    id: "MR-ORD-3294",
    name: "Telegram Stars (10,000)",
    category: "Creator & Game Micro-Donations",
    sku: "TG-STARS-10K",
    region: "GLOBAL",
    batchInfo: "10,000 in-app stars",
    amount: 199.9,
    cost: 164.5,
    feePct: "1.5%",
    feeAmount: 3.0,
    margin: "17.7%",
    decision: "Cleared",
    network: "Arc Mainnet (5042)",
    checks: "5/5 Checks Passed",
    txHash: "0x3e1a...72fd",
    latency: "11ms",
  },
  {
    id: "MR-ORD-7810",
    name: "Cloud GPU Cluster H100",
    category: "Cloud Compute & GPU Vouchers",
    sku: "GPU-H100-24H",
    region: "US-EAST",
    batchInfo: "Dedicated 24h allocation",
    amount: 4850,
    cost: 4020.0,
    feePct: "1.5%",
    feeAmount: 72.75,
    margin: "17.1%",
    decision: "Cleared",
    network: "Arc Mainnet (5042)",
    checks: "5/5 Checks Passed",
    txHash: "0xd944...28cc",
    latency: "18ms",
  },
  {
    id: "MR-ORD-4105",
    name: "PlayStation Store $50",
    category: "Gaming Keys & Platform Vouchers",
    sku: "PSN-USA-050",
    region: "USA",
    batchInfo: "Batch of 17 vouchers",
    amount: 850.0,
    cost: 714.0,
    feePct: "1.5%",
    feeAmount: 12.75,
    margin: "16.0%",
    decision: "Cleared",
    network: "Arc Mainnet (5042)",
    checks: "5/5 Checks Passed",
    txHash: "0x51ab...90e3",
    latency: "12ms",
  },
  {
    id: "MR-ORD-6523",
    name: "Developer API Token Pool",
    category: "Developer API & Token Bundles",
    sku: "DEV-TOKENS-500M",
    region: "GLOBAL",
    batchInfo: "500M Inference tokens",
    amount: 1250.0,
    cost: 1025.0,
    feePct: "1.5%",
    feeAmount: 18.75,
    margin: "18.0%",
    decision: "Cleared",
    network: "Arc Mainnet (5042)",
    checks: "5/5 Checks Passed",
    txHash: "0xaa42...5510",
    latency: "16ms",
  },
  {
    id: "MR-ORD-8930",
    name: "Apple Gift Card $200",
    category: "Streaming & Media Subscriptions",
    sku: "APPLE-US-200",
    region: "USA",
    batchInfo: "Batch of 17 vouchers",
    amount: 3400.0,
    cost: 2856.0,
    feePct: "1.5%",
    feeAmount: 51.0,
    margin: "16.0%",
    decision: "Cleared",
    network: "Arc Mainnet (5042)",
    checks: "5/5 Checks Passed",
    txHash: "0x77c1...f982",
    latency: "13ms",
  },
];

function StatusPassIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="m6 10 2.5 2.5L14 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Hero3DReceipt() {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [viewMode, setViewMode] = useState<'receipt' | 'mesh'>('receipt');

  // 3D interactive tilt
  const [tilt, setTilt] = useState({ rx: 3, ry: -9, gx: 50, gy: 30 });
  const cardRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const order = HERO_CLEARING_ORDERS[index];

  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % HERO_CLEARING_ORDERS.length);
        setAnimating(false);
      }, 250);
    }, 4000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused]);

  function selectIndex(nextIndex: number) {
    if (nextIndex === index) return;
    setAnimating(true);
    setTimeout(() => {
      setIndex(nextIndex);
      setAnimating(false);
    }, 200);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const ry = ((x - centerX) / centerX) * 11;
    const rx = -((y - centerY) / centerY) * 9;
    const gx = (x / rect.width) * 100;
    const gy = (y / rect.height) * 100;

    setTilt({ rx, ry, gx, gy });
  }

  function handleMouseLeave() {
    setIsPaused(false);
    setTilt({ rx: 3, ry: -9, gx: 50, gy: 30 });
  }

  return (
    <div
      className="mx-3d-receipt-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      role="region"
      aria-label="3D Live Animated Order Receipt & Settlement Mesh"
    >
      {/* Mode Switcher: 3D Live Receipt vs Arc Mesh Vector Globe */}
      <div className="flex items-center justify-between mb-3 w-full px-1 text-xs" style={{ minHeight: '34px' }}>
        <span className="font-mono text-[11px] text-muted-foreground tracking-wider uppercase">
          Arc Mainnet Node · 5042
        </span>
        <div className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-black/40 p-1">
          <button
            type="button"
            onClick={() => setViewMode('receipt')}
            className={`px-2.5 py-0.5 rounded-lg text-xs transition-colors ${
              viewMode === 'receipt'
                ? 'bg-sky-500/20 text-sky-400 font-semibold border border-sky-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            3D Receipt
          </button>
          <button
            type="button"
            onClick={() => setViewMode('mesh')}
            className={`px-2.5 py-0.5 rounded-lg text-xs transition-colors ${
              viewMode === 'mesh'
                ? 'bg-sky-500/20 text-sky-400 font-semibold border border-sky-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Arc Mesh Globe
          </button>
        </div>
      </div>

      {viewMode === 'mesh' ? (
        <ArcSettlementGlobe className="w-full" interactive />
      ) : (
        <>
          {/* 3D Physical Paper Card Shell */}
          <div
            ref={cardRef}
            className={`mx-receipt mx-3d-paper-receipt ${animating ? "is-flipping" : ""}`}
            style={{
              transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
            }}
          >
        {/* Holographic Specular Glare */}
        <div
          className="mx-3d-glare"
          style={{
            background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(255, 255, 255, 0.45) 0%, rgba(178, 229, 255, 0.15) 35%, transparent 65%)`,
          }}
          aria-hidden="true"
        />

        {/* Laser Scanning Line */}
        <div className="mx-3d-scanline" aria-hidden="true" />

        {/* Top: BrandMark + Illustrative Order Record + Live Clearing Badge */}
        <div className="mx-receipt-top">
          <BrandMark />
          <span className="mx-label">ILLUSTRATIVE ORDER RECORD</span>
          <div className="mx-receipt-live-badge">
            <span className="mx-receipt-live-dot" />
            <span>SETTLED</span>
          </div>
        </div>

        {/* Order ID & Product SKU */}
        <div className="mx-receipt-id-row">
          <div className="mx-receipt-id-group">
            <span className="mx-receipt-id-val">{order.id}</span>
            <span className="mx-receipt-status-tag">CONFIRMED</span>
          </div>
          <span className="mx-receipt-sku-badge">{order.sku}</span>
        </div>

        {/* Product Category & Title */}
        <div className="mx-receipt-product-row">
          <span className="mx-receipt-category-tag">{order.category}</span>
          <h3 className="mx-receipt-item-title">{order.name}</h3>
          <div className="mx-receipt-item-meta">
            <span>{order.batchInfo}</span>
            <span className="mx-receipt-dot-sep">·</span>
            <span className="mx-receipt-region-pill">{order.region}</span>
          </div>
        </div>

        {/* Big Amount Display */}
        <div className="mx-receipt-amount">
          <span className="mx-receipt-amount-num">
            <RollingNumber
              value={order.amount}
              format={{ minimumFractionDigits: order.amount % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 }}
            />
          </span>
          <span className="mx-receipt-currency-unit">USDC</span>
        </div>

        {/* Financial Breakdown: Supplier cost, Platform fee, Gross margin */}
        <dl className="mx-receipt-breakdown">
          <div>
            <dt>Supplier cost</dt>
            <dd>
              <RollingNumber value={order.cost} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} /> USDC
            </dd>
          </div>
          <div>
            <dt>Platform fee ({order.feePct})</dt>
            <dd>
              <RollingNumber value={order.feeAmount} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} /> USDC
            </dd>
          </div>
          <div className="mx-receipt-margin-row">
            <dt>Gross margin</dt>
            <dd className="mx-receipt-margin-num">+{order.margin}</dd>
          </div>
        </dl>

        {/* Bottom Status Seal: Cleared + PREVIEW ONLY */}
        <div className="mx-receipt-bottom">
          <StatusPassIcon />
          <strong>{order.decision}</strong>
          <span className="mx-receipt-guardrail-tag">5/5 CHECKS PASSED</span>
          <span className="mx-receipt-preview-mark">PREVIEW ONLY</span>
        </div>

        {/* Authentic Barcode & Cryptographic Hash Footer */}
        <div className="mx-receipt-barcode-row" aria-hidden="true">
          <div className="mx-receipt-barcode">
            <span className="mx-bar-1" />
            <span className="mx-bar-2" />
            <span className="mx-bar-1" />
            <span className="mx-bar-3" />
            <span className="mx-bar-1" />
            <span className="mx-bar-2" />
            <span className="mx-bar-4" />
            <span className="mx-bar-1" />
            <span className="mx-bar-2" />
            <span className="mx-bar-3" />
            <span className="mx-bar-1" />
            <span className="mx-bar-2" />
            <span className="mx-bar-1" />
            <span className="mx-bar-4" />
            <span className="mx-bar-2" />
            <span className="mx-bar-1" />
            <span className="mx-bar-3" />
            <span className="mx-bar-2" />
            <span className="mx-bar-1" />
            <span className="mx-bar-4" />
            <span className="mx-bar-1" />
            <span className="mx-bar-3" />
            <span className="mx-bar-2" />
            <span className="mx-bar-1" />
            <span className="mx-bar-2" />
            <span className="mx-bar-4" />
            <span className="mx-bar-1" />
          </div>
          <div className="mx-receipt-crypto-meta">
            <span>TX: {order.txHash}</span>
            <span>LATENCY: {order.latency}</span>
            <span>{order.network}</span>
          </div>
        </div>
      </div>

      {/* Switcher Navigation */}
      <div className="mx-3d-receipt-dots-nav">
        <div className="mx-3d-dots" role="tablist">
          {HERO_CLEARING_ORDERS.map((item, i) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Select order ${item.id} (${item.name})`}
              className={`mx-3d-dot-btn ${i === index ? "is-active" : ""}`}
              onClick={() => selectIndex(i)}
            >
              <span className="mx-3d-dot-bar" />
            </button>
          ))}
        </div>
        <span className="mx-3d-counter">
          {isPaused ? "PAUSED" : `0${index + 1} / 0${HERO_CLEARING_ORDERS.length}`}
        </span>
      </div>
    </>
  )}
</div>
  );
}
