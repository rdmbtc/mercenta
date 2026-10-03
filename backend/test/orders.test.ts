import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { openDb } from "../src/db.js";
import { loadConfig } from "../src/config.js";
import { SupplyNode } from "../src/services/fulfillment/index.js";
import { Orders } from "../src/services/orders.js";
import { transfer, balance } from "../src/services/ledger/index.js";
function setup(price = "9.00") {
  const db = openDb(":memory:"),
    c = loadConfig({ NODE_ENV: "test" });
  class Node extends SupplyNode {
    calls = 0;
    override get ready() {
      return true;
    }
    override async purchase() {
      this.calls++;
      return { status: "UNKNOWN" } as const;
    }
  }
  const node = new Node(c);
  const orders = new Orders(
    db,
    c,
    [
      {
        id: "p",
        name: "Resource",
        category: "cloud",
        price,
        cost: "7.00",
        currency: "USDC",
        enabled: true,
        quotedAt: Date.now(),
        supplierSku: "internal",
      },
    ],
    node,
  );
  transfer(
    db,
    "funding",
    "verified-funding",
    "equity:usdc",
    "arc:usdc:available",
    20000000000n,
  );
  return { db, c, node, orders };
}
test("order idempotency conflict and reused payment protected", async () => {
  const { db, orders } = setup();
  try {
    const a = "wallet:0x" + "1".repeat(40),
      id = randomUUID();
    const o = orders.createIdempotent(a, id, "p", 1);
    assert.equal(orders.createIdempotent(a, id, "p", 1).id, o.id);
    assert.throws(() => orders.createIdempotent(a, id, "p", 2), /IDEMPOTENCY/);
    await orders.acceptPayment(o.id, a, {
      amount: 9000000n,
      confirmations: 2n,
      txHash: "tx",
      blockHash: "block",
    });
    const second = orders.create(a, "p", 1);
    await assert.rejects(() =>
      orders.acceptPayment(second.id, a, {
        amount: 9000000n,
        confirmations: 2n,
        txHash: "tx",
        blockHash: "block",
      }),
    );
    assert.equal(orders.get(second.id)?.status, "AWAITING_PAYMENT");
  } finally {
    db.close();
  }
});
test("unknown purchase retains reserve, never blindly retried; delivery reveals once", async () => {
  const { db, orders, node } = setup();
  try {
    const a = "wallet:0x" + "1".repeat(40),
      o = orders.create(a, "p", 1);
    await orders.acceptPayment(o.id, a, {
      amount: 9000000n,
      confirmations: 2n,
      txHash: "tx",
      blockHash: "block",
    });
    assert.equal(orders.get(o.id)?.status, "SUPPLIER_UNKNOWN");
    assert.equal(balance(db, "arc:usdc:reserved"), 7000000n);
    await orders.fulfill(o.id);
    orders.recover();
    assert.equal(node.calls, 1);
    orders.applySupply(o.id, { status: "COMPLETED", code: "example-code" });
    assert.equal(orders.reveal(o.id, a).code, "example-code");
    assert.throws(() => orders.reveal(o.id, a), /DELIVERY_UNAVAILABLE/);
  } finally {
    db.close();
  }
});
test("SQL trigger prevents sealing unbalanced direct inserts", () => {
  const { db } = setup();
  try {
    db.prepare("INSERT INTO ledger_batches VALUES('bad','w',0,0)").run();
    db.prepare(
      "INSERT INTO ledger_entries(batch_id,account,currency,direction,amount_units) VALUES('bad','a','USDC','DEBIT','900000000000000000000')",
    ).run();
    assert.throws(
      () =>
        db.prepare("UPDATE ledger_batches SET sealed=1 WHERE id='bad'").run(),
      /UNBALANCED_JOURNAL/,
    );
    assert.equal(balance(db, "a"), 0n);
  } finally {
    db.close();
  }
});

test('disabled fulfillment blocks a new invoice before any customer payment or order record',()=>{const db=openDb(':memory:'),c=loadConfig({NODE_ENV:'test'}),node=new SupplyNode(c),orders=new Orders(db,c,[{id:'p',name:'Resource',category:'cloud',price:'9.00',cost:'7.00',currency:'USDC',enabled:true,quotedAt:Date.now(),supplierSku:'sku'}],node);assert.throws(()=>orders.create('wallet:0x'+'1'.repeat(40),'p',1),/SERVICE_PURCHASES_PAUSED/);assert.equal((db.prepare('SELECT count(*) n FROM orders').get() as {n:number}).n,0);db.close()});
