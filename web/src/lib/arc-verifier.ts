// Arc Testnet USDC Payment Verifier — deterministic architecture Standard
// Receipt-based verification with idempotency guard.
// All amounts: BigInt 6-decimal USDC units. Zero floats.

import {
  type Address,
  type Hex,
  type PublicClient,
  decodeEventLog,
  parseAbiItem,
} from "viem";
import { createArcPublicClient, ARC_USDC_ADDRESS } from "./arc";

export interface VerifyPaymentInput {
  txHash: Hex;
  expectedAmountUnits: bigint;
  merchantWallet: Address;
  orderExpiresAt: number; // epoch seconds
  isTxConsumed: (txHash: Hex) => boolean; // idempotency check
}

export type VerifyResult =
  | { outcome: "VALID"; amountUnits: bigint; blockTimestamp: number }
  | { outcome: "UNDERPAID"; actualUnits: bigint; shortfallUnits: bigint }
  | { outcome: "REJECTED"; reason: string };

const TRANSFER_EVENT_ABI = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

/**
 * Verify an on-chain USDC payment on Arc Testnet.
 * Pure validation logic — caller handles DB writes after VALID result.
 */
export async function verifyArcPayment(
  input: VerifyPaymentInput,
  client?: PublicClient,
): Promise<VerifyResult> {
  const c = client ?? createArcPublicClient();

  // Idempotency: reject already-consumed tx
  if (input.isTxConsumed(input.txHash)) {
    return { outcome: "REJECTED", reason: "DUPLICATE_TX_HASH" };
  }

  // Fetch receipt
  let receipt;
  try {
    receipt = await c.getTransactionReceipt({ hash: input.txHash });
  } catch {
    return { outcome: "REJECTED", reason: "RECEIPT_FETCH_FAILED" };
  }

  if (!receipt) {
    return { outcome: "REJECTED", reason: "RECEIPT_NOT_FOUND" };
  }

  // Check tx success
  if (receipt.status !== "success") {
    return { outcome: "REJECTED", reason: "TX_REVERTED" };
  }

  // Check confirmations >= 1
  const headBlock = await c.getBlockNumber();
  const confirmations = headBlock - receipt.blockNumber + 1n;
  if (confirmations < 1n) {
    return { outcome: "REJECTED", reason: "INSUFFICIENT_CONFIRMATIONS" };
  }

  // Find USDC Transfer log to merchant
  const usdcAddrLower = ARC_USDC_ADDRESS.toLowerCase();
  const merchantLower = input.merchantWallet.toLowerCase();

  let transferValue: bigint | null = null;
  for (const log of receipt.logs) {
    if (log.address?.toLowerCase() !== usdcAddrLower) continue;
    try {
      const decoded = decodeEventLog({
        abi: [TRANSFER_EVENT_ABI],
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === "Transfer") {
        const args = decoded.args as { from: Address; to: Address; value: bigint };
        if (args.to.toLowerCase() === merchantLower) {
          transferValue = args.value;
          break;
        }
      }
    } catch {
      // Skip non-Transfer or malformed logs
      continue;
    }
  }

  if (transferValue === null) {
    return { outcome: "REJECTED", reason: "NO_USDC_TRANSFER_TO_MERCHANT" };
  }

  // Check expiry: block timestamp must be <= orderExpiresAt
  const block = await c.getBlock({ blockNumber: receipt.blockNumber });
  const blockTs = Number(block.timestamp);
  if (blockTs > input.orderExpiresAt) {
    return { outcome: "REJECTED", reason: "PAYMENT_AFTER_EXPIRY" };
  }

  // Amount check
  if (transferValue < input.expectedAmountUnits) {
    return {
      outcome: "UNDERPAID",
      actualUnits: transferValue,
      shortfallUnits: input.expectedAmountUnits - transferValue,
    };
  }

  return {
    outcome: "VALID",
    amountUnits: transferValue,
    blockTimestamp: blockTs,
  };
}
