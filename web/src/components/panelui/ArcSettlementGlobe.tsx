'use client';

import { useState } from 'react';
import { Planet } from './planet';
import { Globe, ShieldCheck } from 'lucide-react';

interface ArcSettlementGlobeProps {
  className?: string;
  ru?: boolean;
  compact?: boolean;
  interactive?: boolean;
}

export function ArcSettlementGlobe({
  className = '',
  ru = false,
  compact = false,
  interactive = true,
}: ArcSettlementGlobeProps) {
  const [activeNode, setActiveNode] = useState<string>('us-east');

  const nodes = [
    { id: 'us-east', lat: 38.9, lng: -77.0, label: 'US-East (Virginia)', latency: '11ms', region: 'Americas' },
    { id: 'us-west', lat: 37.4, lng: -122.1, label: 'US-West (Silicon Valley)', latency: '14ms', region: 'Americas' },
    { id: 'london', lat: 51.5, lng: -0.12, label: 'London Gateway', latency: '13ms', region: 'EMEA' },
    { id: 'frankfurt', lat: 50.1, lng: 8.7, label: 'Frankfurt Hub', latency: '16ms', region: 'EMEA' },
    { id: 'singapore', lat: 1.3, lng: 103.8, label: 'Singapore Clearing', latency: '15ms', region: 'APAC' },
    { id: 'tokyo', lat: 35.7, lng: 139.7, label: 'Tokyo Node', latency: '18ms', region: 'APAC' },
  ];

  if (compact) {
    return (
      <div className={`arc-globe-compact flex flex-col items-center gap-3 p-4 rounded-2xl bg-card/60 border border-border/50 text-foreground ${className}`}>
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
            <Globe className="size-3.5 text-sky-400" />
            Arc Chain 5042
          </span>
          <span className="inline-flex items-center gap-1 text-emerald-400 font-mono">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            &lt;25ms
          </span>
        </div>
        <div className="w-full max-w-[200px] aspect-square">
          <Planet defaultRotation={[25, 15]} autoRotate={0.4} interactive={interactive}>
            <Planet.Globe color="info" aria-label="Arc Settlement Network Nodes">
              <Planet.Marker lat={38.9} lng={-77.0} label="US-East" count="11ms" pulse />
              <Planet.Marker lat={50.1} lng={8.7} label="Frankfurt" count="16ms" pulse />
              <Planet.Marker lat={1.3} lng={103.8} label="Singapore" count="15ms" />
            </Planet.Globe>
          </Planet>
        </div>
        <div className="text-[11px] text-muted-foreground text-center">
          {ru ? 'Глобальный многоузловой клиринг USDC' : 'Global multi-region USDC clearance'}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`arc-globe-panel relative flex flex-col items-center rounded-3xl border border-sky-500/20 bg-gradient-to-b from-sky-950/20 via-background to-background p-6 shadow-2xl backdrop-blur-sm ${className}`}
      role="region"
      aria-label="Arc Network Global Settlement Globe"
    >
      {/* Top Status Header */}
      <div className="flex w-full items-center justify-between gap-3 pb-4 border-b border-border/40 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Globe className="size-4" />
          </span>
          <div>
            <div className="font-semibold tracking-wider text-foreground">
              ARC MAINNET · 5042
            </div>
            <div className="text-[11px] text-muted-foreground">
              {ru ? 'Детерминированный шлюз клиринга' : 'Deterministic Settlement Mesh'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {ru ? 'Все узлы активны' : 'Nodes Active'}
          </span>
        </div>
      </div>

      {/* Main Globe Canvas */}
      <div className="my-4 w-full max-w-[340px] aspect-square flex items-center justify-center">
        <Planet
          defaultRotation={[20, 10]}
          autoRotate={0.4}
          interactive={interactive}
          className="size-full"
        >
          <Planet.Globe color="info" aria-label="Arc Network Settlement Hubs">
            {nodes.map((node) => (
              <Planet.Marker
                key={node.id}
                lat={node.lat}
                lng={node.lng}
                label={node.label}
                count={node.latency}
                pulse={node.id === 'us-east' || node.id === 'frankfurt'}
                color="info"
                selected={activeNode === node.id}
                onClick={() => setActiveNode(node.id)}
              />
            ))}
          </Planet.Globe>
          <Planet.Controls />
        </Planet>
      </div>

      {/* Node Metrics & Legend Footer */}
      <div className="mt-2 w-full pt-4 border-t border-border/40">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-xl border border-border/40 bg-card/40 p-2.5">
            <div className="text-[10px] text-muted-foreground tracking-wider uppercase">
              {ru ? 'Задержка' : 'Settlement'}
            </div>
            <div className="mt-0.5 font-bold font-mono text-sky-400">&lt; 18ms</div>
          </div>
          <div className="rounded-xl border border-border/40 bg-card/40 p-2.5">
            <div className="text-[10px] text-muted-foreground tracking-wider uppercase">
              {ru ? 'Валидация' : 'Policy Engine'}
            </div>
            <div className="mt-0.5 font-bold font-mono text-emerald-400">5/5 Passed</div>
          </div>
          <div className="rounded-xl border border-border/40 bg-card/40 p-2.5">
            <div className="text-[10px] text-muted-foreground tracking-wider uppercase">
              {ru ? 'Валюта' : 'Settlement Unit'}
            </div>
            <div className="mt-0.5 font-bold font-mono text-foreground">USDC (Native)</div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground px-1">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="size-3.5 text-sky-400" />
            {ru ? 'Криптографические квитанции' : 'Verifiable cryptographic receipts'}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground/80">
            {nodes.length} {ru ? 'узлов онлайн' : 'hubs online'}
          </span>
        </div>
      </div>
    </div>
  );
}
