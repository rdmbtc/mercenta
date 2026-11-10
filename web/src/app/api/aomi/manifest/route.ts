import { NextResponse } from 'next/server';

export async function GET() {
  const manifest = {
    schema_version: 'v1',
    id: 'mercenta-commerce',
    name: 'Mercenta Commerce & Treasury',
    version: '1.0.0',
    description: 'Autonomous digital goods & API vouchers checkout engine on Arc Network with 5-Gate deterministic policy guardrails and automated treasury yield sweeping.',
    icon_url: 'https://mercenta.xyz/mercenta-logo.png',
    homepage: 'https://mercenta.xyz',
    contact_email: 'hello@mercenta.xyz',
    chains: [5042],
    settlement_currency: 'USDC',
    contract_addresses: {
      arc_mainnet: {
        checkout: '0x06b67adf8d63c8c35a6beda42a3bb93d485af3ed',
        settlement_vault: '0x58863e4a739da0e62c2eba258b7783e95d5c48ce'
      }
    },
    tools: [
      {
        name: 'mercenta_catalog',
        description: 'Query wholesale digital goods, gaming vouchers, streaming subscriptions, and AI compute tokens on Arc Network.',
        parameters: {
          type: 'object',
          properties: {
            category: { type: 'string', enum: ['gaming', 'streaming', 'compute', 'tokens', 'donations', 'all'] },
            query: { type: 'string', description: 'Filter search term' },
            max_price_usdc: { type: 'number', description: 'Maximum price in USDC' }
          }
        }
      },
      {
        name: 'mercenta_quote',
        description: 'Evaluate order feasibility against the 5-Gate Policy Engine (margin floor, auto-approval cap, spend velocity) before committing funds.',
        parameters: {
          type: 'object',
          required: ['product_id', 'denomination_usdc'],
          properties: {
            product_id: { type: 'string' },
            denomination_usdc: { type: 'number' },
            max_slippage_bps: { type: 'number', default: 50 }
          }
        }
      },
      {
        name: 'mercenta_checkout',
        description: 'Atomically execute checkout on Arc Mainnet, paying 6-decimal USDC with instant digital voucher delivery.',
        parameters: {
          type: 'object',
          required: ['quote_id'],
          properties: {
            quote_id: { type: 'string' },
            recipient_address: { type: 'string' },
            auto_claim: { type: 'boolean', default: true }
          }
        }
      },
      {
        name: 'mercenta_treasury_sweep',
        description: 'Sweep idle merchant treasury balance above operational reserve floor into Morpho Blue / USYC yield vaults on Arc.',
        parameters: {
          type: 'object',
          properties: {
            reserve_floor_usdc: { type: 'number', default: 50.0 },
            vault_id: { type: 'string', default: 'galaxy-usdc' },
            simulate_only: { type: 'boolean', default: false }
          }
        }
      },
      {
        name: 'mercenta_crosschain_topup',
        description: 'Calculate multi-chain bridge and liquidity top-up route to fund Arc wallet from Base, Solana, or Arbitrum.',
        parameters: {
          type: 'object',
          required: ['source_chain', 'amount_usdc', 'arc_destination_wallet'],
          properties: {
            source_chain: { type: 'string', enum: ['base', 'solana', 'arbitrum', 'ethereum', 'polygon'] },
            amount_usdc: { type: 'number' },
            arc_destination_wallet: { type: 'string' }
          }
        }
      }
    ]
  };

  return NextResponse.json(manifest, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
