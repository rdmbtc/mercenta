import { randomUUID, createHash } from "node:crypto";
import type { DB } from "../db.js";
import type { Config } from "../config.js";
import type { Product } from "./catalog.js";
import { parseMoney, jsonSafe } from "../money.js";
import { evaluate } from "./policy/index.js";
import { balance, postJournal, transfer } from "./ledger/index.js";
import {
  requestRef,
  encryptCode,
  decryptCode,
  SupplyNode,
  type SupplyResult,
} from "./fulfillment/index.js";
import type { PaymentProof } from "./arc/index.js";
export type Order = {
  id: string;
  actor: string;
  product_id: string;
  quantity: number;
  sale_units: string;
  cost_units: string;
  quote_at: number;
  expires_at: number;
  status: string;
  tx_hash: string | null;
  request_ref: string | null;
  encrypted_code: string | null;
  revealed_at: number | null;
  created_at: number;
};
export class Orders {
  constructor(
    private db: DB,
    private c: Config,
    private products: Product[],
    private supplier: SupplyNode,
  ) {}
  get(id: string) {
    return this.db.prepare("SELECT * FROM orders WHERE id=?").get(id) as
      | Order
      | undefined;
  }
  createIdempotent(
    actor: string,
    requestId: string,
    productId: string,
    quantity: number,
  ) {
    return this.db.transaction(() => {
      const fp = createHash("sha256")
        .update(jsonSafe({ productId, quantity }))
        .digest("hex");
      const prior = this.db
        .prepare("SELECT * FROM order_requests WHERE actor=? AND id=?")
        .get(actor, requestId) as
        | { fingerprint: string; order_id: string }
        | undefined;
      if (prior) {
        if (prior.fingerprint !== fp) throw new Error("IDEMPOTENCY_CONFLICT");
        return this.get(prior.order_id)!;
      }
      const order = this.create(actor, productId, quantity);
      this.db
        .prepare("INSERT INTO order_requests VALUES(?,?,?,?)")
        .run(actor, requestId, fp, order.id);
      return order;
    })();
  }
  create(actor: string, productId: string, quantity: number) {
    if (!this.supplier.ready) throw new Error("SERVICE_PURCHASES_PAUSED");
    const p = this.products.find((p) => p.id === productId && p.enabled);
    if (!p || !p.cost || !p.supplierSku)
      throw new Error("VERIFIED_SUPPLIER_QUOTE_REQUIRED");
    if (Date.now() - p.quotedAt > 300000 || p.quotedAt > Date.now())
      throw new Error("STALE_SUPPLIER_QUOTE");
    const id = randomUUID(),
      now = Date.now();
    this.db
      .prepare(
        "INSERT INTO orders(id,actor,product_id,quantity,sale_units,cost_units,quote_at,expires_at,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,'AWAITING_PAYMENT',?,?)",
      )
      .run(
        id,
        actor,
        p.id,
        quantity,
        (parseMoney(p.price) * BigInt(quantity)).toString(),
        (parseMoney(p.cost) * BigInt(quantity)).toString(),
        p.quotedAt,
        now + 900000,
        now,
        now,
      );
    return this.get(id)!;
  }
  async resolveApproval(id: string, reviewer: string, approve: boolean) {
    const authorized =
      this.c.MERCHANT_WALLET &&
      reviewer === "wallet:" + this.c.MERCHANT_WALLET.toLowerCase();
    if (!authorized) throw new Error("MERCHANT_AUTH_REQUIRED");
    const accepted = this.db.transaction(() => {
      const row = this.db
        .prepare("SELECT * FROM approvals WHERE id=? AND status='PENDING'")
        .get(id) as { order_id: string } | undefined;
      if (!row) throw new Error("APPROVAL_NOT_PENDING");
      const o = this.get(row.order_id);
      if (!o || o.status !== "ESCALATED") throw new Error("APPROVAL_CONFLICT");
      const payment = this.db
        .prepare("SELECT * FROM payments WHERE order_id=?")
        .get(o.id) as {
        amount_units: string;
        tx_hash: string;
        block_hash: string;
      };
      const input = this.policy(
        o,
        {
          amount: BigInt(payment.amount_units),
          confirmations: 2n,
          txHash: payment.tx_hash,
          blockHash: payment.block_hash,
        },
        true,
      );
      const result = evaluate(input);
      const decision = approve ? result.decision : "HUMAN_REJECTED",
        did = randomUUID();
      this.db
        .prepare("INSERT INTO decisions VALUES(?,?,?,?,?,?,?)")
        .run(
          did,
          o.id,
          decision,
          jsonSafe({ ...input, reviewer }),
          jsonSafe(result.checks),
          createHash("sha256")
            .update(jsonSafe({ input, result, reviewer, approve }))
            .digest("hex"),
          Date.now(),
        );
      const ok = approve && result.decision === "AUTO_APPROVED";
      this.db
        .prepare(
          "UPDATE approvals SET status=?,resolved_by=?,resolved_at=? WHERE id=?",
        )
        .run(
          ok ? "APPROVED" : approve ? "POLICY_BLOCKED" : "REJECTED",
          reviewer,
          Date.now(),
          id,
        );
      this.db
        .prepare("UPDATE orders SET status=?,updated_at=? WHERE id=?")
        .run(ok ? "APPROVED" : "REFUND_REQUIRED", Date.now(), o.id);
      if (ok)
        transfer(
          this.db,
          "reserve:" + o.id,
          did,
          "arc:usdc:available",
          "arc:usdc:reserved",
          BigInt(o.cost_units),
        );
      return ok ? o.id : null;
    })();
    if (accepted) await this.fulfill(accepted);
    return { resolved: true, orderId: accepted };
  }
  pendingApprovals(reviewer: string) {
    if (
      !this.c.MERCHANT_WALLET ||
      reviewer !== "wallet:" + this.c.MERCHANT_WALLET.toLowerCase()
    )
      throw new Error("MERCHANT_AUTH_REQUIRED");
    return this.db
      .prepare(
        "SELECT id,order_id,status FROM approvals WHERE status='PENDING'",
      )
      .all();
  }
  private policy(o: Order, proof: PaymentProof, humanApproved = false) {
    const p = this.products.find((x) => x.id === o.product_id);
    const daily = this.db
      .prepare(
        "SELECT cost_units FROM orders WHERE status IN('APPROVED','PURCHASING','SUPPLIER_UNKNOWN','FULFILLED') AND created_at>=?",
      )
      .all(Date.now() - 86400000) as { cost_units: string }[];
    return {
      confirmations: proof.confirmations,
      paid: proof.amount,
      sale: BigInt(o.sale_units),
      cost: BigInt(o.cost_units),
      replay: false,
      active: p?.enabled === true,
      supplierReady: this.supplier.ready,
      dailySpent: daily.reduce((n, r) => n + BigInt(r.cost_units), 0n),
      available: balance(this.db, "arc:usdc:available"),
      quoteAt: o.quote_at,
      now: Date.now(),
      humanApproved,
    };
  }
  async acceptPayment(id: string, actor: string, proof: PaymentProof) {
    const ready = this.db.transaction(() => {
      const o = this.get(id);
      if (!o || o.actor !== actor) throw new Error("ORDER_NOT_FOUND");
      if (o.status !== "AWAITING_PAYMENT" || o.expires_at < Date.now())
        throw new Error("ORDER_NOT_PAYABLE");
      if (proof.confirmations < 2n || proof.amount < BigInt(o.sale_units))
        throw new Error("PAYMENT_INSUFFICIENT_OR_NOT_FINAL");
      this.db
        .prepare("INSERT INTO payments VALUES(?,?,?,?,?)")
        .run(
          proof.txHash,
          id,
          proof.amount.toString(),
          proof.blockHash,
          Date.now(),
        );
      transfer(
        this.db,
        "payment:" + id,
        proof.txHash,
        "customer:usdc:liability",
        "arc:usdc:available",
        proof.amount,
      );
      const input = this.policy(o, proof),
        result = evaluate(input),
        decisionId = randomUUID();
      this.db
        .prepare("INSERT INTO decisions VALUES(?,?,?,?,?,?,?)")
        .run(
          decisionId,
          id,
          result.decision,
          jsonSafe(input),
          jsonSafe(result.checks),
          createHash("sha256")
            .update(jsonSafe({ input, result }))
            .digest("hex"),
          Date.now(),
        );
      const status =
        result.decision === "AUTO_APPROVED"
          ? "APPROVED"
          : result.decision === "ESCALATED"
            ? "ESCALATED"
            : "BLOCKED";
      this.db
        .prepare("UPDATE orders SET status=?,tx_hash=?,updated_at=? WHERE id=?")
        .run(status, proof.txHash, Date.now(), id);
      if (status === "ESCALATED")
        this.db
          .prepare("INSERT INTO approvals(id,order_id) VALUES(?,?)")
          .run(randomUUID(), id);
      if (status === "APPROVED")
        transfer(
          this.db,
          "reserve:" + id,
          decisionId,
          "arc:usdc:available",
          "arc:usdc:reserved",
          BigInt(o.cost_units),
        );
      return status === "APPROVED";
    })();
    if (ready) await this.fulfill(id);
    return this.public(this.get(id)!);
  }
  async fulfill(id: string) {
    const claimed = this.db.transaction(() => {
      const o = this.get(id);
      if (!o || o.status !== "APPROVED") return undefined;
      const ref = requestRef(this.c.REQUEST_REF_SECRET, id);
      const r = this.db
        .prepare(
          "UPDATE orders SET status='PURCHASING',request_ref=?,updated_at=? WHERE id=? AND status='APPROVED'",
        )
        .run(ref, Date.now(), id);
      return r.changes === 1 ? { ...o, request_ref: ref } : undefined;
    })();
    if (!claimed) return;
    const p = this.products.find((x) => x.id === claimed.product_id);
    if (!p?.supplierSku) {
      this.unknown(id);
      return;
    }
    // A persisted PURCHASING claim precedes the sole purchase call. A restart reconciles; it never purchases again.
    const result = await this.supplier.purchase(
      claimed.request_ref,
      p.supplierSku,
      claimed.quantity,
    );
    this.applySupply(id, result);
  }
  unknown(id: string) {
    this.db.transaction(() => {
      this.db
        .prepare(
          "UPDATE orders SET status='SUPPLIER_UNKNOWN',updated_at=? WHERE id=? AND status IN('PURCHASING','SUPPLIER_UNKNOWN')",
        )
        .run(Date.now(), id);
      this.db
        .prepare(
          "INSERT OR IGNORE INTO reconciliations(order_id,next_at) VALUES(?,?)",
        )
        .run(id, Date.now() + 15000);
    })();
  }
  applySupply(id: string, r: SupplyResult) {
    if (r.status !== "COMPLETED" && r.status !== "NOT_EXECUTED") {
      this.unknown(id);
      return;
    }
    this.db.transaction(() => {
      const o = this.get(id);
      if (!o || !["PURCHASING", "SUPPLIER_UNKNOWN"].includes(o.status)) return;
      if (r.status === "COMPLETED") {
        const cost = BigInt(o.cost_units),
          sale = BigInt(o.sale_units);
        transfer(
          this.db,
          "cost:" + id,
          o.request_ref!,
          "arc:usdc:reserved",
          "settlement:usdc:paid",
          cost,
        );
        postJournal(this.db, "fulfillment:" + id, o.request_ref!, [
          {
            account: "customer:usdc:liability",
            currency: "USDC",
            direction: "DEBIT",
            amount: sale,
          },
          {
            account: "revenue:usdc",
            currency: "USDC",
            direction: "CREDIT",
            amount: sale,
          },
          {
            account: "cogs:usd",
            currency: "USD",
            direction: "DEBIT",
            amount: cost,
          },
          {
            account: "inventory:usd",
            currency: "USD",
            direction: "CREDIT",
            amount: cost,
          },
        ]);
        this.db
          .prepare(
            "UPDATE orders SET status='FULFILLED',encrypted_code=?,updated_at=? WHERE id=?",
          )
          .run(
            encryptCode(r.code, this.c.DELIVERY_ENCRYPTION_KEY),
            Date.now(),
            id,
          );
      } else {
        transfer(
          this.db,
          "release:" + id,
          o.request_ref!,
          "arc:usdc:reserved",
          "arc:usdc:available",
          BigInt(o.cost_units),
        );
        this.db
          .prepare(
            "UPDATE orders SET status='REFUND_REQUIRED',updated_at=? WHERE id=?",
          )
          .run(Date.now(), id);
      }
      this.db.prepare("DELETE FROM reconciliations WHERE order_id=?").run(id);
    })();
  }
  reveal(id: string, actor: string) {
    return this.db.transaction(() => {
      const o = this.get(id);
      if (
        !o ||
        o.actor !== actor ||
        o.status !== "FULFILLED" ||
        o.revealed_at !== null ||
        !o.encrypted_code
      )
        throw new Error("DELIVERY_UNAVAILABLE");
      const code = decryptCode(
        o.encrypted_code,
        this.c.DELIVERY_ENCRYPTION_KEY,
      );
      this.db
        .prepare(
          "UPDATE orders SET revealed_at=? WHERE id=? AND revealed_at IS NULL",
        )
        .run(Date.now(), id);
      return { code };
    })();
  }
  public(o: Order) {
    return {
      id: o.id,
      productId: o.product_id,
      quantity: o.quantity,
      saleUnits: o.sale_units,
      status: o.status,
      paymentTxHash: o.tx_hash,
      expiresAt: o.expires_at,
    };
  }
  recover() {
    const rows = this.db
      .prepare("SELECT id FROM orders WHERE status='PURCHASING'")
      .all() as { id: string }[];
    for (const r of rows) this.unknown(r.id);
  }
}
