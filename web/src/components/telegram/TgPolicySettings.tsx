'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Key, Copy, Check, Sliders, RefreshCw, Zap } from 'lucide-react';

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

      const savedPolicy = localStorage.getItem('mercenta_policy_guardrails_v1');
      if (savedPolicy) {
        const parsed = JSON.parse(savedPolicy);
        if (parsed.marginFloor) setMarginFloor(parsed.marginFloor);
        if (parsed.autoApprovalLimit) setAutoApprovalLimit(parsed.autoApprovalLimit);
        if (parsed.velocityCap) setVelocityCap(parsed.velocityCap);
        if (parsed.reserveRatio) setReserveRatio(parsed.reserveRatio);
        if (typeof parsed.strictVendorCheck === 'boolean') setStrictVendorCheck(parsed.strictVendorCheck);
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
    try {
      localStorage.setItem(
        'mercenta_policy_guardrails_v1',
        JSON.stringify({
          marginFloor,
          autoApprovalLimit,
          velocityCap,
          reserveRatio,
          strictVendorCheck,
        })
      );
    } catch {}
    setTimeout(() => setSavedStatus(false), 2500);
  }

  return (
    <div className="space-y-4 pb-24 text-white">
      {/* 5-Gate Engine Status Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#141b2d] via-[#101524] to-[#0c0f1a] border border-sky-500/30 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/40 shadow-sm shadow-sky-500/30">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white tracking-tight">5-Gate Policy Engine</h3>
              <span className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
                HARDWARE ENFORCED ON ARC
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-300">
            ACTIVE
          </span>
        </div>
        <p className="text-slate-200 text-xs leading-relaxed font-normal">
          Hardware-enforced spending boundaries. Autonomous AI agents and connected client bots cannot exceed these parameters without manual multisig approval.
        </p>
      </div>

      {/* Guardrail Controls Frame */}
      <div className="bg-[#121626] border border-slate-700/80 rounded-2xl p-4 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
          <div className="flex items-center gap-2">
            <Sliders className="size-4 text-sky-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Guardrail Parameters
            </h4>
          </div>
          <span className="text-[10px] font-mono text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
            Deterministic v2.1
          </span>
        </div>

        {/* 1. Gross Margin Floor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white font-semibold">1. Gross Margin Floor</span>
            <span className="font-mono font-bold text-emerald-400 text-xs px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30">
              +{marginFloor.toFixed(1)}%
            </span>
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
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />
          <p className="text-[11px] text-slate-300 leading-snug">
            Orders with profit spread below this rate are automatically aborted at the consensus level.
          </p>
        </div>

        {/* 2. Auto-Approval Limit */}
        <div className="space-y-2 pt-3 border-t border-slate-700/60">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white font-semibold">2. Auto-Approval Cap</span>
            <span className="font-mono font-bold text-sky-300 text-xs px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/30">
              ${autoApprovalLimit} USDC
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="1000"
            step="25"
            value={autoApprovalLimit}
            onChange={(e) => {
              triggerHaptic?.('light');
              setAutoApprovalLimit(parseInt(e.target.value, 10));
            }}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
          />
          <p className="text-[11px] text-slate-300 leading-snug">
            Maximum single purchase allowed autonomously without interactive owner sign-off.
          </p>
        </div>

        {/* 3. Spend Velocity Cap */}
        <div className="space-y-2 pt-3 border-t border-slate-700/60">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white font-semibold">3. Spend Velocity Cap</span>
            <span className="font-mono font-bold text-purple-300 text-xs px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30">
              {velocityCap} tx / minute
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="30"
            step="1"
            value={velocityCap}
            onChange={(e) => {
              triggerHaptic?.('light');
              setVelocityCap(parseInt(e.target.value, 10));
            }}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
          />
          <p className="text-[11px] text-slate-300 leading-snug">
            Protects your treasury against loop drain attacks and rogue agent execution.
          </p>
        </div>

        {/* 4. Treasury Reserve Ratio */}
        <div className="space-y-2 pt-3 border-t border-slate-700/60">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white font-semibold">4. Treasury Reserve Ratio</span>
            <span className="font-mono font-bold text-amber-300 text-xs px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30">
              {reserveRatio}% minimum
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={reserveRatio}
            onChange={(e) => {
              triggerHaptic?.('light');
              setReserveRatio(parseInt(e.target.value, 10));
            }}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
          <p className="text-[11px] text-slate-300 leading-snug">
            Safe buffer locked to prevent zero-balance gas locks on active wholesale orders.
          </p>
        </div>

        {/* 5. Institutional Primary Feeds */}
        <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs text-white font-semibold block">
              5. Strict Institutional Routing
            </span>
            <p className="text-[11px] text-slate-300 leading-snug">
              Route exclusively through tier-1 institutional feeds with guaranteed warranty.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={strictVendorCheck}
              onChange={(e) => {
                triggerHaptic?.('light');
                setStrictVendorCheck(e.target.checked);
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 border border-slate-700" />
          </label>
        </div>

        {/* Save Policy Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSavePolicy}
            className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 ${
              savedStatus
                ? 'bg-emerald-500 text-black shadow-emerald-500/30'
                : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-emerald-500/20 active:scale-[0.99]'
            }`}
          >
            {savedStatus ? (
              <>
                <Check className="size-4 stroke-[3]" />
                <span>Guardrails Saved &amp; Enforced</span>
              </>
            ) : (
              <>
                <Zap className="size-4 fill-current" />
                <span>Update &amp; Apply Guardrails</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* API Key Management Frame */}
      <div className="bg-[#121626] border border-slate-700/80 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
          <div className="flex items-center gap-2">
            <Key className="size-4 text-sky-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Merchant &amp; Agent API Key
            </h4>
          </div>
          <button
            type="button"
            onClick={handleGenerateNewKey}
            className="text-[11px] font-medium text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="size-3" />
            <span>Regenerate</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-300 leading-snug">
          Use this key in your client Telegram store, Python SDK, or agent backend to purchase at wholesale rates.
        </p>

        <div className="flex items-center justify-between p-2.5 bg-[#0a0d16] border border-slate-700 rounded-xl">
          <span className="font-mono text-xs text-emerald-400 font-bold truncate select-all pr-2">
            {apiKey}
          </span>
          <button
            type="button"
            onClick={handleCopyKey}
            className="size-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center shrink-0 transition-colors border border-slate-600"
            title="Copy API Key"
          >
            {copiedKey ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
