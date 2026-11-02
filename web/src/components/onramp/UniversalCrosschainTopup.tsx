'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Check, ExternalLink, ShieldCheck, Zap, RefreshCw, Clock, X } from 'lucide-react';
import { Frame } from '@/components/panelui/frame';
import { Stat } from '@/components/panelui/stat';

interface UniversalCrosschainTopupProps {
  destinationWallet?: string | null;
  onClose?: () => void;
  ru?: boolean;
}

const CHAINS = [
  { id: 'base', name: 'Base', badge: 'Recommended', time: '30s', fee: '$0.05', icon: '🔵' },
  { id: 'arbitrum', name: 'Arbitrum', badge: 'Fast', time: '40s', fee: '$0.05', icon: '🔷' },
  { id: 'solana', name: 'Solana', badge: 'Popular', time: '75s', fee: '$0.15', icon: '🟣' },
  { id: 'polygon', name: 'Polygon', badge: 'Low Fee', time: '50s', fee: '$0.05', icon: '💜' },
  { id: 'ethereum', name: 'Ethereum', badge: 'Mainnet', time: '2m', fee: '$0.50', icon: '⬛' },
];

export function UniversalCrosschainTopup({
  destinationWallet,
  onClose,
  ru = false,
}: UniversalCrosschainTopupProps) {
  const t = (en: string, russian: string) => (ru ? russian : en);

  const [selectedChain, setSelectedChain] = useState('base');
  const [amount, setAmount] = useState('50');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<{
    netReceivedUsdc: number;
    protocol: string;
    estimatedSeconds: number;
    bridgeUrl: string;
  } | null>(null);

  const targetAddress = destinationWallet || '0x9ED914F8C356FE8C3673fB5760F8014EAE6f2B55';

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/liquidity/crosschain-quote?source=${selectedChain}&amount=${amount}&destination_wallet=${targetAddress}`)
      .then((r) => r.json())
      .then((data) => {
        if (active) {
          setQuote({
            netReceivedUsdc: data.netReceivedUsdc,
            protocol: data.route.protocol,
            estimatedSeconds: data.route.estimatedSeconds,
            bridgeUrl: data.route.bridgeUrl,
          });
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedChain, amount, targetAddress]);

  function copyAddress() {
    navigator.clipboard.writeText(targetAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const currentChainObj = CHAINS.find((c) => c.id === selectedChain) || CHAINS[0];

  return (
    <Frame variant="band" className="w-full bg-[#0a0d14] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      <Frame.Header className="px-5 py-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-[#6ee9ff]/15 border border-[#6ee9ff]/30 flex items-center justify-center text-[#6ee9ff]">
            <Zap className="size-4" />
          </div>
          <div>
            <Frame.Title as="h3" className="text-sm font-bold text-white tracking-wide">
              {t('Universal Multi-Chain Top-Up', 'Универсальное мультичейн-пополнение')}
            </Frame.Title>
            <p className="text-[11px] text-[#718096]">
              {t('CCTP V2 & Aomi Cross-Chain Harness to Arc', 'Шлюз CCTP V2 & Aomi прямо в Arc')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#6ee9ff]/10 text-[#6ee9ff] border border-[#6ee9ff]/20 font-semibold">
            Native Mint
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 text-[#a0aec0] hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </Frame.Header>

      <Frame.Panel className="p-5 space-y-4 bg-transparent border-0">
        {/* Source Network Selector */}
        <div>
          <label className="text-xs text-[#a0aec0] font-medium block mb-2">
            {t('Select Source Network', 'Выберите сеть отправки USDC')}
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {CHAINS.map((chain) => {
              const active = selectedChain === chain.id;
              return (
                <button
                  key={chain.id}
                  type="button"
                  onClick={() => setSelectedChain(chain.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    active
                      ? 'bg-[#10b981]/15 border-[#10b981]/50 text-white shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                      : 'bg-[#0e121b] border-white/5 text-[#718096] hover:border-white/15 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>{chain.icon}</span>
                    <span className="text-[9px] font-mono text-[#10b981]">{chain.fee}</span>
                  </div>
                  <span className="text-xs font-bold mt-1 text-white">{chain.name}</span>
                  <span className="text-[10px] text-[#718096]">{chain.time}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <div className="flex items-center justify-between text-xs text-[#a0aec0] font-medium mb-1.5">
            <span>{t('Amount to Bridge', 'Сумма перевода')}</span>
            <span className="text-[#6ee9ff] font-mono">{currentChainObj.name} USDC</span>
          </div>
          <div className="relative">
            <input
              type="number"
              min="5"
              step="5"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[#0e121b] border border-white/10 rounded-xl px-4 py-2.5 font-mono text-base font-bold text-white focus:outline-none focus:border-[#10b981]"
            />
            <span className="absolute right-4 top-3 text-xs font-mono text-[#a0aec0]">USDC</span>
          </div>
          <div className="flex gap-2 mt-2">
            {['25', '50', '100', '250'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset)}
                className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition-all ${
                  amount === preset
                    ? 'bg-[#10b981]/20 border-[#10b981] text-[#10b981]'
                    : 'bg-white/5 border-white/5 text-[#a0aec0] hover:text-white'
                }`}
              >
                ${preset}
              </button>
            ))}
          </div>
        </div>

        {/* Quote & Route Details */}
        <div className="grid grid-cols-2 gap-3">
          <Stat className="bg-[#0e121b] border border-white/5 rounded-xl p-3">
            <Stat.Content>
              <Stat.Label className="text-xs text-[#a0aec0]">
                {t('You Receive on Arc', 'Вы получите на Arc')}
              </Stat.Label>
              <Stat.Value size="sm" className="text-[#10b981] font-mono font-bold mt-1">
                ${quote ? quote.netReceivedUsdc.toFixed(2) : (Number(amount) - 0.05).toFixed(2)}{' '}
                <span className="text-xs">USDC</span>
              </Stat.Value>
            </Stat.Content>
            <Stat.Badge>1:1 Native</Stat.Badge>
          </Stat>

          <Stat className="bg-[#0e121b] border border-white/5 rounded-xl p-3">
            <Stat.Content>
              <Stat.Label className="text-xs text-[#a0aec0]">
                {t('Estimated Time', 'Время зачисления')}
              </Stat.Label>
              <Stat.Value size="sm" className="text-white font-mono font-bold mt-1 flex items-center gap-1.5">
                <Clock className="size-3.5 text-[#6ee9ff]" />
                ~{quote ? quote.estimatedSeconds : 30}s
              </Stat.Value>
            </Stat.Content>
            <Stat.Badge>{quote ? quote.protocol : 'CCTP V2'}</Stat.Badge>
          </Stat>
        </div>

        {/* Target Destination Wallet */}
        <div className="p-3.5 rounded-xl bg-[#0e121b] border border-white/5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[#a0aec0]">
            <span className="flex items-center gap-1 text-white font-medium">
              <ShieldCheck className="size-3.5 text-[#10b981]" />
              {t('Arc Destination Address (Your Wallet)', 'Адрес получения на Arc (Ваш кошелёк)')}
            </span>
            <span className="text-[10px] font-mono text-[#10b981]">Chain ID: 5042</span>
          </div>
          <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-lg p-2 font-mono text-xs text-white">
            <span className="truncate mr-2">{targetAddress}</span>
            <button
              type="button"
              onClick={copyAddress}
              className="p-1.5 hover:bg-white/10 rounded transition-colors text-[#a0aec0] hover:text-white shrink-0"
              title="Copy Address"
            >
              {copied ? <Check className="size-3.5 text-[#10b981]" /> : <Copy className="size-3.5" />}
            </button>
          </div>
        </div>

        {/* Launch Bridge CTA */}
        <div className="space-y-2 pt-1">
          <a
            href={`https://bridge.arc.network/?from=${selectedChain}&to=arc&amount=${amount}&address=${targetAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-[#10b981] to-[#059669] text-white hover:brightness-110 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
          >
            {loading ? (
              <RefreshCw className="size-3.5 animate-spin" />
            ) : (
              <>
                {t(`Bridge ${amount} USDC from ${currentChainObj.name} to Arc`, `Перевести ${amount} USDC из ${currentChainObj.name} в Arc`)}
                <ExternalLink className="size-3.5" />
              </>
            )}
          </a>
          <p className="text-[11px] text-center text-[#718096]">
            {t(
              'Powered by Circle CCTP V2 burn-and-mint. Zero slippage, 1:1 backed USDC.',
              'На базе Circle CCTP V2 burn-and-mint. Нулевое проскальзывание, 1:1 нативный USDC.'
            )}
          </p>
        </div>
      </Frame.Panel>
    </Frame>
  );
}
