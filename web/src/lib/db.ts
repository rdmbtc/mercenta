// Immutable Decision Logging & Database Schema — deterministic architecture Standard
// SQLite via better-sqlite3. Triggers prohibit UPDATE/DELETE on decisions.
// Zero LLM authority over financial mutation.

import {mkdirSync} from "node:fs";
import {dirname} from "node:path";
import Database from "better-sqlite3";
import type { PolicyDecision } from "./policy-engine";

export interface OrderRow {
  id: string;
  product_id: string;
  customer_wallet: string;
  sale_amount_usdc_units: bigint;
  status: string;
  payment_tx_hash: string | null;
  delivery_status: string;
  expires_at: number;
  created_at: number;
  updated_at: number;
}

export interface DecisionRow {
  id: string;
  order_id: string;
  decision: PolicyDecision;
  reason_codes: string; // JSON array
  policy_version: string;
  inputs_json: string;
  agent_summary: string | null;
  created_at: number;
}

export interface ApprovalRow {
  id: string;
  decision_id: string;
  order_id: string;
  required_limit_units: bigint;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approved_by: string | null;
  created_at: number;
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  customer_wallet TEXT NOT NULL,
  sale_amount_usdc_units INTEGER NOT NULL,
  status TEXT NOT NULL,
  payment_tx_hash TEXT UNIQUE,
  delivery_status TEXT NOT NULL DEFAULT 'NONE',
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  decision TEXT NOT NULL,
  reason_codes TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  inputs_json TEXT NOT NULL,
  agent_summary TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS approvals (
  id TEXT PRIMARY KEY,
  decision_id TEXT NOT NULL REFERENCES decisions(id),
  order_id TEXT NOT NULL REFERENCES orders(id),
  required_limit_units INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED')),
  approved_by TEXT,
  created_at INTEGER NOT NULL
);

-- Immutability triggers for decisions table
CREATE TRIGGER IF NOT EXISTS prevent_decisions_update
BEFORE UPDATE ON decisions
BEGIN
  SELECT RAISE(ABORT, 'IMMUTABLE: decisions table cannot be updated');
END;

CREATE TRIGGER IF NOT EXISTS prevent_decisions_delete
BEFORE DELETE ON decisions
BEGIN
  SELECT RAISE(ABORT, 'IMMUTABLE: decisions table cannot be deleted from');
END;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_wallet);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_expires ON orders(expires_at);
CREATE INDEX IF NOT EXISTS idx_decisions_order ON decisions(order_id);
CREATE INDEX IF NOT EXISTS idx_approvals_order ON approvals(order_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);

-- Wallet auth: one-time nonces for SIWx sign-in. address set = consumed.
CREATE TABLE IF NOT EXISTS auth_nonces (
 nonce TEXT PRIMARY KEY,
 address TEXT,
 expires_at_ms INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_auth_nonces_expiry ON auth_nonces(expires_at_ms);

-- AI Agent consultation quota tracking (10 free requests, then Mainnet paid)
CREATE TABLE IF NOT EXISTS ai_quotas (
  identifier TEXT PRIMARY KEY,
  free_requests_used INTEGER NOT NULL DEFAULT 0,
  paid_requests_count INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);
`;

let _db: Database.Database | null = null;

/**
 * Initialize or return existing SQLite database connection.
 * @param path - Database file path. Defaults to in-memory for testing.
 */
export function getDb(path?: string): Database.Database {
  if (_db) return _db;
  const dbPath = path ?? (process.env.NODE_ENV === "test" ? ":memory:" : process.env.WEB_AUTH_DATABASE_PATH ?? "data/auth.sqlite");
  if(dbPath !== ":memory:") mkdirSync(dirname(dbPath),{recursive:true});
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA_SQL);
  _db = db;
  return db;
}

/** Reset singleton (for testing only). */
export function resetDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

/** Check if a tx hash has been consumed (used by any order). */
export function isTxConsumed(db: Database.Database, txHash: string): boolean {
  const row = db
    .prepare("SELECT 1 FROM orders WHERE payment_tx_hash = ? LIMIT 1")
    .get(txHash.toLowerCase());
  return row !== undefined;
}
