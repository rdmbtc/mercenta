'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Copy,
  Check,
  Key,
  Eye,
  EyeOff,
  ExternalLink,
  RefreshCw,
  ShoppingBag,
  Download,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import type { ArcWalletState } from './useArcWallet';
import { RollingNumber } from '@/components/panelui/rolling-number';

interface TgProfileProps {
  wallet: ArcWalletState;
  onOpenTopUp: () => void;
  onResetWallet: () => void;
  triggerHaptic?: (type?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => void;
}

interface OrderHistoryItem {
  id: string;
  productName: string;
  denomLabel: string;
  amountUsdc: number;
  code: string;
  date: string;
  txHash: string;
}

export function TgProfile({ wallet, onOpenTopUp, onResetWallet, triggerHaptic }: TgProfileProps) {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [history, setHistory] = useState<OrderHistoryItem[]>([]);
  const [copiedOrderItem, setCopiedOrderItem] = useState<string | null>(null);

  useEffect(() => {
    try {
      const historyKey = `mercenta_orders_${wallet.address || 'demo'}`;
      const raw = localStorage.getItem(historyKey);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, [wallet.address]);

  function handleCopyAddress() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(wallet.address);
      setCopiedAddress(true); triggerHaptic?.('success');
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  }

  function handleCopyPrivateKey() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(wallet.privateKey);
      setCopiedKey(true); triggerHaptic?.('success');
      setTimeout(() => setCopiedKey(false), 2000);
    }
  }

  function handleCopyOrderCode(code: string, id: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedOrderItem(id); triggerHaptic?.('success');
      setTimeout(() => setCopiedOrderItem(null), 2000);
    }
  }

  function handleExportCsv() {
    triggerHaptic?.('medium');
    if (history.length === 0) return;
    const headers = 'Order ID,Product,Denomination,USDC Amount,Key,TxHash,Date\n';
    const rows = history.map((h) =>
      `"${h.id}","${h.productName}","${h.denomLabel}",${h.amountUsdc},"${h.code}","${h.txHash}","${h.date}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `mercenta-receipts-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-4 pb-24 text-white">

      {/* ─── Wallet Card ─── */}
      <div
        className="relative overflow-hidden rounded-3xl p-5 shadow-2xl shadow-black/60 space-y-4"
        style={{
          background: 'linear-gradient(135deg, #061a10 0%, #051810 40%, #050f0a 100%)',
          border: '1px solid rgba(16,185,129,0.2)',
        }}
      >
        {/* Decorative glow */}
        <div className="absolute -top-10 -right-10 size-40 rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15), transparent 70%)' }} />
        <div className="absolute -bottom-10 -left-10 size-32 rounded-full blur-2xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(110,233,255,0.08), transparent 70%)' }} />

        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="size-9 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #10b981, #00ca8e)' }}
            >
              <Wallet className="size-5 text-[#07090e]" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#00ca8e] font-extrabold uppercase tracking-widest block">
                Arc Mainnet \u00b7 5042
              </span>
              <h3 className="text-sm font-extrabold text-white tracking-tight">Non-Custodial Wallet</h3>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#10b981]/12 border border-[#10b981]/25 text-[10px] font-mono font-bold text-[#10b981]">
            EVM SECURED
          </span>
        </div>

        {/* Balance */}
        <div>
          <span className="text-[10px] text-[#b2b6bd]/70 font-semibold block">Available Liquidity</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-black font-mono text-white tracking-tight flex items-baseline">
              <span className="text-2xl mr-0.5 text-[#b2b6bd]">$</span>
              <RollingNumber value={wallet.balanceUsdc} />
            </span>
            <span className="text-xs font-mono font-bold text-[#10b981] px-2 py-0.5 rounded-lg bg-[#10b981]/10 border border-[#10b981]/20">
              USDC
            </span>
          </div>
        </div>

        {/* Address Bar */}
        <div className="space-y-1.5">
          <span className="text-xs text-[#b2b6bd]/70 font-semibold block">Personal Arc Address</span>
          <div className="flex items-center justify-between p-2.5 bg-black/30 border border-white/8 rounded-xl">
            <span className="font-mono text-xs text-white font-medium truncate select-all pr-2">{wallet.address}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button" onClick={handleCopyAddress}
                className="size-8 rounded-lg bg-[#10b981]/10 hover:bg-[#10b981]/20 border border-[#10b981]/20 text-[#10b981] flex items-center justify-center transition-all"
              >
                {copiedAddress ? <Check className="size-4 stroke-[3]" /> : <Copy className="size-4" />}
              </button>
              <a
                href={`{{https://explorer.arc.io/address/${wallet.address}}}`}
                target="_blank" rel="noopener noreferrer"
                onClick={() => triggerHaptic?.('light')}
                className="size-8 rounded-lg bg-[#1868f2]/10 hover:bg-[#1868f2]/20 border border-[#1868f2]/20 text-[#6ee9ff] flex items-center justify-center transition-all"
              >
                <ExternalLink className="size-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Top Up CTA */}
        <button
          type="button" onClick={() => { triggerHaptic?.('medium'); onOpenTopUp(); }}
          className="w-full py-3 rounded-xl font-extrabold text-sm text-[#07090e] flex items-center justify-center gap-2 shadow-xl transition-all active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #10b981 0%, #00ca8e 50%, #6ee9ff 100%)' }}
        >
          <Zap className="size-4" /> Top Up Balance
        </button>
      </div>

      {/* ─── Private Key Section ─── */}
      <div className="bg-[#0d1117] border border-white/6 rounded-2xl p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="size-4 text-[#ffcf25]" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">Private Key</h4>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ffcf25]/10 border border-[#ffcf25]/20">
            <AlertTriangle className="size-3 text-[#ffcf25]" />
            <span className="text-[10px] font-bold text-[#ffcf25]">Sensitive</span>
          </div>
        </div>

        <div className="p-3 bg-[#07090e] border border-[#ffcf25]/10 rounded-xl">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-[#b2b6bd] truncate select-all">
              {showPrivateKey ? wallet.privateKey : '\u2022'.repeat(40)}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button" onClick={() => { triggerHaptic?.('light'); setShowPrivateKey(!showPrivateKey); }}
                className="size-7 rounded-lg bg-[#ffcf25]/10 border border-[#ffcf25]/20 text-[#ffcf25] flex items-center justify-center"
              >
                {showPrivateKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
              {showPrivateKey && (
                <button
                  type="button" onClick={handleCopyPrivateKey}
                  className="size-7 rounded-lg bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] flex items-center justify-center"
                >
                  {copiedKey ? <Check className="size-3.5 stroke-[3]" /> : <Copy className="size-3.5" />}
                </button>
              )}
            </div>
          </div>
        </div>
        <p className="text-[10px] text-[#b2b6bd] leading-snug">
          Never share your private key. Store it in a hardware wallet or secure password manager.
        </p>
      </div>

      {/* ─── Order History ─── */}
      <div className="bg-[#0d1117] border border-white/6 rounded-2xl p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-4 text-[#10b981]" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">Order History</h4>
          </div>
          {history.length > 0 && (
            <button
              type="button" onClick={handleExportCsv}
              className="flex items-center gap-1 text-[10px] font-bold text-[#b2b6bd] hover:text-white transition-colors"
            >
              <Download className="size-3" /> Export CSV
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <p className="text-2xl">\uD83D\uDCE6</p>
            <p className="text-xs text-[#b2b6bd] font-semibold">No orders yet</p>
            <p className="text-[10px] text-[#4a5568]">Your purchase history will appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 10).map((item) => (
              <div
                key={item.id}
                className="bg-[#07090e] border border-white/5 hover:border-[#10b981]/20 rounded-xl p-3 space-y-2 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white line-clamp-1">{item.productName}</p>
                    <p className="text-[10px] text-[#b2b6bd] font-medium">{item.denomLabel} \u00b7 {item.date}</p>
                  </div>
                  <span className="font-mono text-xs font-extrabold text-[#10b981] shrink-0">
                    {item.amountUsdc.toFixed(4)} USDC
                  </span>
                </div>
                <div
                  onClick={() => handleCopyOrderCode(item.code, item.id)}
                  className="flex items-center justify-between p-2 bg-black/30 rounded-lg cursor-pointer hover:bg-[#10b981]/5 border border-white/5 hover:border-[#10b981]/20 transition-all group"
                >
                  <span className="font-mono text-[11px] font-bold text-[#00ca8e] tracking-widest">{item.code}</span>
                  <div className="size-6 rounded-md bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center">
                    {copiedOrderItem === item.id ? <Check className="size-3 text-[#10b981] stroke-[3]" /> : <Copy className="size-3 text-[#10b981]" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Danger Zone ─── */}
      <div className="bg-[#0d1117] border border-[#e62b1e]/15 rounded-2xl p-4 space-y-3 shadow-xl">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-[#e62b1e]" />
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">Danger Zone</h4>
        </div>
        <p className="text-[11px] text-[#b2b6bd] leading-snug">
          Reset wallet removes all local keys. Export your private key or backup phrase first.
        </p>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined' && window.confirm('Reset wallet? This cannot be undone. Export your key first.')) {
              onResetWallet();
            }
          }}
          className="w-full py-2.5 rounded-xl bg-[#e62b1e]/10 border border-[#e62b1e]/25 hover:bg-[#e62b1e]/15 text-[#e62b1e] font-bold text-xs flex items-center justify-center gap-2 transition-all"
        >
          <RefreshCw className="size-3.5" /> Reset Wallet
        </button>
      </div>
    </div>
  );
}
