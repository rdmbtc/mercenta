import test from "node:test";
import assert from "node:assert/strict";
import { verifyArc, arcClient, USDC } from "../src/services/arc/index.js";
import {
  encodeEventTopics,
  encodeAbiParameters,
  parseAbi,
  type Address,
  type Hash,
} from "viem";
const merchant = ("0x" + "1".repeat(40)) as Address,
  buyer = ("0x" + "2".repeat(40)) as Address,
  hash = ("0x" + "3".repeat(64)) as Hash,
  block = ("0x" + "4".repeat(64)) as Hash;
function client(
  options: {
    chain?: number;
    head?: bigint;
    to?: string;
    from?: string;
    status?: string;
    canonical?: string;
    erc20?: boolean;
  } = {},
) {
  return {
    getChainId: async () => options.chain ?? 5042002,
    getTransaction: async () => ({
      to: options.to ?? merchant,
      from: options.from ?? buyer,
      input: "0x",
      value: options.erc20 ? 0n : 2_100_000_000_000_000_000_000n,
    }),
    getTransactionReceipt: async () => ({
      status: options.status ?? "success",
      blockNumber: 100n,
      blockHash: block,
      logs: options.erc20
        ? [
            {
              address: USDC,
              topics: encodeEventTopics({
                abi: parseAbi([
                  "event Transfer(address indexed from,address indexed to,uint256 value)",
                ]),
                eventName: "Transfer",
                args: { from: buyer, to: merchant },
              }),
              data: encodeAbiParameters(
                [{ type: "uint256" }],
                [2_100_000_000n],
              ),
            },
          ]
        : [],
    }),
    getBlockNumber: async () => options.head ?? 101n,
    getBlock: async () => ({ hash: options.canonical ?? block }),
  } as unknown as ReturnType<typeof arcClient>;
}
test("native 18 decimals verified as micro-USDC with two confirmations", async () =>
  assert.equal(
    (await verifyArc(client(), hash, merchant, buyer)).amount,
    2100000000n,
  ));
test("ERC20 transfer logs use six decimals", async () =>
  assert.equal(
    (await verifyArc(client({ erc20: true }), hash, merchant, buyer)).amount,
    2100000000n,
  ));
test("wrong chain fails closed", async () =>
  assert.rejects(
    () => verifyArc(client({ chain: 1 }), hash, merchant, buyer),
    /WRONG_CHAIN/,
  ));
test("wrong recipient or buyer cannot authenticate payment", async () => {
  await assert.rejects(
    () => verifyArc(client({ to: buyer }), hash, merchant, buyer),
    /NO_MATCHING/,
  );
  await assert.rejects(
    () => verifyArc(client({ from: merchant }), hash, merchant, buyer),
    /NO_MATCHING/,
  );
});
test("one confirmation and reverted receipts fail", async () => {
  await assert.rejects(
    () => verifyArc(client({ head: 100n }), hash, merchant, buyer),
    /NOT_FINAL/,
  );
  await assert.rejects(
    () => verifyArc(client({ status: "reverted" }), hash, merchant, buyer),
    /PAYMENT_FAILED/,
  );
});
test("noncanonical receipt fails", async () =>
  assert.rejects(
    () => verifyArc(client({ canonical: hash }), hash, merchant, buyer),
    /BLOCK_MISMATCH/,
  ));
