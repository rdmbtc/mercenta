'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, Copy, Check, QrCode, Key, Eye, EyeOff, Download, ExternalLink, ShieldCheck, RefreshCw } from 'lucide-react';
import type { ArcWalletState } from './useArcWallet';

interface TgProfileProps {
  wallet: ArcWalletState;
  onOpenTopUp: () => void;
  onResetWallet: () => void;
  triggerHaptic?: (type?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => void;
}

interface PurchaseItem {
  id: string;
  productName: string;
  denomLabel: string;
  code: string;
  amountUsdc: number;
  txHash: string;
  date: string;
  brand: string;
}

export function TgProfile({ wallet, onOpenTopUp, onResetWallet, triggerHaptic }: TgProfileProps) {
  const [history, setHistory] = useState<PurchaseItem[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('mercenta_tg_purchase_history_v1');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch {}
  }, []);

  function handleCopy(text: string, id: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(id);
      triggerHaptic?.('success');
      setTimeout(() => setCopiedKey(null), 2000);
    }
  }

  function handleCopyAddress() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(wallet.address);
      setCopiedAddress(true);
      triggerHaptic?.('success');
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  }

  function handleExportCsv() {
    triggerHaptic?.('medium');
    if (history.length === 0) return;
    const headers = 'Order ID,Product,Denomination,USDC Amount,Key,TxHash,Date\n';
    const rows = history
      .map((h) => `"${h.id}","${h.productName}","${h.denomLabel}",${h.amountUsdc},"${h.code}","${h.txHash}","${h.date}"`)
      .join('\n');
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
    <div className="space-y-5 pb-24 text-white">
      {/* Wallet Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#121624] via-[#0b0e17] to-[#07090e] border border-sky-500/30 p-5 shadow-2xl space-y-4">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -right-12 size-36 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Wallet className="size-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-sky-400 uppercase tracking-wider block">
                Arc Mainnet (5042)
              </span>
              <h3 className="text-sm font-semibold text-white">Non-Custodial Balance</h3>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[9px] font-mono font-bold text-emerald-400">
            EVM SECURED
          </span>
        </div>

        {/* Big Balance Display */}
        <div>
          <span className="text-[11px] text-white/50 block">Available Liquidity</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-3xl font-bold font-mono text-white tracking-tight">
              ${wallet.balanceUsdc.toFixed(2)}
            </span>
            <span className="text-xs font-mono font-medium text-emerald-400">USDC</span>
          </div>
        </div>

        {/* Address Bar */}
        <div className="space-y-1">
          <span className="text-[10px] text-white/40 block">Personal Arc Address</span>
          <div className="flex items-center justify-between p-2.5 bg-black/50 border border-white/10 rounded-xl">
            <span className="font-mono text-xs text-white/80 truncate select-all pr-2">
              {wallet.address}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleCopyAddress}
                className="size-7 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors"
                title="Copy Address"
              >
                {copiedAddress ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic?.('light');
                  setShowQr(!showQr);
                }}
                className="size-7 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors"
                title="QR Code"
              >
                <QrCode className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* QR Code Container */}
        {showQr && (
          <div className="p-4 bg-white rounded-2xl flex flex-col items-center justify-center space-y-2 animate-in fade-in duration-150">
            {/* SVG QR Code generation placeholder */}
            <div className="size-36 bg-neutral-900 rounded-lg flex items-center justify-center p-2 text-center text-white text-[10px] font-mono break-all select-all">
              {wallet.address}
            </div>
            <span className="text-black text-[10px] font-sans font-medium text-center">
              Scan with mobile crypto wallet to deposit USDC
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              triggerHaptic?.('medium');
              onOpenTopUp();
            }}
            className="py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20 text-center"
          >
            + Top Up USDC
          </button>
          <a
            href="https://explorer.arc.io/address/0x06b67adf8d63c8c35a6beda42a3bb93d485af3ed"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => triggerHaptic?.('light')}
            className="py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Arc Explorer</span>
            <ExternalLink className="size-3 text-white/50" />
          </a>
        </div>
      </div>

      {/* Private Key & Security Section */}
      <div className="p-4 rounded-2xl bg-[#0e111a] border border-white/10 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Key className="size-4 text-sky-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white/80">
              Non-Custodial Keys
            </h4>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic?.('medium');
              setShowPrivateKey(!showPrivateKey);
            }}
            className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1"
          >
            {showPrivateKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            <span>{showPrivateKey ? 'Hide' : 'Reveal Key'}</span>
          </button>
        </div>

        {showPrivateKey ? (
          <div className="space-y-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
            <div className="flex items-center gap-1.5 text-red-300 text-[11px] font-semibold">
              <ShieldCheck className="size-3.5" />
              <span>Private Key (Never share this with anyone)</span>
            </div>
            <div className="flex items-center justify-between gap-2 bg-black/60 p-2.5 rounded-lg border border-red-500/20">
              <span className="font-mono text-[11px] text-red-200 truncate select-all">
                {wallet.privateKey}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(wallet.privateKey, 'pk')}
                className="size-6 shrink-0 rounded bg-white/10 flex items-center justify-center text-white"
              >
                {copiedKey === 'pk' ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-white/50 leading-relaxed">
            Your key is stored locally in your Telegram client. You have full ownership of your funds and can export to MetaMask, Rabby, or Frame at any time.
          </p>
        )}

        <button
          type="button"
          onClick={() => {
            if (confirm('Generate a brand new Arc wallet? Make sure you exported your current key first!')) {
              onResetWallet();
            }
          }}
          className="text-[10px] text-white/40 hover:text-red-400 flex items-center gap-1 transition-colors pt-1"
        >
          <RefreshCw className="size-3" />
          <span>Reset &amp; Generate New Wallet</span>
        </button>
      </div>

      {/* Purchase History & Digital Key Vault */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-white/80">
            Order Vault ({history.length})
          </h4>
          {history.length > 0 && (
            <button
              type="button"
              onClick={handleExportCsv}
              className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1"
            >
              <Download className="size-3" />
              <span>Export CSV</span>
            </button>
          )}
        </div>

        {history.length > 0 ? (
          <div className="space-y-2">
            {history.map((order) => (
              <div
                key={order.id}
                className="p-3.5 bg-[#0e111a] border border-white/10 rounded-2xl space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] font-mono text-sky-400 uppercase tracking-wider block">
                      {order.brand}
                    </span>
                    <h5 className="font-semibold text-xs text-white leading-tight">
                      {order.productName}
                    </h5>
                    <span className="text-[10px] text-white/50">{order.denomLabel}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-emerald-400 block">
                      ${order.amountUsdc.toFixed(2)} USDC
                    </span>
                    <span className="text-[9px] font-mono text-white/40">
                      {new Date(order.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Key box */}
                <div className="flex items-center justify-between p-2 bg-black/60 border border-white/10 rounded-xl">
                  <span className="font-mono text-xs text-emerald-300 font-bold select-all truncate pr-2">
                    {order.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(order.code, order.id)}
                    className="shrink-0 size-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 transition-colors"
                  >
                    {copiedKey === order.id ? (
                      <Check className="size-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-1">
            <p className="text-xs text-white/60">No purchases yet</p>
            <p className="text-[11px] text-white/40">Keys and vouchers you acquire will appear here securely.</p>
          </div>
        )}
      </div>
    </div>
  );
}
