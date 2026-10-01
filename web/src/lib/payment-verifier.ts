/**
 * Arc Testnet USDC on-chain payment verifier (Group B).
 *
 * Deterministic verification of USDC transfers on Arc Testnet
 * (chainId 5042002). Given an order's expected recipient, amount, and
 * time window, this module proves — from chain data only — that a
 * matching transfer exists, is sufficiently confirmed, and returns a
 * typed verdict the order FSM can act on.
 *
 * deterministic architecture constraints honored:
 * - Read-only: never signs, never broadcasts. Verification only.
 * - BigInt-only money: amounts compared as 6-decimal base units.
 * - No LLM authority: every verdict derives from chain state and
 *   explicit parameters; nothing model-shaped here.
 */

import { parseAbi, type PublicClient, type Address } from "viem";
import { ARC_USDC_ADDRESS, ARC_FINALITY_CONFIRMATIONS } from "./arc";

/** Minimal ERC-20 Transfer event ABI slice for log filtering. */
const ERC20_TRANSFER_ABI = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
] as const);

const TRANSFER_EVENT = ERC20_TRANSFER_ABI[0];

/** Approximate Arc block time (ms) used only to bound the log scan. */
const BLOCK_TIME_MS = 2_000n;

export interface PaymentExpectation {
  /** Merchant settlement address (order's expected recipient). */
  readonly recipient: Address;
  /** Expected amount in 6-decimal base units (BigInt, never float). */
  readonly amountBaseUnits: bigint;
  /** Order creation time — search window start (inclusive), UNIX ms. */
  readonly windowStartMs: number;
  /** Payment deadline — search window end (inclusive), UNIX ms. */
  readonly windowEndMs: number;
  /** Payer address if known (restricts matching; optional). */
  readonly from?: Address;
}

export interface VerifiedTransfer {
  /** Transaction hash of the matching transfer. */
  readonly txHash: `0x${string}`;
  /** Block number the transfer was mined in. */
  readonly blockNumber: bigint;
  /** Transferred value in base units. */
  readonly valueBaseUnits: bigint;
  /** Payer address. */
  readonly from: Address;
  /** Recipient address. */
  readonly to: Address;
  /** Block timestamp (seconds) of the transfer block. */
  readonly blockTimestampSec: bigint;
  /** Confirmations observed at verification time (head - block + 1). */
  readonly confirmations: bigint;
  /** Log index of the Transfer event within its block. */
  readonly logIndex: number;
}

export type PaymentVerdict =
  | { kind: "CONFIRMED"; transfer: VerifiedTransfer }
  | { kind: "DETECTED"; transfer: VerifiedTransfer }
  | { kind: "UNDERPAID"; transfer: VerifiedTransfer; shortfallBaseUnits: bigint }
  | { kind: "OVERPAID_ANOMALY"; transfer: VerifiedTransfer; excessBaseUnits: bigint }
  | { kind: "NOT_FOUND" };

export class PaymentVerificationError extends Error {
  constructor(
    message: string,
    readonly detail?: unknown,
  ) {
    super(message);
    this.name = "PaymentVerificationError";
  }
}

interface RawTransferLog {
  transactionHash: `0x${string}`;
  blockNumber: bigint | null;
  logIndex: number | null;
  removed?: boolean;
  args: { from: Address; to: Address; value: bigint };
}

/**
 * Verify a payment expectation against Arc Testnet chain state.
 *
 * Strategy: bound the scan by block range derived from the time window
 * (padded 25% each side so timestamp edges never exclude a real
 * payment), pull USDC Transfer logs to the recipient, fetch block
 * timestamps for candidates, window-filter by timestamp, then pick the
 * best candidate deterministically: exact amount first, then highest
 * value, then earliest (blockNumber, logIndex).
 */
export async function verifyUsdcPayment(
  client: PublicClient,
  expectation: PaymentExpectation,
): Promise<PaymentVerdict> {
  if (expectation.windowEndMs < expectation.windowStartMs) {
    throw new PaymentVerificationError(
      `Invalid payment window: end ${expectation.windowEndMs} before start ${expectation.windowStartMs}`,
    );
  }
  if (expectation.amountBaseUnits <= 0n) {
    throw new PaymentVerificationError(
      `Expected amount must be positive, got ${expectation.amountBaseUnits.toString()}`,
    );
  }

  const head = await client.getBlockNumber().catch((err: unknown) => {
    throw new PaymentVerificationError("Failed to read chain head", err);
  });

  const windowMs = BigInt(expectation.windowEndMs - expectation.windowStartMs);
  const spanBlocks = (windowMs * 125n) / 100n / BLOCK_TIME_MS + 1n;
  const toBlock = head;
  const fromBlock = head > spanBlocks ? head - spanBlocks : 0n;

  const rawLogs = await client
    .getLogs({
      address: ARC_USDC_ADDRESS,
      event: TRANSFER_EVENT,
      args: {
        to: expectation.recipient,
        ...(expectation.from ? { from: expectation.from } : {}),
      },
      fromBlock,
      toBlock,
    })
    .catch((err: unknown) => {
      throw new PaymentVerificationError("USDC Transfer log scan failed", err);
    });

  // Normalize; drop reorged-out, unmined, zero-value, and wrong-payer
  // logs. The payer check is defensive: real RPCs honor args.from, but
  // we never trust the filter alone for a financial decision.
  const prelim: VerifiedTransfer[] = [];
  for (const log of rawLogs as readonly RawTransferLog[]) {
    if (log.removed === true) continue;
    if (log.blockNumber === null || log.logIndex === null) continue;
    if (log.args.value <= 0n) continue;
    if (expectation.from && !sameAddress(log.args.from, expectation.from)) continue;
    prelim.push({
      txHash: log.transactionHash,
      blockNumber: log.blockNumber,
      valueBaseUnits: log.args.value,
      from: log.args.from,
      to: log.args.to,
      blockTimestampSec: -1n, // filled in the next pass
      confirmations: head - log.blockNumber + 1n,
      logIndex: log.logIndex,
    });
  }

  if (prelim.length === 0) return { kind: "NOT_FOUND" };

  // Fetch block timestamps (deduped by block number).
  const blockTs = new Map<bigint, bigint>();
  for (const t of prelim) {
    if (blockTs.has(t.blockNumber)) continue;
    const block = await client
      .getBlock({ blockNumber: t.blockNumber })
      .catch((err: unknown) => {
        throw new PaymentVerificationError(
          `Failed to read block ${t.blockNumber.toString()}`,
          err,
        );
      });
    blockTs.set(t.blockNumber, block.timestamp);
  }

  // Window-filter by block timestamp.
  const candidates: VerifiedTransfer[] = [];
  for (const t of prelim) {
    const ts = blockTs.get(t.blockNumber);
    if (ts === undefined) continue;
    const tsMs = Number(ts) * 1000;
    if (tsMs < expectation.windowStartMs || tsMs > expectation.windowEndMs) continue;
    candidates.push({ ...t, blockTimestampSec: ts });
  }
  if (candidates.length === 0) return { kind: "NOT_FOUND" };

  candidates.sort((a, b) => compareCandidates(a, b, expectation.amountBaseUnits));

  return classify(candidates[0], expectation);
}

/** Exact amount first, then highest value, then earliest position. */
function compareCandidates(
  a: VerifiedTransfer,
  b: VerifiedTransfer,
  expected: bigint,
): number {
  const aExact = a.valueBaseUnits === expected ? 0 : 1;
  const bExact = b.valueBaseUnits === expected ? 0 : 1;
  if (aExact !== bExact) return aExact - bExact;
  if (a.valueBaseUnits !== b.valueBaseUnits) {
    return a.valueBaseUnits > b.valueBaseUnits ? -1 : 1;
  }
  if (a.blockNumber !== b.blockNumber) {
    return a.blockNumber < b.blockNumber ? -1 : 1;
  }
  return a.logIndex - b.logIndex;
}

/** Case-insensitive address equality (EVM checksum tolerance). */
function sameAddress(a: Address, b: Address): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

function classify(
  transfer: VerifiedTransfer,
  expectation: PaymentExpectation,
): PaymentVerdict {
  const diff = transfer.valueBaseUnits - expectation.amountBaseUnits;
  if (diff === 0n) {
    return transfer.confirmations >= ARC_FINALITY_CONFIRMATIONS
      ? { kind: "CONFIRMED", transfer }
      : { kind: "DETECTED", transfer };
  }
  if (diff < 0n) {
    return { kind: "UNDERPAID", transfer, shortfallBaseUnits: -diff };
  }
  return { kind: "OVERPAID_ANOMALY", transfer, excessBaseUnits: diff };
}
