import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    protocol: 'x402',
    version: '2.0',
    title: 'Mercenta Circle Agent Stack x402 Micropayment Gateway',
    network: 'Arc Mainnet',
    chainId: 5042,
    settlementToken: 'USDC',
    decimals: 6,
    tokenAddress: '0x3600000000000000000000000000000000000000',
    checkoutContract: '0x06b67adf8d63c8c35a6beda42a3bb93d485af3ed',
    circleStack: {
      batching: '@circle-fin/x402-batching',
      gateway: 'Circle Gateway V2',
      cctp: 'Iris Attestation V2',
      wallets: 'Circle Developer & User-Controlled MPC'
    },
    policyEngine: {
      steps: 5,
      checks: [
        'available_spend_cap',
        'reserved_liquidity_floor',
        'gross_margin_floor_1500bps',
        'catalog_sla_verification',
        'auto_approval_limit_with_escalation'
      ],
      grossMarginFloorBps: 1500
    },
    endpoints: {
      info: 'https://mainnet.mercenta.xyz/api/x402/info',
      order: 'https://mainnet.mercenta.xyz/api/x402/order',
      catalog: 'https://mainnet.mercenta.xyz/api/catalog'
    }
  });
}
