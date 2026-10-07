import test from 'node:test';
import assert from 'node:assert/strict';
import {
  simulateShadow,
  type OperationalEvent,
  type ShadowPorts,
  type ShadowPolicy
} from '../src/services/shadow-mode-simulator.js';

function createMockIdempotencyStore() {
  const seen = new Set<string>();
  return {
    has: (key: string) => seen.has(key),
    set: (key: string) => {
      seen.add(key);
    }
  };
}

const defaultPolicy: ShadowPolicy = {
  dryRun: true,
  network: 'testnet',
  perRunCapMicro: 100_000_000n, // $100
  oneOrderCeilingMicro: 50_000_000n, // $50
  reserveFloorMicro: 10_000_000n, // $10
  currentVaultBalanceMicro: 200_000_000n // $200
};

test('simulateShadow - dryRun defaults to true and marks synthetic events as SIMULATED with 0 traction', async () => {
  const store = createMockIdempotencyStore();
  const ports: ShadowPorts = {
    clock: () => Date.now(),
    idempotencyStore: store
  };

  const events: OperationalEvent[] = [
    {
      pilotId: 'pilot-shop-001',
      sourceDigest: 'digest-001',
      externalEventId: 'evt-001',
      occurredAt: '2026-03-30T10:00:00Z',
      category: 'gaming',
      amountMicro: '15000000', // $15
      currency: 'USDC',
      synthetic: true
    }
  ];

  const res = await simulateShadow(events, ports, defaultPolicy);
  assert.equal(res.processedCount, 1);
  assert.equal(res.acceptedCount, 1);
  assert.equal(res.totalVolumeMicro, '15000000');
  assert.equal(res.tractionEligibleVolumeMicro, '0'); // Synthetic excluded from traction
  assert.equal(res.records[0]?.evidenceClass, 'SIMULATED');
  assert.equal(res.records[0]?.synthetic, true);
  assert.equal(res.records[0]?.eligibleForTraction, false);
});

test('simulateShadow - rejects mainnet configuration', async () => {
  const ports: ShadowPorts = {
    clock: () => Date.now(),
    idempotencyStore: createMockIdempotencyStore()
  };

  const badPolicy: ShadowPolicy = {
    ...defaultPolicy,
    network: 'mainnet'
  };

  await assert.rejects(
    async () => {
      await simulateShadow([], ports, badPolicy);
    },
    { message: 'MAINNET_PROHIBITED_IN_SHADOW_MODE' }
  );
});

test('simulateShadow - enforces idempotency and skips duplicate external event IDs', async () => {
  const store = createMockIdempotencyStore();
  const ports: ShadowPorts = {
    clock: () => Date.now(),
    idempotencyStore: store
  };

  const event: OperationalEvent = {
    pilotId: 'pilot-shop-002',
    sourceDigest: 'digest-002',
    externalEventId: 'evt-unique-001',
    occurredAt: '2026-03-30T11:00:00Z',
    category: 'streaming',
    amountMicro: '10000000',
    currency: 'USDC',
    synthetic: true
  };

  const res = await simulateShadow([event, event], ports, defaultPolicy);
  assert.equal(res.processedCount, 2);
  assert.equal(res.acceptedCount, 1);
  assert.equal(res.duplicatesSkipped, 1);
  assert.equal(res.totalVolumeMicro, '10000000');
  assert.equal(res.records[1]?.status, 'SKIPPED_DUPLICATE');
});

test('simulateShadow - rejects non-synthetic events without pilot consent', async () => {
  const ports: ShadowPorts = {
    clock: () => Date.now(),
    idempotencyStore: createMockIdempotencyStore()
  };

  const realUnconsentedEvent: OperationalEvent = {
    pilotId: 'pilot-shop-003',
    sourceDigest: 'digest-003',
    externalEventId: 'evt-real-001',
    occurredAt: '2026-03-30T12:00:00Z',
    category: 'developer',
    amountMicro: '20000000',
    currency: 'USDC',
    synthetic: false,
    consented: false
  };

  const res = await simulateShadow([realUnconsentedEvent], ports, defaultPolicy);
  assert.equal(res.processedCount, 1);
  assert.equal(res.rejectedCount, 1);
  assert.equal(res.records[0]?.status, 'REJECTED_CONSENT');
  assert.equal(res.records[0]?.reason, 'PILOT_CONSENT_REQUIRED');
  assert.equal(res.totalVolumeMicro, '0');
});

test('simulateShadow - enforces one-order ceiling, per-run cap, and reserve floor', async () => {
  const ports: ShadowPorts = {
    clock: () => Date.now(),
    idempotencyStore: createMockIdempotencyStore()
  };

  // 1. One order ceiling breach ($60 > $50 ceiling)
  const hugeOrder: OperationalEvent = {
    pilotId: 'pilot-01',
    sourceDigest: 'd1',
    externalEventId: 'evt-huge',
    occurredAt: '2026-03-30T12:00:00Z',
    category: 'cloud',
    amountMicro: '60000000',
    currency: 'USDC',
    synthetic: true
  };
  const res1 = await simulateShadow([hugeOrder], ports, defaultPolicy);
  assert.equal(res1.records[0]?.status, 'REJECTED_CAP');
  assert.equal(res1.records[0]?.reason, 'ONE_ORDER_CEILING_EXCEEDED');

  // 2. Per-run cap breach ($40 + $40 + $30 > $100 cap)
  const orders = [
    { ...hugeOrder, externalEventId: 'o1', amountMicro: '40000000' },
    { ...hugeOrder, externalEventId: 'o2', amountMicro: '40000000' },
    { ...hugeOrder, externalEventId: 'o3', amountMicro: '30000000' }
  ];
  const res2 = await simulateShadow(orders, ports, defaultPolicy);
  assert.equal(res2.acceptedCount, 2);
  assert.equal(res2.rejectedCount, 1);
  assert.equal(res2.records[2]?.status, 'REJECTED_CAP');
  assert.equal(res2.records[2]?.reason, 'PER_RUN_CAP_EXCEEDED');

  // 3. Reserve floor breach (balance: $15, order: $10, remaining: $5 < $10 reserve floor)
  const lowVaultPolicy: ShadowPolicy = {
    ...defaultPolicy,
    currentVaultBalanceMicro: 15_000_000n,
    reserveFloorMicro: 10_000_000n
  };
  const res3 = await simulateShadow(
    [{ ...hugeOrder, externalEventId: 'floor-test', amountMicro: '10000000' }],
    ports,
    lowVaultPolicy
  );
  assert.equal(res3.records[0]?.status, 'REJECTED_CAP');
  assert.equal(res3.records[0]?.reason, 'RESERVE_FLOOR_BREACH');
});

test('simulateShadow - verifies mirror broadcast with dual-witness verifier to yield VERIFIED traction', async () => {
  const store = createMockIdempotencyStore();
  const ports: ShadowPorts = {
    clock: () => Date.now(),
    idempotencyStore: store,
    reserveAndClaim: async () => true,
    mirrorAdapter: async () => ({
      hash: '0x9999999999999999999999999999999999999999999999999999999999999999',
      chainId: 5042002
    }),
    verifyReceipt: async () => ({
      status: 'VERIFIED',
      hash: '0x9999999999999999999999999999999999999999999999999999999999999999',
      chainId: 5042002,
      confirmations: 5,
      evidenceDigest: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      markdownSummary: 'ok',
      witnessA: 'w1',
      witnessB: 'w2'
    })
  };

  const realConsentedEvent: OperationalEvent = {
    pilotId: 'pilot-shop-real',
    sourceDigest: 'digest-real',
    externalEventId: 'evt-real-verified',
    occurredAt: '2026-03-30T14:00:00Z',
    category: 'gaming',
    amountMicro: '25000000', // $25
    currency: 'USDC',
    synthetic: false,
    consented: true
  };

  const liveTestnetPolicy: ShadowPolicy = {
    ...defaultPolicy,
    dryRun: false,
    expectedSender: '0x1111111111111111111111111111111111111111',
    expectedRecipient: '0x2222222222222222222222222222222222222222'
  };

  const res = await simulateShadow([realConsentedEvent], ports, liveTestnetPolicy);
  assert.equal(res.acceptedCount, 1);
  assert.equal(res.tractionEligibleVolumeMicro, '25000000');
  assert.equal(res.records[0]?.evidenceClass, 'VERIFIED');
  assert.equal(res.records[0]?.eligibleForTraction, true);
  assert.equal(res.records[0]?.txHash, '0x9999999999999999999999999999999999999999999999999999999999999999');
  assert.equal(res.records[0]?.verificationDigest, 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
});
