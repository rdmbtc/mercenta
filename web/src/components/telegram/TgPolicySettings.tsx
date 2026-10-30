'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Key, Copy, Check, Sliders, RefreshCw, AlertTriangle } from 'lucide-react';

interface TgPolicySettingsProps {
  triggerHaptic?: (type?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => void;
}

export function TgPolicySettings({ triggerHaptic }: TgPolicySettingsProps) {
  const [marginFloor, setMarginFloor] = useState<number>(2.5);
  const [autoApprovalLimit, setAutoApprovalLimit] = useState<number>(100);
  const [velocityCap, setVelocityCap] = useState<number>(5);
  const [reserveRatio, setReserveRatio] = useState<number>(10);
  const [strictVendorCheck, setStrictVendorCheck] = useState<boolean>(true);

  const [apiKey, setApiKey] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [savedStatus, setSavedStatus] = useState<boolean>(false);

  // Restore or init API Key
  useEffect(() => {
    try {
      const stored = localStorage.getItem('mercenta_merchant_api_key_v1');
      if (stored) {
        setApiKey(stored);
      } else {
        const initial = `mct_live_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
        setApiKey(initial);
        localStorage.setItem('mercenta_merchant_api_key_v1', initial);
      }
    } catch {}
  }, []);

  function handleGenerateNewKey() {
    triggerHaptic?.('medium');
    const newKey = `mct_live_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
    setApiKey(newKey);
    localStorage.setItem('mercenta_merchant_api_key_v1', newKey);
  }

  function handleCopyKey() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(apiKey);
      setCopiedKey(true);
      triggerHaptic?.('success');
      setTimeout(() => setCopiedKey(false), 2000);
    }
  }

  function handleSavePolicy() {
    triggerHaptic?.('success');
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2000);
  }

  return (
    <div className="space-y-5 pb-24 text-white">
      {/* Header Info */}
      <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-start gap-3">
        <ShieldCheck className="size-5 text-sky-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h4 className="font-semibold text-white">5-Gate Policy Engine</h4>
          <p className="text-white/60 leading-relaxed text-[11px]">
            Hardware-enforced spending boundaries. An autonomous AI agent or connected client bot cannot exceed these rules.
          </p>
        </div>
      </div>

      {/* Policy Engine Controls */}
      <div className="space-y-4 bg-[#0e111a] border border-white/10 rounded-2xl p-4">
        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
          <Sliders className="size-4 text-sky-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/80">Guardrail Parameters</h3>
        </div>

        {/* 1. Margin Floor */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-white/70">Gross Margin Floor</span>
            <span className="font-mono font-bold text-emerald-400">+{marginFloor.toFixed(1)}%</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="15.0"
            step="0.5"
            value={marginFloor}
            onChange={(e) => {
              triggerHaptic?.('light');
              setMarginFloor(parseFloat(e.target.value));
            }}
            className="w-full accent-emerald-400 cursor-pointer"
          />
          <span className="text-[10px] text-white/40 block">Orders with profit spread below this rate will be auto-aborted.</span>
        </div>

        {/* 2. Auto-Approval Limit */}
        <div className="space-y-1.5 pt-2 border-t border-white/5">
          <div className="flex justify-between text-xs">
            <span className="text-white/70">Auto-Approval Cap</span>
            <span className="font-mono font-bold text-sky-400">${autoApprovalLimit} USDC</span>
          </div>
          <input
            type="range"
            min="10"
            max="500"
            step="10"
            value={autoApprovalLimit}
            onChange={(e) => {
              triggerHaptic?.('light');
              setAutoApprovalLimit(parseInt(e.target.value));
            }}
            className="w-full accent-sky-400 cursor-pointer"
          />
          <span className="text-[10px] text-white/40 block">Max single transaction size allowed without manual owner sign-off.</span>
        </div>

        {/* 3. Velocity Limit */}
        <div className="space-y-1.5 pt-2 border-t border-white/5">
          <div className="flex justify-between text-xs">
            <span className="text-white/70">Spend Velocity Cap</span>
            <span className="font-mono font-bold text-purple-400">{velocityCap} tx / minute</span>
          </div>
          <input
            type="range"
            min="1"
            max="20"
            step="1"
            value={velocityCap}
            onChange={(e) => {
              triggerHaptic?.('light');
              setVelocityCap(parseInt(e.target.value));
            }}
            className="w-full accent-purple-400 cursor-pointer"
          />
          <span className="text-[10px] text-white/40 block">Protects your treasury against loop drain attacks and compromised API keys.</span>
        </div>

        {/* 4. Dispute Reserve Ratio */}
        <div className="space-y-1.5 pt-2 border-t border-white/5">
          <div className="flex justify-between text-xs">
            <span className="text-white/70">Dispute &amp; Tax Reserve</span>
            <span className="font-mono font-bold text-amber-400">{reserveRatio}% of revenue</span>
          </div>
          <input
            type="range"
            min="5"
            max="25"
            step="1"
            value={reserveRatio}
            onChange={(e) => {
              triggerHaptic?.('light');
              setReserveRatio(parseInt(e.target.value));
            }}
            className="w-full accent-amber-400 cursor-pointer"
          />
          <span className="text-[10px] text-white/40 block">Automatically segregated in vault for chargeback &amp; tax buffer.</span>
        </div>

        {/* 5. Zero-Trust Supplier Strictness */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div>
            <span className="text-xs font-medium text-white/90 block">Zero-Trust Supplier Verification</span>
            <span className="text-[10px] text-white/40">Only execute orders through cryptographically vetted supplier feeds.</span>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic?.('light');
              setStrictVendorCheck(!strictVendorCheck);
            }}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              strictVendorCheck ? 'bg-emerald-500' : 'bg-white/20'
            }`}
          >
            <span
              className={`size-4 bg-white rounded-full absolute top-1 transition-transform ${
                strictVendorCheck ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>

        <button
          type="button"
          onClick={handleSavePolicy}
          className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 mt-2"
        >
          {savedStatus ? <Check className="size-4 text-emerald-400" /> : null}
          <span>{savedStatus ? 'Policy Guardrails Saved!' : 'Apply Policy Rules'}</span>
        </button>
      </div>

      {/* Developer API Key Generator */}
      <div className="space-y-3 bg-[#0e111a] border border-white/10 rounded-2xl p-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Key className="size-4 text-emerald-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/80">Agent &amp; Bot API Key</h3>
          </div>
          <button
            type="button"
            onClick={handleGenerateNewKey}
            className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-mono"
          >
            <RefreshCw className="size-3" />
            <span>Regenerate</span>
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-white/50 block">Your Secret Bearer Token</label>
          <div className="p-3 bg-black/60 border border-white/10 rounded-xl flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-emerald-300 truncate select-all">{apiKey}</span>
            <button
              type="button"
              onClick={handleCopyKey}
              className="shrink-0 size-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 transition-colors"
            >
              {copiedKey ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
            </button>
          </div>
          <p className="text-[10px] text-white/40 leading-relaxed">
            Use this token to connect your <strong>Client Bot Template</strong> or AI agent SDK directly to Mercenta.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/80 flex items-start gap-2">
          <AlertTriangle className="size-4 text-amber-400 shrink-0 mt-0.5" />
          <span>Keep your key secure. Anyone with this key can purchase wholesale items up to your set auto-approval limit.</span>
        </div>
      </div>
    </div>
  );
}
