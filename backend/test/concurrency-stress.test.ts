import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { openDb } from '../src/db.js';
import { loadConfig } from '../src/config.js';
import { SupplyNode } from '../src/services/fulfillment/index.js';
import { Orders } from '../src/services/orders.js';
import { transfer, balance } from '../src/services/ledger/index.js';

class MockSupplyNode extends SupplyNode {
  calls = 0;
  override get ready() {
    return true;
  }
  override async purchase() {
    this.calls++;
    return { status: 'UNKNOWN' } as const;
  }
}

function createDiskFixture(price = '5.00') {
  const tmpFile = path.join(os.tmpdir(), `mercenta-wal-${randomUUID()}.db`);
  const db = openDb(tmpFile);
  const c = loadConfig({ NODE_ENV: 'test' });
  const node = new MockSupplyNode(c);
  const orders = new Orders(
    db,
    c,
    [
      {
        id: 'sku-test',
        name: 'Cloud Voucher',
        category: 'cloud',
        price,
        cost: '4.00',
        currency: 'USDC',
        enabled: true,
        quotedAt: Date.now(),
        supplierSku: 'internal'
      }
    ],
    node
  );

  // Fund operating equity in ledger
  transfer(
    db,
    'seed-funding',
    'verified-capital',
    'equity:usdc',
    'arc:usdc:available',
    1000000000n // 1000 USDC
  );

  const cleanup = () => {
    try {
      db.close();
      for (const ext of ['', '-wal', '-shm']) {
        const p = tmpFile + ext;
        if (fs.existsSync(p)) fs.unlinkSync(p);
      }
    } catch {}
  };

  return { db, c, node, orders, tmpFile, cleanup };
}

test('AGENT-10: High-load SQLite WAL - 25 concurrent same-key replay requests resolve idempotently', async () => {
  const f = createDiskFixture();
  try {
    const actor = 'wallet:0x' + '1'.repeat(40);
    const key = randomUUID();

    // Fire 25 simultaneous calls with identical idempotency key
    const promises = Array.from({ length: 25 }, () =>
      Promise.resolve().then(() => f.orders.createIdempotent(actor, key, 'sku-test', 1))
    );

    const results = await Promise.all(promises);
    const firstOrderId = results[0]!.id;

    // All must resolve to the EXACT SAME order ID
    for (const res of results) {
      assert.equal(res.id, firstOrderId);
    }

    // Verify orders table has exactly 1 order row
    const rowCount = f.db.prepare('SELECT count(*) as count FROM orders WHERE actor=?').get(actor) as { count: number };
    assert.equal(rowCount.count, 1);

    // Verify database integrity in WAL mode
    const quick = f.db.pragma('quick_check') as [{ quick_check: string }];
    assert.equal(quick[0]?.quick_check, 'ok');
  } finally {
    f.cleanup();
  }
});

test('AGENT-10: High-load SQLite WAL - 25 concurrent unique-key orders burst without deadlock', async () => {
  const f = createDiskFixture();
  try {
    const actor = 'wallet:0x' + '2'.repeat(40);

    // Fire 25 distinct order reservations concurrently
    const promises = Array.from({ length: 25 }, (_, i) => {
      const key = `key-burst-${i}-${randomUUID()}`;
      return Promise.resolve().then(() => f.orders.createIdempotent(actor, key, 'sku-test', 1));
    });

    const results = await Promise.all(promises);
    assert.equal(results.length, 25);

    const orderCount = f.db.prepare('SELECT count(*) as count FROM orders WHERE actor=?').get(actor) as { count: number };
    assert.equal(orderCount.count, 25);

    // Check WAL pragma integrity
    const integrity = f.db.pragma('integrity_check') as [{ integrity_check: string }];
    assert.equal(integrity[0]?.integrity_check, 'ok');
  } finally {
    f.cleanup();
  }
});

test('AGENT-10: High-load SQLite WAL - Conflicting payload with reused key is rejected', async () => {
  const f = createDiskFixture();
  try {
    const actor = 'wallet:0x' + '3'.repeat(40);
    const key = randomUUID();

    // First order quantity 1
    f.orders.createIdempotent(actor, key, 'sku-test', 1);

    // Second order with same key but quantity 2 must throw IDEMPOTENCY_CONFLICT
    assert.throws(
      () => f.orders.createIdempotent(actor, key, 'sku-test', 2),
      /IDEMPOTENCY/
    );

    const integrity = f.db.pragma('quick_check') as [{ quick_check: string }];
    assert.equal(quickIntegrity(integrity), 'ok');
  } finally {
    f.cleanup();
  }
});

function quickIntegrity(res: unknown[]): string {
  const first = res[0] as Record<string, string>;
  return first ? Object.values(first)[0] ?? 'fail' : 'fail';
}
