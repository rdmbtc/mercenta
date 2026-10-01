import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
export type DB = Database.Database;
export function openDb(path: string): DB {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = FULL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  db.aggregate("signed_micro_sum", {
    start: () => 0n,
    step: (total: bigint, next: unknown) => total + BigInt(String(next)),
    result: (total: bigint) => total.toString(),
  });
  db.exec(`
 CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,actor TEXT NOT NULL,product_id TEXT NOT NULL,quantity INTEGER NOT NULL,sale_units TEXT NOT NULL,cost_units TEXT NOT NULL,quote_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,status TEXT NOT NULL,tx_hash TEXT UNIQUE,request_ref TEXT UNIQUE,encrypted_code TEXT,revealed_at INTEGER,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS order_requests(actor TEXT NOT NULL,id TEXT NOT NULL,fingerprint TEXT NOT NULL,order_id TEXT NOT NULL REFERENCES orders(id),PRIMARY KEY(actor,id));
 CREATE TABLE IF NOT EXISTS payments(tx_hash TEXT PRIMARY KEY,order_id TEXT UNIQUE NOT NULL REFERENCES orders(id),amount_units TEXT NOT NULL,block_hash TEXT NOT NULL,verified_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS decisions(id TEXT PRIMARY KEY,order_id TEXT NOT NULL REFERENCES orders(id),decision TEXT NOT NULL,inputs_json TEXT NOT NULL,checks_json TEXT NOT NULL,reason_hash TEXT NOT NULL,created_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS approvals(id TEXT PRIMARY KEY,order_id TEXT UNIQUE NOT NULL REFERENCES orders(id),status TEXT NOT NULL DEFAULT 'PENDING',resolved_by TEXT,resolved_at INTEGER);
 CREATE TABLE IF NOT EXISTS ledger_batches(id TEXT PRIMARY KEY,witness TEXT NOT NULL,created_at INTEGER NOT NULL,sealed INTEGER NOT NULL DEFAULT 0 CHECK(sealed IN(0,1)));
 CREATE TABLE IF NOT EXISTS ledger_entries(id INTEGER PRIMARY KEY,batch_id TEXT NOT NULL REFERENCES ledger_batches(id),account TEXT NOT NULL,currency TEXT NOT NULL CHECK(currency IN('USDC','USD')),direction TEXT NOT NULL CHECK(direction IN('DEBIT','CREDIT')),amount_units TEXT NOT NULL CHECK(length(amount_units)>0 AND amount_units NOT GLOB '*[^0-9]*'));
 CREATE TABLE IF NOT EXISTS ai_quotas(identifier TEXT PRIMARY KEY,used INTEGER NOT NULL DEFAULT 0 CHECK(used BETWEEN 0 AND 10));
 CREATE TABLE IF NOT EXISTS ai_requests(id TEXT NOT NULL,actor TEXT NOT NULL,state TEXT NOT NULL,response TEXT,PRIMARY KEY(actor,id));
 CREATE TABLE IF NOT EXISTS sandbox_treasury(actor TEXT PRIMARY KEY,available_units TEXT NOT NULL,deposited_units TEXT NOT NULL DEFAULT '0',debt_units TEXT NOT NULL DEFAULT '0',collateral_units TEXT NOT NULL DEFAULT '0');
 CREATE TABLE IF NOT EXISTS operations(actor TEXT NOT NULL,id TEXT NOT NULL,fingerprint TEXT NOT NULL,response TEXT NOT NULL,PRIMARY KEY(actor,id));
 CREATE TABLE IF NOT EXISTS reconciliations(order_id TEXT PRIMARY KEY REFERENCES orders(id),attempts INTEGER NOT NULL DEFAULT 0,next_at INTEGER NOT NULL,lease_until INTEGER NOT NULL DEFAULT 0);
 CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
 CREATE INDEX IF NOT EXISTS reconciliation_next_idx ON reconciliations(next_at);
 CREATE TRIGGER IF NOT EXISTS batch_requires_balance BEFORE UPDATE OF sealed ON ledger_batches WHEN NEW.sealed=1 AND ((SELECT count(*) FROM ledger_entries WHERE batch_id=NEW.id)<2 OR EXISTS(SELECT currency FROM ledger_entries WHERE batch_id=NEW.id GROUP BY currency HAVING signed_micro_sum(CASE WHEN direction='DEBIT' THEN amount_units ELSE '-'||amount_units END)<>'0')) BEGIN SELECT RAISE(ABORT,'UNBALANCED_JOURNAL'); END;
 CREATE TRIGGER IF NOT EXISTS ledger_no_update BEFORE UPDATE ON ledger_entries BEGIN SELECT RAISE(ABORT,'IMMUTABLE_LEDGER'); END;
 CREATE TRIGGER IF NOT EXISTS ledger_no_delete BEFORE DELETE ON ledger_entries BEGIN SELECT RAISE(ABORT,'IMMUTABLE_LEDGER'); END;
 CREATE TRIGGER IF NOT EXISTS ledger_no_late_insert BEFORE INSERT ON ledger_entries WHEN (SELECT sealed FROM ledger_batches WHERE id=NEW.batch_id)=1 BEGIN SELECT RAISE(ABORT,'SEALED_BATCH'); END;
 CREATE TRIGGER IF NOT EXISTS batch_no_delete BEFORE DELETE ON ledger_batches BEGIN SELECT RAISE(ABORT,'IMMUTABLE_BATCH'); END;
 CREATE TRIGGER IF NOT EXISTS batch_no_change BEFORE UPDATE ON ledger_batches WHEN OLD.sealed=1 OR NEW.id<>OLD.id OR NEW.witness<>OLD.witness OR NEW.created_at<>OLD.created_at BEGIN SELECT RAISE(ABORT,'IMMUTABLE_BATCH'); END;
 CREATE TRIGGER IF NOT EXISTS decision_no_update BEFORE UPDATE ON decisions BEGIN SELECT RAISE(ABORT,'IMMUTABLE_DECISION'); END;
 CREATE TRIGGER IF NOT EXISTS decision_no_delete BEFORE DELETE ON decisions BEGIN SELECT RAISE(ABORT,'IMMUTABLE_DECISION'); END;
 CREATE TRIGGER IF NOT EXISTS payment_no_update BEFORE UPDATE ON payments BEGIN SELECT RAISE(ABORT,'IMMUTABLE_PAYMENT'); END;
 CREATE TRIGGER IF NOT EXISTS payment_no_delete BEFORE DELETE ON payments BEGIN SELECT RAISE(ABORT,'IMMUTABLE_PAYMENT'); END;
 `);
  return db;
}
