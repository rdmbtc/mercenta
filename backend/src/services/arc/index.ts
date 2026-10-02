import {
  createPublicClient,
  http,
  defineChain,
  decodeEventLog,
  parseAbi,
  type Address,
  type Hash,
} from "viem";
export const USDC = "0x3600000000000000000000000000000000000000" as const;
export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
  testnet: true,
});
const abi = parseAbi([
  "event Transfer(address indexed from,address indexed to,uint256 value)",
]);
export function arcClient(rpc: string) {
  return createPublicClient({
    chain: arcTestnet,
    transport: http(rpc, { timeout: 10000, retryCount: 0 }),
  });
}
export function nativeToMicro(value: bigint): bigint {
  if (value % 1_000_000_000_000n !== 0n)
    throw new Error("NATIVE_AMOUNT_PRECISION");
  return value / 1_000_000_000_000n;
}
export type PaymentProof = {
  amount: bigint;
  confirmations: bigint;
  blockHash: string;
  txHash: string;
};
export async function verifyArc(
  client: ReturnType<typeof arcClient>,
  hash: Hash,
  merchant: Address,
  buyer: Address,
): Promise<PaymentProof> {
  if ((await client.getChainId()) !== 5042002) throw new Error("WRONG_CHAIN");
  const [tx, receipt, head] = await Promise.all([
    client.getTransaction({ hash }),
    client.getTransactionReceipt({ hash }),
    client.getBlockNumber(),
  ]);
  if (receipt.status !== "success" || receipt.blockNumber === null)
    throw new Error("PAYMENT_FAILED");
  const block = await client.getBlock({ blockNumber: receipt.blockNumber });
  if (block.hash !== receipt.blockHash) throw new Error("BLOCK_MISMATCH");
  const confirmations = head - receipt.blockNumber + 1n;
  if (confirmations < 2n) throw new Error("PAYMENT_NOT_FINAL");
  let amount = 0n;
  // Native transfers must originate from the authenticated buyer, go directly to the merchant, and carry no calldata.
  if (
    tx.to?.toLowerCase() === merchant.toLowerCase() &&
    tx.from.toLowerCase() === buyer.toLowerCase() &&
    tx.input === "0x" &&
    tx.value > 0n
  )
    amount = nativeToMicro(tx.value);
  else
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== USDC.toLowerCase()) continue;
      try {
        const e = decodeEventLog({ abi, data: log.data, topics: log.topics });
        if (
          e.args.to.toLowerCase() === merchant.toLowerCase() &&
          e.args.from.toLowerCase() === buyer.toLowerCase()
        )
          amount += e.args.value;
      } catch {
        /* Unrelated log is not payment evidence. */
      }
    }
  if (amount <= 0n) throw new Error("NO_MATCHING_USDC_PAYMENT");
  return {
    amount,
    confirmations,
    blockHash: receipt.blockHash,
    txHash: hash.toLowerCase(),
  };
}
