import { NextResponse } from 'next/server';

export interface CrosschainRoute {
  sourceChain: string;
  sourceChainName: string;
  sourceChainId: string | number;
  protocol: string;
  estimatedSeconds: number;
  gasCostEstimatedUsd: number;
  bridgeFeeUsdc: number;
  minAmountUsdc: number;
  maxAmountUsdc: number;
  bridgeUrl: string;
  recommended: boolean;
}

const SUPPORTED_ROUTES: Record<string, CrosschainRoute> = {
  base: {
    sourceChain: 'base',
    sourceChainName: 'Base Mainnet',
    sourceChainId: 8453,
    protocol: 'Circle CCTP V2',
    estimatedSeconds: 30,
    gasCostEstimatedUsd: 0.02,
    bridgeFeeUsdc: 0.05,
    minAmountUsdc: 5,
    maxAmountUsdc: 50000,
    bridgeUrl: 'https://bridge.arc.network',
    recommended: true,
  },
  arbitrum: {
    sourceChain: 'arbitrum',
    sourceChainName: 'Arbitrum One',
    sourceChainId: 42161,
    protocol: 'Circle CCTP V2',
    estimatedSeconds: 40,
    gasCostEstimatedUsd: 0.05,
    bridgeFeeUsdc: 0.05,
    minAmountUsdc: 5,
    maxAmountUsdc: 50000,
    bridgeUrl: 'https://bridge.arc.network',
    recommended: false,
  },
  solana: {
    sourceChain: 'solana',
    sourceChainName: 'Solana Mainnet',
    sourceChainId: 'solana-mainnet',
    protocol: 'Circle CCTP V2 / Wormhole',
    estimatedSeconds: 75,
    gasCostEstimatedUsd: 0.01,
    bridgeFeeUsdc: 0.15,
    minAmountUsdc: 10,
    maxAmountUsdc: 25000,
    bridgeUrl: 'https://bridge.arc.network',
    recommended: false,
  },
  ethereum: {
    sourceChain: 'ethereum',
    sourceChainName: 'Ethereum Mainnet',
    sourceChainId: 1,
    protocol: 'Circle CCTP V2 Native',
    estimatedSeconds: 120,
    gasCostEstimatedUsd: 1.80,
    bridgeFeeUsdc: 0.50,
    minAmountUsdc: 50,
    maxAmountUsdc: 100000,
    bridgeUrl: 'https://bridge.arc.network',
    recommended: false,
  },
  polygon: {
    sourceChain: 'polygon',
    sourceChainName: 'Polygon PoS',
    sourceChainId: 137,
    protocol: 'Circle CCTP V2',
    estimatedSeconds: 50,
    gasCostEstimatedUsd: 0.03,
    bridgeFeeUsdc: 0.05,
    minAmountUsdc: 5,
    maxAmountUsdc: 25000,
    bridgeUrl: 'https://bridge.arc.network',
    recommended: false,
  },
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const source = searchParams.get('source') || 'base';
  const amountStr = searchParams.get('amount') || '50';
  const targetWallet = searchParams.get('destination_wallet') || '';

  const amount = parseFloat(amountStr) || 50;
  const route = SUPPORTED_ROUTES[source.toLowerCase()] || SUPPORTED_ROUTES.base;

  const netReceived = Math.max(0, amount - route.bridgeFeeUsdc);

  return NextResponse.json({
    destinationChain: 'Arc Mainnet',
    destinationChainId: 5042,
    destinationWallet: targetWallet || '0x0000000000000000000000000000000000000000',
    requestedAmountUsdc: amount,
    netReceivedUsdc: netReceived,
    route,
    supportedChains: Object.values(SUPPORTED_ROUTES).map((r) => ({
      id: r.sourceChain,
      name: r.sourceChainName,
      recommended: r.recommended,
      estimatedSeconds: r.estimatedSeconds,
    })),
  });
}
