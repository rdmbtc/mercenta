// Live Arc Testnet USDC Disburser — deterministic architecture Standard
// Signing client for outbound treasury disbursements. BigInt only, no floats.
// Key sourced exclusively from ARC_DISBURSER_KEY env var. Never hardcoded.

import {
  createWalletClient,
  http,
  parseAbi,
  type WalletClient,
  type TransactionReceipt,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ARC_TESTNET, ARC_USDC_ADDRESS, createArcPublicClient, type ArcPublicClient } from "./arc";

export const DISBURSER_ADDRESS = "0x1dBD2507b68368E10E3d32240E326eaaF063dA6b" as const;

export const ERC20_TRANSFER_ABI = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
]);

export interface DisburseResult {
  txHash: `0x${string}`;
  blockNumber: bigint;
  gasUsed: bigint;
  status: "success" | "reverted";
}

export type DisburseFn = (
  to: `0x${string}`,
  amountUnits: bigint,
  orderId: string,
) => Promise<DisburseResult>;

export interface ArcWalletDeps {
  rpcUrl?: string;
  privateKey?: `0x${string}`;
}

export class ArcWalletError extends Error {
  constructor(
    message: string,
    public readonly detail?: unknown,
  ) {
    super(message);
    this.name = "ArcWalletError";
  }
}

export function resolvePrivateKey(deps?: ArcWalletDeps): `0x${string}` {
  const key = deps?.privateKey ?? process.env.ARC_DISBURSER_KEY;
  if (!key || !key.startsWith("0x")) {
    throw new ArcWalletError(
      "ARC_DISBURSER_KEY not set or invalid. Export a 0x-prefixed 32-byte private key.",
    );
  }
  return key as `0x${string}`;
}

export function createArcWalletClient(deps?: ArcWalletDeps) {
  const key = resolvePrivateKey(deps);
  const account = privateKeyToAccount(key);
  const rpcUrl = deps?.rpcUrl ?? process.env.ARC_RPC_URL;
  return createWalletClient({
    account,
    chain: ARC_TESTNET,
    transport: http(rpcUrl, { timeout: 15_000, retryCount: 2 }),
  });
}

/**
 * Disburse USDC on Arc Testnet. Returns genuine tx receipt.
 * Throws ArcWalletError on revert or missing key.
 */
export async function disburseUsdc(
  to: `0x${string}`,
  amountUnits: bigint,
  orderId: string,
  walletDeps?: ArcWalletDeps,
): Promise<DisburseResult> {
  const wallet = createArcWalletClient(walletDeps);
  const publicClient = createArcPublicClient();

  const hash = await wallet.writeContract({
    chain: ARC_TESTNET,
    address: ARC_USDC_ADDRESS,
    abi: ERC20_TRANSFER_ABI,
    functionName: "transfer",
    args: [to, amountUnits],
  });

  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
    confirmations: 2,
    timeout: 60_000,
  });

  if (receipt.status === "reverted") {
    throw new ArcWalletError(`Disbursement reverted for order ${orderId}`, {
      txHash: hash,
      orderId,
    });
  }

  return {
    txHash: receipt.transactionHash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed,
    status: receipt.status,
  };
}

/** Verify a disbursement receipt matches expectation (for arc-verifier integration). */
export async function verifyDisbursement(
  txHash: `0x${string}`,
  expectedTo: `0x${string}`,
  expectedAmountUnits: bigint,
  publicClient?: ArcPublicClient,
): Promise<boolean> {
  const client = publicClient ?? createArcPublicClient();
  const receipt = await client.getTransactionReceipt({ hash: txHash });
  if (receipt.status !== "success") return false;

  const transferTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
  const log = receipt.logs.find(
    (l) =>
      l.address.toLowerCase() === ARC_USDC_ADDRESS.toLowerCase() &&
      l.topics[0] === transferTopic &&
      l.topics[2]?.toLowerCase() === `0x${expectedTo.slice(2).padStart(64, "0")}`.toLowerCase(),
  );
  if (!log || log.data === undefined) return false;
  const value = BigInt(log.data);
  return value === expectedAmountUnits;
}
