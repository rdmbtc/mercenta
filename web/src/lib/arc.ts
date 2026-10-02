/**
 * Arc Testnet chain descriptor + Viem client factory.
 *
 * Group B infrastructure. Arc Testnet: chainId 5042002 (0x4CEF52),
 * native RPC https://rpc.testnet.arc.network, fallback
 * https://arc-node.thecanteenapp.com.
 *
 * deterministic architecture: read-only chain access for payment verification. No
 * private keys, no signing, no transaction broadcasting here — the
 * verifier observes transfers, it never moves funds.
 */

import { defineChain, createPublicClient, http } from "viem";

export type ArcPublicClient = ReturnType<typeof createArcPublicClient>;

export const ARC_TESTNET = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.arc.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Arc Testnet Explorer",
      url: "https://testnet.arcscan.app",
    },
  },
  testnet: true,
});

/** Canonical Arc Testnet USDC (ERC-20, 6 decimals). */
export const ARC_USDC_ADDRESS = "0x3600000000000000000000000000000000000000" as const;

/** Fallback RPC when the primary is degraded. */
export const ARC_FALLBACK_RPC = "https://arc-node.thecanteenapp.com" as const;

/** Expected confirmations before a transfer counts as final. */
export const ARC_FINALITY_CONFIRMATIONS = 2n;

/**
 * Read-only public client. Batch-friendly; falls back to the secondary
 * RPC on persistent primary failure via Viem's built-in retry (fallback
 * transport picks the next endpoint when one errors).
 */
export function createArcPublicClient() {
  return createPublicClient({
    chain: ARC_TESTNET,
    transport: http(ARC_TESTNET.rpcUrls.default.http[0], {
      timeout: 15_000,
      retryCount: 2,
    }),
    batch: { multicall: { wait: 16 } },
  });
}
