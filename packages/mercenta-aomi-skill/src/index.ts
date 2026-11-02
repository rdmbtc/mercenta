/**
 * Mercenta Aomi Skill Client SDK
 * Autonomous commerce & treasury execution on Arc Network (Chain 5042)
 */

export interface MercentaCatalogItem {
  id: string;
  name: string;
  category: string;
  description: string;
  availableDenominations: number[];
  supplierSlaPercent: number;
  grossMarginFloorPercent: number;
}

export interface MercentaQuoteResult {
  quoteId: string;
  productId: string;
  amountUsdc: number;
  supplierCostUsdc: number;
  platformFeeUsdc: number;
  grossMarginPercent: number;
  decision: 'CLEARED' | 'BLOCKED' | 'REQUIRE_ESCALATION';
  reason?: string;
  gates: {
    spendCapPassed: boolean;
    reserveFloorPassed: boolean;
    marginFloorPassed: boolean;
    supplierVerified: boolean;
    autoApproved: boolean;
  };
  expiresAt: number;
}

export interface MercentaCheckoutResult {
  orderId: string;
  status: 'SETTLED' | 'PENDING';
  txHash: string;
  arcscanUrl: string;
  amountUsdc: number;
  voucherCode?: string;
  receiptSha256: string;
}

export interface MercentaTreasurySweepResult {
  status: 'SWEPT' | 'SIMULATED' | 'NO_IDLE_FUNDS';
  amountSweptUsdc: number;
  operatingBalanceRemainingUsdc: number;
  targetVault: string;
  netApyPercent: string;
  txHash?: string;
}

export interface MercentaCrosschainTopupResult {
  sourceChain: string;
  depositAddress: string;
  destinationChain: 'Arc Mainnet (5042)';
  destinationWallet: string;
  protocol: 'CCTP V2' | 'LiFi' | 'Across';
  estimatedSeconds: number;
  feeUsdc: number;
  bridgeUrl: string;
}

export class MercentaAomiClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'https://mercenta.xyz') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async getCatalog(options?: { category?: string; query?: string; maxPriceUsdc?: number }): Promise<MercentaCatalogItem[]> {
    const params = new URLSearchParams();
    if (options?.category) params.set('category', options.category);
    if (options?.query) params.set('query', options.query);
    if (options?.maxPriceUsdc) params.set('max_price', String(options.maxPriceUsdc));

    const res = await fetch(`${this.baseUrl}/api/aomi/tools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: 'mercenta_catalog', params: options || {} }),
    });
    if (!res.ok) throw new Error(`Catalog lookup failed: ${res.statusText}`);
    return res.json();
  }

  async getQuote(productId: string, denominationUsdc: number, maxSlippageBps: number = 50): Promise<MercentaQuoteResult> {
    const res = await fetch(`${this.baseUrl}/api/aomi/tools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'mercenta_quote',
        params: { product_id: productId, denomination_usdc: denominationUsdc, max_slippage_bps: maxSlippageBps },
      }),
    });
    if (!res.ok) throw new Error(`Quote calculation failed: ${res.statusText}`);
    return res.json();
  }

  async checkout(quoteId: string, recipientAddress?: string, autoClaim: boolean = true): Promise<MercentaCheckoutResult> {
    const res = await fetch(`${this.baseUrl}/api/aomi/tools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'mercenta_checkout',
        params: { quote_id: quoteId, recipient_address: recipientAddress, auto_claim: autoClaim },
      }),
    });
    if (!res.ok) throw new Error(`Checkout failed: ${res.statusText}`);
    return res.json();
  }

  async sweepTreasury(reserveFloorUsdc: number = 50.0, vaultId: string = 'galaxy-usdc', simulateOnly: boolean = false): Promise<MercentaTreasurySweepResult> {
    const res = await fetch(`${this.baseUrl}/api/aomi/tools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'mercenta_treasury_sweep',
        params: { reserve_floor_usdc: reserveFloorUsdc, vault_id: vaultId, simulate_only: simulateOnly },
      }),
    });
    if (!res.ok) throw new Error(`Treasury sweep failed: ${res.statusText}`);
    return res.json();
  }

  async getCrosschainTopup(sourceChain: string, amountUsdc: number, arcDestinationWallet: string): Promise<MercentaCrosschainTopupResult> {
    const res = await fetch(`${this.baseUrl}/api/aomi/tools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'mercenta_crosschain_topup',
        params: { source_chain: sourceChain, amount_usdc: amountUsdc, arc_destination_wallet: arcDestinationWallet },
      }),
    });
    if (!res.ok) throw new Error(`Cross-chain topup calculation failed: ${res.statusText}`);
    return res.json();
  }
}
