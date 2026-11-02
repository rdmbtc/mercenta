'use client';

import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, Zap, RefreshCw, CheckCircle2, Sliders, TrendingUp } from 'lucide-react';
import { Frame } from '@/components/panelui/frame';
import { Stat } from '@/components/panelui/stat';
import { Kpi } from '@/components/panelui/kpi';

interface TreasurySweeperProps {
  ru?: boolean;
  onSwept?: (amount: number) => void;
}

export function TreasurySweeper({ ru = false, onSwept }: TreasurySweeperProps) {
  const t = (en: string, russian: string) => (ru ? russian : en);

  const [operatingBalance, setOperatingBalance] = useState<number>(125.0);
  const [reserveFloor, setReserveFloor] = useState<number>(50.0);
  const [autoSweep, setAutoSweep] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastReceipt, setLastReceipt] = useState<{
    amountSwept: number;
    txHash: string;
    timestamp: string;
  } | null>(null);

  const sweepable = Math.max(0, operatingBalance - reserveFloor);
  const annualYieldEstimate = (sweepable * 0.084).toFixed(2);

  async function handleSweep() {
    if (sweepable <= 0 || loading) return;
    setLoading(true);

    try {
      const res = await fetch('/api/treasury/sweep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentBalance: operatingBalance,
          reserveFloor,
          vaultId: 'galaxy-usdc',
          autoSweepEnabled: autoSweep,
          executeLive: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setLastReceipt({
          amountSwept: data.amountSweptUsdc,
          txHash: data.txHash,
          timestamp: new Date().toLocaleTimeString(),
        });
        setOperatingBalance(reserveFloor);
        if (onSwept) onSwept(data.amountSweptUsdc);
      }
    } catch (e) {
      console.error('Sweep failed:', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Frame variant="band" className="w-full mt-6 bg-[#0a0d14] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      <Frame.Header className="px-5 py-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center text-[#10b981]">
            <TrendingUp className="size-4" />
          </div>
          <div>
            <Frame.Title as="h3" className="text-sm font-bold text-white tracking-wide">
              {t('Autonomous Treasury Sweeper', 'Автономный свипер казначейства')}
            </Frame.Title>
            <p className="text-[11px] text-[#718096]">
              {t('Aomi & Morpho Blue Arc Engine (RFB 01)', 'Движок Aomi & Morpho Blue Arc (RFB 01)')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 font-semibold">
            Arc Mainnet · 5042
          </span>
        </div>
      </Frame.Header>

      <Frame.Panel className="p-5 space-y-5 bg-transparent border-0">
        {/* KPI & Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Stat className="bg-[#0e121b] border border-white/5 rounded-xl p-3.5">
            <Stat.Content>
              <Stat.Label className="text-xs text-[#a0aec0]">
                {t('Operating Cash Balance', 'Операционный остаток')}
              </Stat.Label>
              <Stat.Value size="sm" className="text-white font-mono font-bold mt-1">
                ${operatingBalance.toFixed(2)} <span className="text-xs text-[#6ee9ff]">USDC</span>
              </Stat.Value>
            </Stat.Content>
          </Stat>

          <Stat className="bg-[#0e121b] border border-white/5 rounded-xl p-3.5">
            <Stat.Content>
              <Stat.Label className="text-xs text-[#a0aec0]">
                {t('Operating Liquidity Floor', 'Ликвидный резерв')}
              </Stat.Label>
              <Stat.Value size="sm" className="text-white font-mono font-bold mt-1">
                ${reserveFloor.toFixed(2)} <span className="text-xs text-[#718096]">HOLD</span>
              </Stat.Value>
            </Stat.Content>
          </Stat>

          <Kpi surface color="success" className="bg-[#10b981]/10 border border-[#10b981]/25 rounded-xl p-3.5">
            <Kpi.Header>
              <Kpi.Title className="text-xs text-[#10b981] font-semibold">
                {t('Sweepable Idle Surplus', 'Излишек для свипа')}
              </Kpi.Title>
            </Kpi.Header>
            <Kpi.Content className="mt-1">
              <Kpi.Value className="text-lg font-mono font-bold text-white">
                ${sweepable.toFixed(2)} <span className="text-xs text-[#10b981]">USDC</span>
              </Kpi.Value>
              <Kpi.Trend value={8.4} className="text-xs font-mono font-semibold" />
            </Kpi.Content>
          </Kpi>
        </div>

        {/* Reserve Floor Slider */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-white font-medium">
              <Sliders className="size-3.5 text-[#6ee9ff]" />
              {t('Keep in Operating Buffer (Suppliers & Refunds)', 'Буфер на закупку товаров и возвраты')}
            </span>
            <span className="font-mono text-[#6ee9ff] font-bold">${reserveFloor.toFixed(0)} USDC</span>
          </div>
          <input
            type="range"
            min="10"
            max="150"
            step="5"
            value={reserveFloor}
            onChange={(e) => setReserveFloor(Number(e.target.value))}
            className="w-full accent-[#10b981] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[#4a5568] font-mono">
            <span>$10 min buffer</span>
            <span>$150 conservative</span>
          </div>
        </div>

        {/* Auto-Sweep Policy Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0e121b] border border-white/5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-5 text-[#10b981]" />
            <div>
              <p className="text-xs font-semibold text-white">
                {t('Continuous Autonomous Sweeping', 'Автоматический свип при продажах')}
              </p>
              <p className="text-[11px] text-[#718096]">
                {t('Surplus above floor sweeps instantly into Morpho Blue @ 8.4% APY', 'Излишки выше порога сразу уходят в Morpho Blue под 8.4% APY')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAutoSweep(!autoSweep)}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              autoSweep ? 'bg-[#10b981]' : 'bg-white/20'
            }`}
          >
            <div
              className={`size-5 rounded-full bg-white transition-transform ${
                autoSweep ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Action Button */}
        <div>
          <button
            type="button"
            disabled={sweepable <= 0 || loading}
            onClick={handleSweep}
            className={`w-full py-3 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
              sweepable > 0 && !loading
                ? 'bg-gradient-to-r from-[#10b981] to-[#059669] text-white hover:brightness-110 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                : 'bg-white/5 text-[#4a5568] cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="size-3.5 animate-spin" />
                {t('Sweeping via Arc Mainnet…', 'Исполняем свип в Arc Mainnet…')}
              </>
            ) : sweepable > 0 ? (
              <>
                <Zap className="size-3.5" />
                {t(`Sweep $${sweepable.toFixed(2)} USDC to Morpho (Est. +$${annualYieldEstimate}/yr)`, `Свипнуть $${sweepable.toFixed(2)} USDC в Morpho (+~$${annualYieldEstimate}/год)`)}
                <ArrowRight className="size-3.5 ml-1" />
              </>
            ) : (
              t('Reserve Floor Intact — No Idle Capital to Sweep', 'Резервный буфер соблюден — свободных средств нет')
            )}
          </button>
        </div>

        {/* Last Receipt Notification */}
        {lastReceipt && (
          <div className="p-3 rounded-xl bg-[#10b981]/10 border border-[#10b981]/30 flex items-start gap-2.5 text-xs text-[#10b981]">
            <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-white">
                {t(`Swept $${lastReceipt.amountSwept.toFixed(2)} USDC successfully at ${lastReceipt.timestamp}`, `Успешно переведено $${lastReceipt.amountSwept.toFixed(2)} USDC в ${lastReceipt.timestamp}`)}
              </p>
              <p className="font-mono text-[10px] text-[#6ee9ff] break-all">
                tx: {lastReceipt.txHash}
              </p>
            </div>
          </div>
        )}
      </Frame.Panel>
    </Frame>
  );
}
