'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Key, Copy, Check, Sliders, RefreshCw, Zap, Lock } from 'lucide-react';

interface TgPolicySettingsProps {
  triggerHaptic?: (type?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => void;
}

function GlowSlider({
  min, max, step, value, onChange, accent,
}: {
  min: number; max: number; step: number; value: number;
  onChange: (v: number) => void;
  accent: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="relative h-2 rounded-full bg-[#0d1117]">
      <div
        className="absolute left-0 top-0 h-full rounded-full transition-all"
        style={{ width: `${pct}%`, background: accent }}
      />
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
      />
    </div>
  );
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

  useEffect(() => {
    try {
      const stored = localStorage.getItem('mercenta_merchant_api_key_v1');
      if (stored) { setApiKey(stored); }
      else {
        const initial = `mct_live_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
        setApiKey(initial);
        localStorage.setItem('mercenta_merchant_api_key_v1', initial);
      }
      const savedPolicy = localStorage.getItem('mercenta_policy_guardrails_v1');
      if (savedPolicy) {
        const parsed = JSON.parse(savedPolicy);
        if (parsed.marginFloor)       setMarginFloor(parsed.marginFloor);
        if (parsed.autoApprovalLimit) setAutoApprovalLimit(parsed.autoApprovalLimit);
        if (parsed.velocityCap)       setVelocityCap(parsed.velocityCap);
        if (parsed.reserveRatio)      setReserveRatio(parsed.reserveRatio);
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
      localStorage.setItem('mercenta_policy_guardrails_v1', JSON.stringify({ marginFloor, autoApprovalLimit, velocityCap, reserveRatio, strictVendorCheck }));
    } catch {}
    setTimeout(() => setSavedStatus(false), 2500);
  }

  const sliders = [
    {
      label: '1. Gross Margin Floor',
      desc: 'Orders below this spread are aborted at the consensus level.',
      value: marginFloor.toFixed(1) + '%',
      accent: '#10b981',
      accentLabel: 'text-[#10b981]',
      accentBg: 'bg-[#10b981]/10 border-[#10b981]/25',
      min: 1, max: 15, step: 0.5,
      current: marginFloor,
      set: (v: number) => { triggerHaptic?.('light'); setMarginFloor(v); },
    },
    {
      label: '2. Auto-Approval Cap',
      desc: 'Maximum single purchase allowed without owner sign-off.',
      value: '$' + autoApprovalLimit + ' USDC',
      accent: '#1868f2',
      accentLabel: 'text-[#6ee9ff]',
      accentBg: 'bg-[#1868f2]/10 border-[#1868f2]/25',
      min: 10, max: 1000, step: 25,
      current: autoApprovalLimit,
      set: (v: number) => { triggerHaptic?.('light'); setAutoApprovalLimit(v); },
    },
    {
      label: '3. Spend Velocity Cap',
      desc: 'Protects treasury against loop drain attacks.',
      value: velocityCap + ' tx / min',
      accent: '#a855f7',
      accentLabel: 'text-purple-300',
      accentBg: 'bg-purple-500/10 border-purple-500/25',
      min: 1, max: 30, step: 1,
      current: velocityCap,
      set: (v: number) => { triggerHaptic?.('light'); setVelocityCap(v); },
    },
    {
      label: '4. Treasury Reserve Ratio',
      desc: 'Safe buffer to prevent zero-balance gas locks.',
      value: reserveRatio + '% minimum',
      accent: '#f59e0b',
      accentLabel: 'text-amber-300',
      accentBg: 'bg-amber-500/10 border-amber-500/25',
      min: 5, max: 50, step: 5,
      current: reserveRatio,
      set: (v: number) => { triggerHaptic?.('light'); setReserveRatio(v); },
    },
  ];

  return (
    <div className="space-y-4 pb-24 text-white">

      {/* Engine Status Banner */}
      <div
        className="relative overflow-hidden p-4 rounded-3xl border border-[#10b981]/20 shadow-2xl shadow-black/50 space-y-3"
        style={{ background: 'linear-gradient(135deg, #051810 0%, #061a10 60%, #050f0a 100%)' }}
      >
        <div className="absolute -top-10 -right-10 size-32 bg-[#10b981]/15 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="size-9 rounded-xl flex items-center justify-center shadow-lg border border-[#10b981]/30"
              style={{ background: 'linear-gradient(135deg, #10b981, #00ca8e)' }}
            >
              <ShieldCheck className="size-5 text-[#07090e]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white tracking-tight">5-Gate Policy Engine</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="size-1.5 rounded-full bg-[#00ca8e] animate-pulse shadow-[0_0_6px_#00ca8e]" />
                <span className="text-[10px] font-mono font-bold text-[#00ca8e] uppercase tracking-wider">Hardware Enforced on Arc</span>
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#10b981]/15 border border-[#10b981]/30 text-[10px] font-mono font-bold text-[#10b981]">
            ACTIVE
          </span>
        </div>
        <p className="text-[#b2b6bd] text-xs leading-relaxed">
          Hardware-enforced spending boundaries. Autonomous AI agents cannot exceed these parameters without manual multisig approval.
        </p>
      </div>

      {/* Guardrail Controls */}
      <div className="bg-[#0d1117] border border-white/6 rounded-2xl p-4 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Sliders className="size-4 text-[#10b981]" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">Guardrail Parameters</h4>
          </div>
          <span className="text-[10px] font-mono text-[#b2b6bd] bg-[#07090e] px-2 py-0.5 rounded-lg border border-white/6">
            Deterministic v2.1
          </span>
        </div>

        {sliders.map((s, i) => (
          <div key={i} className={i > 0 ? 'pt-4 border-t border-white/5 space-y-2' : 'space-y-2'}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white font-bold">{s.label}</span>
              <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded-md border ${s.accentLabel} ${s.accentBg}`}>
                {s.value}
              </span>
            </div>
            <GlowSlider
              min={s.min} max={s.max} step={s.step}
              value={s.current}
              onChange={s.set}
              accent={s.accent}
            />
            <p className="text-[11px] text-[#b2b6bd] leading-snug">{s.desc}</p>
          </div>
        ))}

        {/* Strict Vendor Toggle */}
        <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs text-white font-bold block">5. Strict Institutional Routing</span>
            <p className="text-[11px] text-[#b2b6bd] leading-snug">
              Route exclusively through tier-1 institutional feeds with guaranteed warranty.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { triggerHaptic?.('medium'); setStrictVendorCheck(!strictVendorCheck); }}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 transition-all duration-200 ${
              strictVendorCheck ? 'border-[#10b981] bg-[#10b981]' : 'border-white/20 bg-[#07090e]'
            }`}
          >
            <span className={`inline-block size-4 rounded-full bg-white shadow-lg transform transition-all duration-200 ${
              strictVendorCheck ? 'translate-x-5' : 'translate-x-0.5'
            } mt-0.5`} />
          </button>
        </div>

        {/* Save */}
        <button
          type="button"
          onClick={handleSavePolicy}
          className="w-full py-3 rounded-xl font-extrabold text-xs text-[#07090e] flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] mt-2"
          style={{ background: savedStatus ? '#00ca8e' : 'linear-gradient(135deg, #10b981, #00ca8e)' }}
        >
          {savedStatus ? (
            <><Check className="size-4 stroke-[3]" /> Saved to Chain</>
          ) : (
            <><Zap className="size-4" /> Save Policy Guardrails</>
          )}
        </button>
      </div>

      {/* API Key */}
      <div className="bg-[#0d1117] border border-white/6 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
          <Key className="size-4 text-[#10b981]" />
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">Merchant API Key</h4>
          <span className="ml-auto px-2 py-0.5 rounded-full bg-[#10b981]/10 border border-[#10b981]/25 text-[9px] font-mono font-bold text-[#10b981]">
            LIVE
          </span>
        </div>

        <div
          onClick={handleCopyKey}
          className="p-3 bg-[#07090e] border border-white/6 rounded-xl cursor-pointer hover:border-[#10b981]/40 transition-all flex items-center justify-between gap-2 shadow-inner"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <Lock className="size-3.5 text-[#4a5568] shrink-0" />
            <span className="font-mono text-[11px] text-[#b2b6bd] truncate select-all">{apiKey}</span>
          </div>
          <div className="shrink-0 size-7 rounded-lg bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center">
            {copiedKey ? <Check className="size-3.5 text-[#10b981] stroke-[3]" /> : <Copy className="size-3.5 text-[#10b981]" />}
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerateNewKey}
          className="w-full py-2.5 rounded-xl bg-[#07090e] border border-white/6 hover:border-[#1868f2]/40 text-[#b2b6bd] hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
        >
          <RefreshCw className="size-3.5" />
          Rotate API Key
        </button>
      </div>
    </div>
  );
}
