import { NextResponse } from 'next/server';
import { TG_CATALOG_PRODUCTS } from '@/components/telegram/tg-products';
import { evaluatePolicy } from '@/lib/policy';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tool, params = {} } = body;

    if (!tool) {
      return NextResponse.json({ error: 'Missing "tool" field' }, { status: 400 });
    }

    // ── Tool 1: mercenta_catalog ──
    if (tool === 'mercenta_catalog') {
      const { category, query, max_price_usdc } = params;
      let items = TG_CATALOG_PRODUCTS.map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        categoryLabel: p.categoryLabel,
        description: p.shortDesc,
        region: p.region,
        instantDelivery: p.instantDelivery,
        availableDenominations: p.denominations.map((d) => d.priceUsdc),
        minPriceUsdc: Math.min(...p.denominations.map((d) => d.priceUsdc)),
        maxPriceUsdc: Math.max(...p.denominations.map((d) => d.priceUsdc)),
        supplierSlaPercent: 99.8,
        grossMarginFloorPercent: 15.0,
      }));

      if (category && category !== 'all') {
        const catMap: Record<string, string> = {
          gaming: 'gaming',
          streaming: 'subscriptions',
          compute: 'compute',
          tokens: 'developer',
          donations: 'microdonations',
        };
        const target = catMap[category] || category;
        items = items.filter((i) => i.category === target);
      }

      if (query) {
        const q = String(query).toLowerCase();
        items = items.filter((i) => i.name.toLowerCase().includes(q) || i.brand.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
      }

      if (typeof max_price_usdc === 'number' && max_price_usdc > 0) {
        items = items.filter((i) => i.minPriceUsdc <= max_price_usdc);
      }

      return NextResponse.json({
        total: items.length,
        network: 'Arc Mainnet (5042)',
        settlementCurrency: 'USDC',
        items,
      });
    }

    // ── Tool 2: mercenta_quote ──
    if (tool === 'mercenta_quote') {
      const { product_id, denomination_usdc, max_slippage_bps = 50 } = params;
      const product = TG_CATALOG_PRODUCTS.find((p) => p.id === product_id);

      if (!product) {
        return NextResponse.json({ error: `Product "${product_id}" not found in catalog` }, { status: 404 });
      }

      const amount = Number(denomination_usdc);
      if (!amount || amount <= 0) {
        return NextResponse.json({ error: 'Invalid denomination_usdc' }, { status: 400 });
      }

      // Calculate wholesale cost (approx 82% of face value -> ~18% gross margin)
      const supplierCost = Math.round(amount * 0.82 * 100) / 100;
      const platformFee = Math.round(amount * 0.02 * 100) / 100;
      const grossMargin = (amount - supplierCost) / amount;

      // Run 5-Gate Policy evaluation
      const policyRes = evaluatePolicy(amount, supplierCost, 'verified');

      const quoteId = `q_arc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const cleared = policyRes.decision === 'Cleared';
      const needEscalation = policyRes.decision === 'Human approval required';

      return NextResponse.json({
        quoteId,
        productId: product.id,
        productName: product.name,
        amountUsdc: amount,
        supplierCostUsdc: supplierCost,
        platformFeeUsdc: platformFee,
        grossMarginPercent: Number((grossMargin * 100).toFixed(1)),
        decision: cleared ? 'CLEARED' : needEscalation ? 'REQUIRE_ESCALATION' : 'BLOCKED',
        maxSlippageBps: max_slippage_bps,
        gates: {
          spendCapPassed: amount <= 1000,
          reserveFloorPassed: true,
          marginFloorPassed: grossMargin >= 0.15,
          supplierVerified: true,
          autoApproved: amount <= 100,
        },
        policyVersion: '5-Gate Policy Engine v0.3',
        settlementChain: 'Arc Mainnet (5042)',
        expiresAt: Date.now() + 15 * 60 * 1000, // 15 min quote validity
      });
    }

    // ── Tool 3: mercenta_checkout ──
    if (tool === 'mercenta_checkout') {
      const { quote_id, recipient_address, auto_claim = true } = params;

      if (!quote_id) {
        return NextResponse.json({ error: 'Missing quote_id' }, { status: 400 });
      }

      const orderId = `mct_ord_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const fakeTxHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      const voucherCode = auto_claim ? `MCT-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}` : undefined;

      return NextResponse.json({
        orderId,
        quoteId: quote_id,
        status: 'SETTLED',
        txHash: fakeTxHash,
        arcscanUrl: `https://arcscan.app/tx/${fakeTxHash}`,
        contract: '0x06B6F77626F22e379D55836F3851B5A24ebFF3Ed',
        recipient: recipient_address || 'caller',
        voucherCode,
        deliveryMethod: 'instant_onchain_event',
        receiptSha256: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        timestamp: new Date().toISOString(),
      });
    }

    // ── Tool 4: mercenta_treasury_sweep ──
    if (tool === 'mercenta_treasury_sweep') {
      const { reserve_floor_usdc = 50.0, vault_id = 'galaxy-usdc', simulate_only = false } = params;

      // Sample simulated treasury numbers
      const totalBalanceUsdc = 125.0; // Current sample merchant balance
      const sweepableAmount = Math.max(0, totalBalanceUsdc - Number(reserve_floor_usdc));

      if (sweepableAmount <= 0) {
        return NextResponse.json({
          status: 'NO_IDLE_FUNDS',
          totalBalanceUsdc,
          reserveFloorUsdc: Number(reserve_floor_usdc),
          amountSweptUsdc: 0,
          message: 'Operating balance does not exceed configured reserve floor. No sweep needed.',
        });
      }

      const txHash = !simulate_only ? `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}` : undefined;

      return NextResponse.json({
        status: simulate_only ? 'SIMULATED' : 'SWEPT',
        amountSweptUsdc: sweepableAmount,
        operatingBalanceRemainingUsdc: Number(reserve_floor_usdc),
        targetVault: vault_id === 'galaxy-usdc' ? 'Morpho Blue / Galaxy USDC Vault (Arc 5042)' : vault_id,
        netApyPercent: '8.4%',
        vaultAddress: '0x32A44B04C8567dB1a613271167E1402CeF5E8c1b',
        txHash,
        arcscanUrl: txHash ? `https://arcscan.app/tx/${txHash}` : null,
        timestamp: new Date().toISOString(),
      });
    }

    // ── Tool 5: mercenta_crosschain_topup ──
    if (tool === 'mercenta_crosschain_topup') {
      const { source_chain = 'base', amount_usdc = 50.0, arc_destination_wallet } = params;

      if (!arc_destination_wallet) {
        return NextResponse.json({ error: 'arc_destination_wallet address is required' }, { status: 400 });
      }

      const chainInfo: Record<string, { protocol: string; timeSec: number; fee: number }> = {
        base: { protocol: 'CCTP V2 (Burn-and-Mint)', timeSec: 45, fee: 0.15 },
        arbitrum: { protocol: 'CCTP V2', timeSec: 40, fee: 0.20 },
        solana: { protocol: 'CCTP V2 / Wormhole Gateway', timeSec: 90, fee: 0.35 },
        ethereum: { protocol: 'CCTP V2 Native', timeSec: 120, fee: 1.50 },
        polygon: { protocol: 'CCTP V2', timeSec: 60, fee: 0.10 },
      };

      const info = chainInfo[source_chain.toLowerCase()] || chainInfo.base;

      return NextResponse.json({
        sourceChain: source_chain.toUpperCase(),
        destinationChain: 'Arc Mainnet (5042)',
        destinationWallet: arc_destination_wallet,
        requestedAmountUsdc: Number(amount_usdc),
        estimatedNetReceivedUsdc: Number(amount_usdc) - info.fee,
        bridgeFeeUsdc: info.fee,
        protocol: info.protocol,
        estimatedSeconds: info.timeSec,
        bridgeDepositAddress: '0x0000000000000000000000000000000000000000', // Router smart contract or CCTP relayer
        bridgeUrl: 'https://bridge.arc.network',
        instructions: `Transfer ${amount_usdc} USDC on ${source_chain.toUpperCase()} using CCTP V2. Funds mint natively on Arc at ${arc_destination_wallet}.`,
      });
    }

    return NextResponse.json({ error: `Unknown tool: ${tool}` }, { status: 400 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Aomi tool execution error', details: errorMsg }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
