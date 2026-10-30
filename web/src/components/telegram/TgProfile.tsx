'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Copy,
  Check,
  QrCode,
  Key,
  Eye,
  EyeOff,
  ExternalLink,
  RefreshCw,
  ShoppingBag,
  Download,
  AlertTriangle,
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

export function TgProfile({
  wallet,
  onOpenTopUp,
  onResetWallet,
  triggerHaptic,
}: TgProfileProps) {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [history, setHistory] = useState<OrderHistoryItem[]>([]);
  const [copiedOrderItem, setCopiedOrderItem] = useState<string | null>(null);

  // Load history from local storage
  useEffect(() => {
    try {
      const historyKey = `mercenta_orders_${wallet.address || 'demo'}`;
      const raw = localStorage.getItem(historyKey);
      if (raw) {
        setHistory(JSON.parse(raw));
      }
    } catch (e) {
      console.error('History load error:', e);
    }
  }, [wallet.address]);

  function handleCopyAddress() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(wallet.address);
      setCopiedAddress(true);
      triggerHaptic?.('success');
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  }

  function handleCopyPrivateKey() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(wallet.privateKey);
      setCopiedKey(true);
      triggerHaptic?.('success');
      setTimeout(() => setCopiedKey(false), 2000);
    }
  }

  function handleCopyOrderCode(code: string, id: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedOrderItem(id);
      triggerHaptic?.('success');
      setTimeout(() => setCopiedOrderItem(null), 2000);
    }
  }

  function handleExportCsv() {
    triggerHaptic?.('medium');
    if (history.length === 0) return;
    const headers = 'Order ID,Product,Denomination,USDC Amount,Key,TxHash,Date\n';
    const rows = history
      .map(
        (h) =>
          `"${h.id}","${h.productName}","${h.denomLabel}",${h.amountUsdc},"${h.code}","${h.txHash}","${h.date}"`
      )
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
    <div className="space-y-4 pb-24 text-white">
      {/* Wallet Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#161c2e] via-[#101524] to-[#0a0d16] border border-sky-500/40 p-5 shadow-2xl space-y-4">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -right-12 size-36 bg-sky-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/40 shadow-sm shadow-sky-500/30">
              <Wallet className="size-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-sky-300 font-bold uppercase tracking-wider block">
                Arc Mainnet · 5042
              </span>
              <h3 className="text-sm font-bold text-white tracking-tight">Non-Custodial Balance</h3>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-300">
            EVM SECURED
          </span>
        </div>

        {/* Balance Display with RollingNumber */}
        <div>
          <span className="text-xs text-slate-300 font-medium block">Available Liquidity</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight flex items-baseline">
              <span>$</span>
              <RollingNumber value={wallet.balanceUsdc} />
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              USDC
            </span>
          </div>
        </div>

        {/* Address Bar */}
        <div className="space-y-1.5">
          <span className="text-xs text-slate-300 font-semibold block">Personal Arc Address</span>
          <div className="flex items-center justify-between p-2.5 bg-[#080b12] border border-slate-700 rounded-xl">
            <span className="font-mono text-xs text-slate-100 font-medium truncate select-all pr-2">
              {wallet.address}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleCopyAddress}
                className="size-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors border border-slate-600"
                title="Copy Address"
              >
                {copiedAddress ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic?.('light');
                  setShowQr(!showQr);
                }}
                className={`size-8 rounded-lg flex items-center justify-center transition-colors border ${
                  showQr
                    ? 'bg-sky-500 text-black border-sky-400 font-bold'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-600'
                }`}
                title="QR Code"
              >
                <QrCode className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* QR Code Container */}
        {showQr && (
          <div className="p-4 bg-white rounded-2xl flex flex-col items-center justify-center space-y-2 animate-in fade-in duration-150">
            <div className="size-40 bg-neutral-900 rounded-xl flex items-center justify-center p-3 text-center text-white text-[10px] font-mono break-all select-all">
              {wallet.address}
            </div>
            <span className="text-slate-900 text-xs font-semibold text-center">
              Scan with mobile crypto wallet to deposit USDC
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => {
              triggerHaptic?.('medium');
              onOpenTopUp();
            }}
            className="py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20 text-center active:scale-[0.99]"
          >
            + Top Up USDC
          </button>
          <a
            href="https://explorer.arc.io/address/0x06b67adf8d63c8c35a6beda42a3bb93d485af3ed"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => triggerHaptic?.('light')}
            className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Arc Explorer</span>
            <ExternalLink className="size-3.5 text-slate-300" />
          </a>
        </div>
      </div>

      {/* Private Key & Security Section (CRISP HIGH CONTRAST) */}
      <div className="bg-[#121626] border border-slate-700/80 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
          <div className="flex items-center gap-2">
            <Key className="size-4 text-sky-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Non-Custodial Keys
            </h4>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic?.('medium');
              setShowPrivateKey(!showPrivateKey);
            }}
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors px-2 py-1 rounded-md bg-sky-500/10 border border-sky-500/20"
          >
            {showPrivateKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            <span>{showPrivateKey ? 'Hide Key' : 'Reveal Key'}</span>
          </button>
        </div>

        <p className="text-slate-200 text-xs leading-relaxed font-normal">
          Your key is stored securely in your client. You have full non-custodial ownership of your funds and can export to MetaMask, Rabby, or Frame at any time.
        </p>

        {showPrivateKey && (
          <div className="space-y-3 pt-2">
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-start gap-2.5">
              <AlertTriangle className="size-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200 leading-snug font-medium">
                Never share this private key with anyone. Anyone with this key can withdraw your USDC.
              </p>
            </div>

            <div className="flex items-center justify-between p-3 bg-black/90 border border-slate-700 rounded-xl">
              <span className="font-mono text-xs text-amber-300 font-bold truncate select-all pr-2">
                {wallet.privateKey}
              </span>
              <button
                type="button"
                onClick={handleCopyPrivateKey}
                className="size-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center shrink-0 border border-slate-600"
                title="Copy Private Key"
              >
                {copiedKey ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
              </button>
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              if (confirm('Are you sure you want to generate a new wallet? Make sure you backed up your current key!')) {
                triggerHaptic?.('warning');
                onResetWallet();
              }
            }}
            className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors font-medium"
          >
            <RefreshCw className="size-3.5" />
            <span>Reset &amp; Generate New Wallet</span>
          </button>
        </div>
      </div>

      {/* Cryptographic Receipts & Purchase History */}
      <div className="bg-[#121626] border border-slate-700/80 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-4 text-sky-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Voucher Receipts ({history.length})
            </h4>
          </div>
          {history.length > 0 && (
            <button
              type="button"
              onClick={handleExportCsv}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
            >
              <Download className="size-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <div className="size-10 rounded-full bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto border border-slate-700">
              <ShoppingBag className="size-5" />
            </div>
            <p className="text-xs text-slate-200 font-semibold">No purchases yet</p>
            <p className="text-[11px] text-slate-400">
              Your purchased activation keys and on-chain Arc receipts will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-72 overflow-y-auto no-scrollbar">
            {history.map((order) => (
              <div
                key={order.id}
                className="p-3 rounded-xl bg-[#0a0d16] border border-slate-700/70 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-bold text-xs text-white leading-tight">
                      {order.productName}
                    </h5>
                    <span className="text-[11px] font-mono text-emerald-400 font-semibold block">
                      {order.denomLabel} · ${order.amountUsdc.toFixed(2)} USDC
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-300 font-mono">
                    {order.date}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-black/80 border border-slate-800">
                  <span className="font-mono text-xs text-amber-300 font-bold select-all truncate pr-2">
                    {order.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyOrderCode(order.code, order.id)}
                    className="size-7 rounded-md bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center shrink-0 border border-slate-600"
                    title="Copy Key"
                  >
                    {copiedOrderItem === order.id ? (
                      <Check className="size-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
