import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateReceiptProof,
  type WitnessPorts,
  type DualWitnessPorts,
  type ReceiptProofInput,
  type TxReceipt,
  type TxData
} from '../src/services/receipt-proof-generator.js';

const ARC_USDC_CONTRACT = '0x3600000000000000000000000000000000000000';
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

function padAddress(address: string): string {
  return '0x' + address.toLowerCase().replace('0x', '').padStart(64, '0');
}

function createMockWitness(name: string, overrides: Partial<WitnessPorts> = {}): WitnessPorts {
  return {
    name,
    endpoint: `https://${name}.example/rpc`,
    getChainId: async () => 5042002,
    getTransaction: async (hash: string): Promise<TxData | null> => ({
      hash,
      from: '0x1111111111111111111111111111111111111111',
      to: '0x2222222222222222222222222222222222222222',
      value: 0n,
      chainId: 5042002
    }),
    getReceipt: async (hash: string): Promise<TxReceipt | null> => ({
      status: 1,
      blockNumber: 1000n,
      blockHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      from: '0x1111111111111111111111111111111111111111',
      to: '0x2222222222222222222222222222222222222222',
      logs: [
        {
          address: ARC_USDC_CONTRACT,
          topics: [
            TRANSFER_TOPIC,
            padAddress('0x1111111111111111111111111111111111111111'),
            padAddress('0x2222222222222222222222222222222222222222')
          ],
          data: '0x' + (10_000_000n).toString(16).padStart(64, '0') // 10.00 USDC
        }
      ]
    }),
    getBlock: async (hashOrNum) => ({
      hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      number: 1000n
    }),
    getHead: async () => 1010n, // 11 confirmations
    ...overrides
  };
}

test('generateReceiptProof - successful dual-witness verification', async () => {
  const ports: DualWitnessPorts = {
    primaryWitness: createMockWitness('arc-rpc-primary.arc.net'),
    secondaryWitness: createMockWitness('arc-rpc-secondary.quicknode.com')
  };

  const input: ReceiptProofInput = {
    hash: '0x8888888888888888888888888888888888888888888888888888888888888888',
    expectedSender: '0x1111111111111111111111111111111111111111',
    expectedRecipient: '0x2222222222222222222222222222222222222222',
    expectedAmountMicro: 10_000_000n,
    chainId: 5042002,
    minConfirmations: 2
  };

  const res = await generateReceiptProof(input, ports);
  assert.equal(res.status, 'VERIFIED');
  assert.equal(res.chainId, 5042002);
  assert.ok(res.confirmations >= 2);
  assert.ok(res.evidenceDigest.length === 64);
  assert.ok(res.markdownSummary.includes('https://testnet.arcscan.app/tx/0x8888888888888888888888888888888888888888888888888888888888888888'));
  assert.ok(res.markdownSummary.includes('CANONICAL_CONSENSUS_VERIFIED'));
});

test('generateReceiptProof - rejects identical RPC endpoints as not independent', async () => {
  const ports: DualWitnessPorts = {
    primaryWitness: createMockWitness('same-rpc.example.com'),
    secondaryWitness: createMockWitness('same-rpc.example.com')
  };

  const input: ReceiptProofInput = {
    hash: '0x8888888888888888888888888888888888888888888888888888888888888888',
    expectedSender: '0x1111111111111111111111111111111111111111',
    expectedRecipient: '0x2222222222222222222222222222222222222222',
    expectedAmountMicro: 10_000_000n
  };

  const res = await generateReceiptProof(input, ports);
  assert.equal(res.status, 'UNAVAILABLE');
  assert.equal(res.reason, 'IDENTICAL_RPC_ENDPOINTS_REJECTED');
});

test('generateReceiptProof - rejects wrong chain ID', async () => {
  const ports: DualWitnessPorts = {
    primaryWitness: createMockWitness('w1', { getChainId: async () => 1 }),
    secondaryWitness: createMockWitness('w2')
  };

  const input: ReceiptProofInput = {
    hash: '0x8888888888888888888888888888888888888888888888888888888888888888',
    expectedSender: '0x1111111111111111111111111111111111111111',
    expectedRecipient: '0x2222222222222222222222222222222222222222',
    expectedAmountMicro: 10_000_000n
  };

  const res = await generateReceiptProof(input, ports);
  assert.equal(res.status, 'REJECTED');
  assert.equal(res.reason, 'WRONG_CHAIN_ID');
});

test('generateReceiptProof - returns UNAVAILABLE when transaction/receipt missing or RPC fails', async () => {
  const portsMissing: DualWitnessPorts = {
    primaryWitness: createMockWitness('w1', { getReceipt: async () => null }),
    secondaryWitness: createMockWitness('w2')
  };

  const input: ReceiptProofInput = {
    hash: '0x8888888888888888888888888888888888888888888888888888888888888888',
    expectedSender: '0x1111111111111111111111111111111111111111',
    expectedRecipient: '0x2222222222222222222222222222222222222222',
    expectedAmountMicro: 10_000_000n
  };

  const res1 = await generateReceiptProof(input, portsMissing);
  assert.equal(res1.status, 'UNAVAILABLE');
  assert.equal(res1.reason, 'TRANSACTION_OR_RECEIPT_NOT_FOUND');

  const portsError: DualWitnessPorts = {
    primaryWitness: createMockWitness('w1', {
      getTransaction: async () => {
        throw new Error('Connection timed out');
      }
    }),
    secondaryWitness: createMockWitness('w2')
  };

  const res2 = await generateReceiptProof(input, portsError);
  assert.equal(res2.status, 'UNAVAILABLE');
  assert.ok(res2.reason?.startsWith('RPC_FETCH_ERROR'));
});

test('generateReceiptProof - rejects block hash mismatch (witness disagreement/reorg)', async () => {
  const ports: DualWitnessPorts = {
    primaryWitness: createMockWitness('w1'),
    secondaryWitness: createMockWitness('w2', {
      getReceipt: async (hash: string) => {
        const rcpt = await createMockWitness('w2').getReceipt(hash);
        return { ...rcpt!, blockHash: '0xdiff111111111111111111111111111111111111111111111111111111111111' };
      }
    })
  };

  const input: ReceiptProofInput = {
    hash: '0x8888888888888888888888888888888888888888888888888888888888888888',
    expectedSender: '0x1111111111111111111111111111111111111111',
    expectedRecipient: '0x2222222222222222222222222222222222222222',
    expectedAmountMicro: 10_000_000n
  };

  const res = await generateReceiptProof(input, ports);
  assert.equal(res.status, 'REJECTED');
  assert.equal(res.reason, 'WITNESS_BLOCK_HASH_MISMATCH');
});

test('generateReceiptProof - rejects reverted transactions', async () => {
  const ports: DualWitnessPorts = {
    primaryWitness: createMockWitness('w1', {
      getReceipt: async (hash) => {
        const r = await createMockWitness('w1').getReceipt(hash);
        return { ...r!, status: 0 };
      }
    }),
    secondaryWitness: createMockWitness('w2', {
      getReceipt: async (hash) => {
        const r = await createMockWitness('w2').getReceipt(hash);
        return { ...r!, status: 0 };
      }
    })
  };

  const input: ReceiptProofInput = {
    hash: '0x8888888888888888888888888888888888888888888888888888888888888888',
    expectedSender: '0x1111111111111111111111111111111111111111',
    expectedRecipient: '0x2222222222222222222222222222222222222222',
    expectedAmountMicro: 10_000_000n
  };

  const res = await generateReceiptProof(input, ports);
  assert.equal(res.status, 'REJECTED');
  assert.equal(res.reason, 'TRANSACTION_REVERTED');
});

test('generateReceiptProof - returns UNAVAILABLE on insufficient confirmations', async () => {
  const ports: DualWitnessPorts = {
    primaryWitness: createMockWitness('w1', { getHead: async () => 1000n }), // 1 confirmation
    secondaryWitness: createMockWitness('w2', { getHead: async () => 1000n })
  };

  const input: ReceiptProofInput = {
    hash: '0x8888888888888888888888888888888888888888888888888888888888888888',
    expectedSender: '0x1111111111111111111111111111111111111111',
    expectedRecipient: '0x2222222222222222222222222222222222222222',
    expectedAmountMicro: 10_000_000n,
    minConfirmations: 5
  };

  const res = await generateReceiptProof(input, ports);
  assert.equal(res.status, 'UNAVAILABLE');
  assert.equal(res.reason, 'INSUFFICIENT_CONFIRMATIONS');
  assert.equal(res.confirmations, 1);
});

test('generateReceiptProof - rejects wrong sender, recipient, or amount', async () => {
  const ports: DualWitnessPorts = {
    primaryWitness: createMockWitness('w1'),
    secondaryWitness: createMockWitness('w2')
  };

  // Wrong sender
  const resBadSender = await generateReceiptProof(
    {
      hash: '0x8888888888888888888888888888888888888888888888888888888888888888',
      expectedSender: '0x9999999999999999999999999999999999999999',
      expectedRecipient: '0x2222222222222222222222222222222222222222',
      expectedAmountMicro: 10_000_000n
    },
    ports
  );
  assert.equal(resBadSender.status, 'REJECTED');
  assert.equal(resBadSender.reason, 'SENDER_OR_RECIPIENT_MISMATCH');

  // Wrong amount
  const resBadAmount = await generateReceiptProof(
    {
      hash: '0x8888888888888888888888888888888888888888888888888888888888888888',
      expectedSender: '0x1111111111111111111111111111111111111111',
      expectedRecipient: '0x2222222222222222222222222222222222222222',
      expectedAmountMicro: 99_999_999n
    },
    ports
  );
  assert.equal(resBadAmount.status, 'REJECTED');
  assert.equal(resBadAmount.reason, 'AMOUNT_MISMATCH');
});
