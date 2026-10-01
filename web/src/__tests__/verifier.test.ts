import { describe, it, expect, vi } from "vitest";
import { verifyArcPayment } from "@/lib/arc-verifier.js";
import { encodeAbiParameters, parseAbiParameters, type Hex, type Address } from "viem";

const MERCHANT = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" as Address;
const SENDER = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as Address;
const TX_HASH = ("0x" + "ab".repeat(32)) as Hex;
const USDC_ADDR = "0x3600000000000000000000000000000000000000";
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

function padAddr(addr: string): Hex {
  return ("0x" + addr.slice(2).toLowerCase().padStart(64, "0")) as Hex;
}

function encodeTransferValue(value: bigint): Hex {
  return encodeAbiParameters(parseAbiParameters("uint256"), [value]);
}

function makeReceipt(opts: { status?: string; value?: bigint; blockNumber?: bigint; toMerchant?: boolean } = {}) {
  const value = opts.value ?? 10_000_000n;
  const transferLog = {
    address: USDC_ADDR,
    topics: [
      TRANSFER_TOPIC,
      padAddr(SENDER),
      opts.toMerchant === false ? padAddr("0xcccccccccccccccccccccccccccccccccccccccc") : padAddr(MERCHANT),
    ],
    data: encodeTransferValue(value),
  };
  return {
    status: opts.status ?? "success",
    blockNumber: opts.blockNumber ?? 99n,
    logs: [transferLog],
  };
}

function mockClient(overrides: Record<string, unknown> = {}) {
  return {
    getTransactionReceipt: vi.fn().mockResolvedValue(overrides.receipt ?? null),
    getBlockNumber: vi.fn().mockResolvedValue(overrides.headBlock ?? 100n),
    getBlock: vi.fn().mockResolvedValue({ timestamp: overrides.blockTimestamp ?? 1000n }),
  } as never;
}

describe("arc-verifier", () => {
  const baseInput = {
    txHash: TX_HASH,
    expectedAmountUnits: 10_000_000n,
    merchantWallet: MERCHANT,
    orderExpiresAt: 2000,
    isTxConsumed: () => false,
  };

  it("VALID: exact amount confirmed", async () => {
    const client = mockClient({ receipt: makeReceipt(), headBlock: 100n, blockTimestamp: 1500n });
    const r = await verifyArcPayment(baseInput, client);
    expect(r.outcome).toBe("VALID");
    if (r.outcome === "VALID") {
      expect(r.amountUnits).toBe(10_000_000n);
      expect(r.blockTimestamp).toBe(1500);
    }
  });

  it("VALID: overpaid still valid", async () => {
    const client = mockClient({ receipt: makeReceipt({ value: 15_000_000n }), headBlock: 100n, blockTimestamp: 1500n });
    const r = await verifyArcPayment(baseInput, client);
    expect(r.outcome).toBe("VALID");
    if (r.outcome === "VALID") expect(r.amountUnits).toBe(15_000_000n);
  });

  it("UNDERPAID: amount less than expected", async () => {
    const client = mockClient({ receipt: makeReceipt({ value: 5_000_000n }), headBlock: 100n, blockTimestamp: 1500n });
    const r = await verifyArcPayment(baseInput, client);
    expect(r.outcome).toBe("UNDERPAID");
    if (r.outcome === "UNDERPAID") {
      expect(r.actualUnits).toBe(5_000_000n);
      expect(r.shortfallUnits).toBe(5_000_000n);
    }
  });

  it("REJECTED: duplicate tx hash", async () => {
    const client = mockClient();
    const r = await verifyArcPayment({ ...baseInput, isTxConsumed: () => true }, client);
    expect(r.outcome).toBe("REJECTED");
    if (r.outcome === "REJECTED") expect(r.reason).toBe("DUPLICATE_TX_HASH");
  });

  it("REJECTED: tx reverted", async () => {
    const client = mockClient({ receipt: makeReceipt({ status: "reverted" }) });
    const r = await verifyArcPayment(baseInput, client);
    expect(r.outcome).toBe("REJECTED");
    if (r.outcome === "REJECTED") expect(r.reason).toBe("TX_REVERTED");
  });

  it("REJECTED: no receipt found", async () => {
    const client = mockClient({ receipt: null });
    const r = await verifyArcPayment(baseInput, client);
    expect(r.outcome).toBe("REJECTED");
    if (r.outcome === "REJECTED") expect(r.reason).toBe("RECEIPT_NOT_FOUND");
  });

  it("REJECTED: payment after expiry", async () => {
    const client = mockClient({ receipt: makeReceipt(), headBlock: 100n, blockTimestamp: 3000n });
    const r = await verifyArcPayment(baseInput, client);
    expect(r.outcome).toBe("REJECTED");
    if (r.outcome === "REJECTED") expect(r.reason).toBe("PAYMENT_AFTER_EXPIRY");
  });

  it("REJECTED: no USDC transfer to merchant", async () => {
    const client = mockClient({ receipt: makeReceipt({ toMerchant: false }), headBlock: 100n });
    const r = await verifyArcPayment(baseInput, client);
    expect(r.outcome).toBe("REJECTED");
    if (r.outcome === "REJECTED") expect(r.reason).toBe("NO_USDC_TRANSFER_TO_MERCHANT");
  });

  it("REJECTED: receipt fetch failure", async () => {
    const client = mockClient();
    (client.getTransactionReceipt as unknown as { mockRejectedValue: (e:Error)=>void }).mockRejectedValue(new Error("RPC down"));
    const r = await verifyArcPayment(baseInput, client);
    expect(r.outcome).toBe("REJECTED");
    if (r.outcome === "REJECTED") expect(r.reason).toBe("RECEIPT_FETCH_FAILED");
  });
});
