import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { openDb } from '../src/db.js';
import { loadConfig } from '../src/config.js';
import { SupplyNode } from '../src/services/fulfillment/index.js';
import { Orders, type Order } from '../src/services/orders.js';
import { transfer, balance } from '../src/services/ledger/index.js';
import {
  recordProcurementHealth,
  procurementHealth,
  requireProcurementFunds,
  reserveProcurement,
  MIN_PROCUREMENT_USD,
  REOPEN_PROCUREMENT_USD
} from '../src/services/procurement-health.js';

class ChaosSupplyNode extends SupplyNode {
  public purchaseBehavior: 'timeout' | 'completed' | 'not_executed' | 'throw_unknown' = 'timeout';
  public callCount = 0;

  override get ready() {
    return true;
  }

  override async purchase(ref: string, sku: string, qty: number, costUnits: string) {
    this.callCount++;
    if (this.purchaseBehavior === 'timeout') {
      throw new Error('ETIMEDOUT: Connection dropped mid-flight');
    }
    if (this.purchaseBehavior === 'throw_unknown') {
      throw new Error('HTTP_504_GATEWAY_TIMEOUT');
    }
    if (this.purchaseBehavior === 'not_executed') {
      return { status: 'NOT_EXECUTED' } as const;
    }
    return {
      status: 'COMPLETED',
      chargedUsdUnits: costUnits,
      code: 'CHAOS-TEST-KEY-12345'
    } as const;
  }
}

function createChaosFixture() {
  const db = openDb(':memory:');
  const c = loadConfig({
    NODE_ENV: 'test',
    REQUEST_REF_SECRET: 'test-secret-chaos-1234567890abcdef1234567890',
    DELIVERY_ENCRYPTION_KEY: 'a'.repeat(64)
  });
  const node = new ChaosSupplyNode(c);

  const product = {
    id: 'prod-chaos',
    name: 'Compute Credit Tier',
    category: 'cloud',
    price: '10.00',
    cost: '8.00',
    currency: 'USDC',
    enabled: true,
    quotedAt: Date.now(),
    supplierSku: 'sku-cloud-1'
  };

  const orders = new Orders(db, c, [product], node);

  // Initial treasury equity
  transfer(
    db,
    'equity-init',
    'seed',
    'equity:usdc',
    'arc:usdc:available',
    20_000_000_000n // $20,000 USDC to satisfy P10 reserve floor
  );

  return { db, c, node, orders, product };
}

test('resilience: timeout during settlement quarantines order as SUPPLIER_UNKNOWN and retains reserve lock', async () => {
  const { db, node, orders, product } = createChaosFixture();
  const actor = 'wallet:0x' + '2'.repeat(40);
  const reqId = randomUUID();

  // 1. Create order
  const order = orders.createIdempotent(actor, reqId, product.id, 1);
  assert.equal(order.status, 'AWAITING_PAYMENT');

  // 2. Accept payment with 2 confirmations -> auto approved -> triggers fulfill -> timeout thrown
  node.purchaseBehavior = 'timeout';
  const payTx = '0x' + 'a'.repeat(64);
  const blockHash = '0x' + 'b'.repeat(64);

  await orders.acceptPayment(order.id, actor, {
    amount: 10_000_000n, // $10 USDC
    confirmations: 2n,
    txHash: payTx,
    blockHash
  });

  // Verify status is quarantined to SUPPLIER_UNKNOWN
  const oAfter = orders.get(order.id)!;
  assert.equal(oAfter.status, 'SUPPLIER_UNKNOWN');
  assert.ok(oAfter.request_ref !== null);

  // Verify durable reserve lock is RETAINED in ledger
  const reservedBal = balance(db, 'arc:usdc:reserved');
  assert.equal(reservedBal, 8_000_000n, 'Cost units must remain locked in reserved account');

  // Verify reconciliation job is queued
  const recon = db.prepare('SELECT * FROM reconciliations WHERE order_id=?').get(order.id) as any;
  assert.ok(recon, 'Reconciliation must be scheduled for unknown settlement');
  assert.equal(recon.order_id, order.id);

  // Verify second fulfill call does NOT re-purchase
  const initialCalls = node.callCount;
  await orders.fulfill(order.id);
  assert.equal(node.callCount, initialCalls, 'Cannot trigger duplicate purchase while SUPPLIER_UNKNOWN');
});

test('resilience: recovery from SUPPLIER_UNKNOWN via reconciliation applySupply(COMPLETED) without duplicate debits', async () => {
  const { db, node, orders, product } = createChaosFixture();
  const actor = 'wallet:0x' + '3'.repeat(40);
  const reqId = randomUUID();

  const order = orders.createIdempotent(actor, reqId, product.id, 1);
  node.purchaseBehavior = 'throw_unknown';

  await orders.acceptPayment(order.id, actor, {
    amount: 10_000_000n,
    confirmations: 2n,
    txHash: '0x' + 'c'.repeat(64),
    blockHash: '0x' + 'd'.repeat(64)
  });

  assert.equal(orders.get(order.id)!.status, 'SUPPLIER_UNKNOWN');
  assert.equal(balance(db, 'arc:usdc:reserved'), 8_000_000n);

  // Simulate reconciliation worker recovering the confirmed supply result
  orders.applySupply(order.id, {
    status: 'COMPLETED',
    chargedUsdUnits: '8000000',
    code: 'RECOVERED-KEY-999'
  });

  const oResolved = orders.get(order.id)!;
  assert.equal(oResolved.status, 'FULFILLED');
  assert.equal(balance(db, 'arc:usdc:reserved'), 0n, 'Reserved balance cleared');
  assert.equal(balance(db, 'settlement:usdc:paid'), 8_000_000n, 'Settlement paid recorded');

  // Calling applySupply again must be idempotent and not move funds twice
  orders.applySupply(order.id, {
    status: 'COMPLETED',
    chargedUsdUnits: '8000000',
    code: 'RECOVERED-KEY-999'
  });
  assert.equal(balance(db, 'settlement:usdc:paid'), 8_000_000n, 'No duplicate transfer');
});

test('resilience: procurement health breaker latches on low balance and stays latched until recovery threshold', () => {
  const db = openDb(':memory:');
  const now = Date.now();

  // 1. Initial healthy balance: $15.00
  recordProcurementHealth(db, { currency: 'USD', available: '15.000000', observedAt: now }, now);
  const h1 = procurementHealth(db, now);
  assert.equal(h1.open, true);
  assert.equal(h1.reason, 'READY');

  // 2. Drop below MIN_PROCUREMENT_USD ($10): e.g. $8.00 -> Latches breaker
  recordProcurementHealth(db, { currency: 'USD', available: '8.000000', observedAt: now + 1000 }, now + 1000);
  const h2 = procurementHealth(db, now + 1000);
  assert.equal(h2.open, false);
  assert.equal(h2.reason, 'SERVICE_FUNDS_LOW');

  // 3. Partial bounce to $11.00 (< REOPEN_PROCUREMENT_USD $12) -> MUST STAY LATCHED
  recordProcurementHealth(db, { currency: 'USD', available: '11.000000', observedAt: now + 2000 }, now + 2000);
  const h3 = procurementHealth(db, now + 2000);
  assert.equal(h3.open, false);
  assert.equal(h3.reason, 'SERVICE_FUNDS_RECOVERING', 'Must remain latched until $12.00 threshold');

  // 4. Full recovery to $13.00 (>= REOPEN_PROCUREMENT_USD) -> Opens breaker
  recordProcurementHealth(db, { currency: 'USD', available: '13.000000', observedAt: now + 3000 }, now + 3000);
  const h4 = procurementHealth(db, now + 3000);
  assert.equal(h4.open, true);
  assert.equal(h4.reason, 'READY');
});

test('resilience: stale procurement credit data (> 30s) fails closed with BALANCE_UNVERIFIED', () => {
  const db = openDb(':memory:');
  const pastTime = Date.now() - 35000; // 35 seconds ago

  recordProcurementHealth(db, { currency: 'USD', available: '50.000000', observedAt: pastTime }, Date.now());
  const h = procurementHealth(db, Date.now());
  assert.equal(h.open, false);
  assert.equal(h.reason, 'BALANCE_UNVERIFIED');

  assert.throws(() => {
    requireProcurementFunds(db, '1000000', Date.now());
  }, /SERVICE_PURCHASES_PAUSED/);
});

test('resilience: idempotent procurement reservation locks funds and rejects altered amounts', () => {
  const db = openDb(':memory:');
  const now = Date.now();
  recordProcurementHealth(db, { currency: 'USD', available: '20.000000', observedAt: now }, now);

  const ref = 'procurement-ref-001';
  // First reservation succeeds
  const res1 = reserveProcurement(db, ref, '5000000', now);
  assert.equal(res1, true);

  // Identical reservation is idempotent return false (already reserved)
  const res2 = reserveProcurement(db, ref, '5000000', now);
  assert.equal(res2, false);

  // Altered amount on same ref throws IDEMPOTENCY_CONFLICT
  assert.throws(() => {
    reserveProcurement(db, ref, '6000000', now);
  }, /IDEMPOTENCY_CONFLICT/);
});
