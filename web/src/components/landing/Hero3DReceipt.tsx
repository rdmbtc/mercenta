"use client";

import { useEffect, useRef, useState } from "react";

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
  icon: string;
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
    icon: "🎮",
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
    icon: "⭐",
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
    icon: "⚡",
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
    icon: "▲",
  },
  {
    id: "MR-ORD-6523",
    name: "Developer API Credits",
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
    icon: "</>",
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
    icon: "🍎",
  },
];

export default function Hero3DReceipt() {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [copied, setCopied] = useState(false);

  // 3D Interactive tilt tracking
  const [tilt, setTilt] = useState({ rx: 4, ry: -10, gx: 50, gy: 30 });
  const cardRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const order = HERO_CLEARING_ORDERS[index];

  // Auto-cycle orders
  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % HERO_CLEARING_ORDERS.length);
        setAnimating(false);
      }, 260);
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

    const ry = ((x - centerX) / centerX) * 12; // tilt left/right
    const rx = -((y - centerY) / centerY) * 10; // tilt up/down
    const gx = (x / rect.width) * 100;
    const gy = (y / rect.height) * 100;

    setTilt({ rx, ry, gx, gy });
  }

  function handleMouseLeave() {
    setIsPaused(false);
    // Smoothly return to resting 3D angle
    setTilt({ rx: 4, ry: -10, gx: 50, gy: 30 });
  }

  async function copyJson() {
    const payload = {
      record: "ILLUSTRATIVE ORDER RECORD",
      orderId: order.id,
      product: order.name,
      sku: order.sku,
      category: order.category,
      clientPriceUsdc: order.amount,
      supplierCostUsdc: order.cost,
      platformFeeUsdc: order.feeAmount,
      grossMargin: order.margin,
      status: order.decision,
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
      className="mx-3d-receipt-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      role="region"
      aria-label="3D Animated Order Docket"
    >
      {/* Dynamic 3D Card Shell with Preserve-3D */}
      <div
        ref={cardRef}
        className={`mx-3d-receipt-card ${animating ? "is-flipping" : ""}`}
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        }}
      >
        {/* Holographic Specular Glare Layer */}
        <div
          className="mx-3d-glare"
          style={{
            background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(178, 229, 255, 0.22) 0%, rgba(24, 104, 242, 0.08) 40%, transparent 70%)`,
          }}
          aria-hidden="true"
        />

        {/* Holographic Quantum Laser Scanning Line */}
        <div className="mx-3d-scanline" aria-hidden="true" />

        {/* 3D Floating Top Badges (Z: 28px) */}
        <div className="mx-3d-layer-top">
          <div className="mx-3d-kicker-group">
            <span className="mx-3d-kicker-icon">{order.icon}</span>
            <div>
              <span className="mx-3d-kicker-label">ILLUSTRATIVE ORDER RECORD</span>
              <span className="mx-3d-kicker-sub">ARC CLEARING PROTOCOL · 5042</span>
            </div>
          </div>
          <button
            type="button"
            className="mx-3d-copy-chip"
            onClick={copyJson}
            title="Copy cleared JSON receipt"
          >
            <span>{copied ? "COPIED ✓" : "COPY JSON"}</span>
          </button>
        </div>

        {/* Order Identifier & Category SKU (Z: 24px) */}
        <div className="mx-3d-order-meta">
          <div className="mx-3d-order-id-badge">
            <span className="mx-3d-dot-beacon" />
            <strong>{order.id}</strong>
          </div>
          <span className="mx-3d-sku-tag">{order.sku}</span>
        </div>

        {/* Product Title Banner (Z: 32px) */}
        <div className="mx-3d-product-block">
          <h3 className="mx-3d-product-title">{order.name}</h3>
          <p className="mx-3d-product-batch">{order.batchInfo} · {order.region}</p>
        </div>

        {/* Massive 3D Amount Display (Z: 44px) */}
        <div className="mx-3d-amount-block">
          <div className="mx-3d-amount-value">
            <span className="mx-3d-currency-symbol">$</span>
            <span className="mx-3d-number">
              {order.amount.toLocaleString("en-US", { minimumFractionDigits: order.amount % 1 === 0 ? 0 : 2 })}
            </span>
          </div>
          <span className="mx-3d-usdc-badge">USDC</span>
        </div>

        {/* Financial Breakdown Grid (Z: 20px) */}
        <div className="mx-3d-breakdown-grid">
          <div className="mx-3d-breakdown-item">
            <span className="mx-3d-breakdown-dt">Supplier cost</span>
            <strong className="mx-3d-breakdown-dd">
              {order.cost.toLocaleString("en-US", { minimumFractionDigits: 2 })} USDC
            </strong>
          </div>
          <div className="mx-3d-breakdown-item">
            <span className="mx-3d-breakdown-dt">Platform fee ({order.feePct})</span>
            <strong className="mx-3d-breakdown-dd">
              {order.feeAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} USDC
            </strong>
          </div>
          <div className="mx-3d-breakdown-item mx-3d-margin-highlight">
            <span className="mx-3d-breakdown-dt">Gross margin</span>
            <strong className="mx-3d-breakdown-dd mx-3d-margin-val">{order.margin}</strong>
          </div>
        </div>

        {/* Bottom Decision Status Bar (Z: 26px) */}
        <div className="mx-3d-footer-bar">
          <div className="mx-3d-status-pill">
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 2a8 8 0 1 0 8 8 8 8 0 0 0-8-8Zm-1 11.5-3.5-3.5 1.4-1.4 2.1 2.1 4.6-4.6 1.4 1.4Z" fill="#00ca8e" />
            </svg>
            <span>{order.decision}</span>
          </div>
          <span className="mx-3d-preview-label">PREVIEW ONLY</span>
        </div>

        {/* Policy Verification Ribbon (Z: 16px) */}
        <div className="mx-3d-checks-bar">
          <span className="mx-3d-shield-icon">🛡️</span>
          <span>{order.checks}</span>
          <span className="mx-3d-checks-sep">·</span>
          <span>{order.network}</span>
        </div>

        {/* Perforated 3D Ticket Jagged Bottom Edge */}
        <div className="mx-3d-teeth" aria-hidden="true" />
      </div>

      {/* Floating 3D Satellite Chip (Z: 50px) */}
      <div className="mx-3d-satellite-badge" aria-hidden="true">
        <span className="mx-3d-beacon-pulse" />
        <span>INSTANT KEY CLEARING</span>
      </div>

      {/* Bottom Switcher Dots & Status */}
      <div className="mx-3d-nav">
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
    </div>
  );
}
