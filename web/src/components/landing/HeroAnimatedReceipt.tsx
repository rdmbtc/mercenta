"use client";

import { useEffect, useRef, useState } from "react";
import BrandMark from "./BrandMark";

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
    cost: 1700.00,
    feePct: "0%",
    feeAmount: 31.50,
    margin: "19.0%",
    decision: "Cleared",
    network: "Arc Mainnet (5042)",
    checks: "5/5 Checks Passed",
  },
  {
    id: "MR-ORD-3294",
    name: "Telegram Stars (10,000 Stars)",
    category: "Creator & Game Micro-Donations",
    sku: "TG-STARS-10K",
    region: "GLOBAL",
    batchInfo: "10,000 in-app stars",
    amount: 199.90,
    cost: 164.50,
    feePct: "1.5%",
    feeAmount: 3.00,
    margin: "17.7%",
    decision: "Cleared",
    network: "Arc Mainnet (5042)",
    checks: "5/5 Checks Passed",
  },
  {
    id: "MR-ORD-7810",
    name: "Cloud GPU Cluster (H100 Node)",
    category: "Cloud Compute & GPU Vouchers",
    sku: "GPU-H100-24H",
    region: "US-EAST",
    batchInfo: "Dedicated 24h allocation",
    amount: 4850,
    cost: 4020.00,
    feePct: "1.5%",
    feeAmount: 72.75,
    margin: "17.1%",
    decision: "Cleared",
    network: "Arc Mainnet (5042)",
    checks: "5/5 Checks Passed",
  },
  {
    id: "MR-ORD-4105",
    name: "PlayStation Store $50 Code",
    category: "Gaming Keys & Platform Vouchers",
    sku: "PSN-USA-050",
    region: "USA",
    batchInfo: "Batch of 17 vouchers",
    amount: 850.00,
    cost: 714.00,
    feePct: "1.5%",
    feeAmount: 12.75,
    margin: "16.0%",
    decision: "Cleared",
    network: "Arc Mainnet (5042)",
    checks: "5/5 Checks Passed",
  },
  {
    id: "MR-ORD-6523",
    name: "Developer API Token Pool",
    category: "Developer API & Token Bundles",
    sku: "DEV-TOKENS-500M",
    region: "GLOBAL",
    batchInfo: "500M Inference tokens",
    amount: 1250.00,
    cost: 1025.00,
    feePct: "1.5%",
    feeAmount: 18.75,
    margin: "18.0%",
    decision: "Cleared",
    network: "Arc Mainnet (5042)",
    checks: "5/5 Checks Passed",
  },
  {
    id: "MR-ORD-8930",
    name: "Apple Gift Card $200",
    category: "Streaming & Media Subscriptions",
    sku: "APPLE-US-200",
    region: "USA",
    batchInfo: "Batch of 17 vouchers",
    amount: 3400.00,
    cost: 2856.00,
    feePct: "1.5%",
    feeAmount: 51.00,
    margin: "16.0%",
    decision: "Cleared",
    network: "Arc Mainnet (5042)",
    checks: "5/5 Checks Passed",
  },
];

function PassIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="m6 10 2.5 2.5L14 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function HeroAnimatedReceipt() {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const order = HERO_CLEARING_ORDERS[index];

  // Auto-cycle through items
  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % HERO_CLEARING_ORDERS.length);
        setAnimating(false);
      }, 240);
    }, 3800);

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

  async function copyJson() {
    const payload = {
      illustrative: true,
      orderId: order.id,
      product: order.name,
      sku: order.sku,
      category: order.category,
      clientPriceUsdc: order.amount,
      supplierCostUsdc: order.cost,
      platformFeeUsdc: order.feeAmount,
      grossMargin: order.margin,
      decision: order.decision,
      checks: order.checks,
      settlementNetwork: order.network,
      timestamp: new Date().toISOString(),
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className="mx-hero-receipt-stage"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      role="region"
      aria-label="Live animated order receipt"
    >
      {/* Surrounding ambient halo matching policy gate */}
      <div className="mx-hero-receipt-glow" aria-hidden="true" />

      {/* Main receipt ticket with jagged edges */}
      <div className={`mx-receipt mx-hero-receipt ${animating ? "is-transitioning" : ""}`}>
        {/* Holographic scanning laser beam */}
        <span className="mx-hero-receipt-scan" aria-hidden="true" />

        {/* Top Header */}
        <div className="mx-receipt-top">
          <div className="mx-receipt-brand-row">
            <BrandMark />
            <div className="mx-receipt-meta-kicker">
              <span className="mx-label">ILLUSTRATIVE ORDER RECORD</span>
              <span className="mx-receipt-live-tag">
                <span className="mx-beacon" /> LIVE CLEARING
              </span>
            </div>
          </div>
          <button
            type="button"
            className="mx-receipt-copy-btn"
            onClick={copyJson}
            title="Copy order record JSON"
            aria-label="Copy record JSON"
          >
            <CopyIcon />
            <span>{copied ? "Copied" : "JSON"}</span>
          </button>
        </div>

        {/* Order Identifier & Product SKU Badge */}
        <div className="mx-receipt-sku-row">
          <span className="mx-label mx-order-code">{order.id}</span>
          <span className="mx-receipt-sku-badge">{order.sku}</span>
        </div>

        {/* Product Title */}
        <div className="mx-receipt-product">
          <h3 className="mx-receipt-product-name">{order.name}</h3>
          <span className="mx-receipt-batch-desc">{order.batchInfo} · {order.region}</span>
        </div>

        {/* Main Big Amount */}
        <div className="mx-receipt-amount">
          <span className="mx-receipt-amount-val">
            {order.amount.toLocaleString("en-US", { minimumFractionDigits: order.amount % 1 === 0 ? 0 : 2 })}
          </span>
          <span>USDC</span>
        </div>

        {/* Financial Breakdown Rows */}
        <dl className="mx-receipt-breakdown">
          <div>
            <dt>Supplier cost</dt>
            <dd>{order.cost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC</dd>
          </div>
          <div>
            <dt>Platform fee ({order.feePct})</dt>
            <dd>{order.feeAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC</dd>
          </div>
          <div>
            <dt>Gross margin</dt>
            <dd className="mx-receipt-margin-tag">{order.margin}</dd>
          </div>
        </dl>

        {/* Bottom Decision Seal */}
        <div className="mx-receipt-bottom">
          <div className="mx-receipt-status-pill">
            <PassIcon />
            <strong>{order.decision}</strong>
          </div>
          <span className="mx-receipt-preview-badge">PREVIEW ONLY</span>
        </div>

        {/* Network & Policy verification banner */}
        <div className="mx-receipt-foot-network">
          <span>{order.checks}</span>
          <span className="mx-receipt-foot-dot">·</span>
          <span>{order.network}</span>
        </div>
      </div>

      {/* Manual Switcher Controls */}
      <div className="mx-receipt-nav-bar" aria-label="Receipt order selector">
        <div className="mx-receipt-dots" role="tablist">
          {HERO_CLEARING_ORDERS.map((item, i) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show order ${item.id} (${item.name})`}
              className={`mx-receipt-dot ${i === index ? "is-active" : ""}`}
              onClick={() => selectIndex(i)}
            >
              <span className="mx-receipt-dot-inner" />
            </button>
          ))}
        </div>
        <div className="mx-receipt-pause-indicator">
          {isPaused ? "Paused" : `0${index + 1} / 0${HERO_CLEARING_ORDERS.length}`}
        </div>
      </div>
    </div>
  );
}
