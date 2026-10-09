/** Durable preparation seam. No signer, supplier POST, automatic refund or public write route. */
import Database from 'better-sqlite3';
import {createHash, randomUUID} from 'node:crypto';
import {z} from 'zod';
import {assertProductionNamespace} from './production-mainnet.js';
import {verifyMainnetUsdcReceipt} from './mainnet-usdc-receipt.js';
import type {WitnessPorts} from './receipt-proof-generator.js';

const micro = z.string().regex(/^(0|[1-9]\d{0,11})$/);
const wallet = z.string().regex(/^0x[a-fA-F0-9]{40}$/).refine(v => !/^0x0{40}$/i.test(v));
const quoteSchema = z.object({
  reference: z.string().uuid(), owner: wallet, merchant: wallet,
  sku: z.string().min(1).max(128), region: z.string().regex(/^[A-Z0-9_-]{2,16}$/),
  quantity: z.literal(1), saleMicro: micro, costMicro: micro,
  expiresAt: z.number().int().safe(), chainId: z.literal(5042),
}).strict();
export type StagingQuote = z.infer<typeof quoteSchema>;
export type StagingState = 'QUOTED' | 'AUTHORIZED' | 'PAYMENT_VERIFIED' | 'SUPPLY_RESERVED' |
  'PROCUREMENT_SUBMITTED' | 'SUPPLIER_UNKNOWN' | 'DELIVERY_PENDING' | 'DELIVERED' | 'CANCELLED';
type Row = {id: string; owner: string; body: string; fingerprint: string; state: StagingState; reserve_micro: string; created_at: number};
const edges: Record<StagingState, readonly StagingState[]> = {
  QUOTED: ['AUTHORIZED','CANCELLED'], AUTHORIZED: ['PAYMENT_VERIFIED','CANCELLED'],
  PAYMENT_VERIFIED: ['SUPPLY_RESERVED'], SUPPLY_RESERVED: ['PROCUREMENT_SUBMITTED'],
  PROCUREMENT_SUBMITTED: ['SUPPLIER_UNKNOWN','DELIVERY_PENDING'],
  SUPPLIER_UNKNOWN: ['DELIVERY_PENDING'], DELIVERY_PENDING: ['DELIVERED'],
  DELIVERED: [], CANCELLED: [],
};

export class MainnetStagingStore {
  readonly db: Database.Database;
  constructor(path: string, testnetPath: string) {
    assertProductionNamespace(path, testnetPath);
    this.db = new Database(path);
    const tables = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as {name:string}[];
    if(tables.some(t=>!t.name.startsWith('staging_') && !t.name.startsWith('sqlite_'))) {this.db.close();throw Error('STAGING_DATABASE_NOT_EMPTY_OR_ISOLATED');}
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = FULL');
    this.db.pragma('busy_timeout = 5000');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS staging_metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS staging_orders(
        id TEXT PRIMARY KEY, reference TEXT NOT NULL UNIQUE, owner TEXT NOT NULL,
        body TEXT NOT NULL, fingerprint TEXT NOT NULL, state TEXT NOT NULL,
        reserve_micro TEXT NOT NULL DEFAULT '0', created_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS staging_events(
        sequence INTEGER PRIMARY KEY AUTOINCREMENT, order_id TEXT NOT NULL,
        from_state TEXT, to_state TEXT NOT NULL, occurred_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS staging_receipts(
        tx_hash TEXT PRIMARY KEY, order_id TEXT NOT NULL UNIQUE, binding TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS staging_refund_requests(
        order_id TEXT PRIMARY KEY, requested_at INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'MANUAL_REVIEW');
      CREATE TRIGGER IF NOT EXISTS staging_event_no_update BEFORE UPDATE ON staging_events BEGIN SELECT RAISE(ABORT,'APPEND_ONLY'); END;
      CREATE TRIGGER IF NOT EXISTS staging_event_no_delete BEFORE DELETE ON staging_events BEGIN SELECT RAISE(ABORT,'APPEND_ONLY'); END;
    `);
    const pin = this.db.prepare('SELECT value FROM staging_metadata WHERE key=?').get('network') as {value:string}|undefined;
    if (pin && pin.value !== 'arc-mainnet:5042:staging-v1') { this.db.close(); throw Error('DATABASE_NETWORK_MISMATCH'); }
    this.db.prepare('INSERT OR IGNORE INTO staging_metadata(key,value) VALUES(?,?)').run('network','arc-mainnet:5042:staging-v1');
  }
  close() { this.db.close(); }
  quote(raw: unknown, now = Date.now()) {
    const q = quoteSchema.parse(raw);
    if (q.expiresAt <= now || q.expiresAt > now + 600000 || BigInt(q.saleMicro) <= 0n || BigInt(q.costMicro) <= 0n || BigInt(q.saleMicro) < BigInt(q.costMicro) || BigInt(q.saleMicro)>1000000n || BigInt(q.costMicro)>1000000n || q.owner.toLowerCase()===q.merchant.toLowerCase()) throw Error('INVALID_QUOTE');
    const body = JSON.stringify({...q,owner:q.owner.toLowerCase(),merchant:q.merchant.toLowerCase()});
    const fingerprint = createHash('sha256').update(body).digest('hex');
    return this.db.transaction(() => {
      const old = this.db.prepare('SELECT * FROM staging_orders WHERE reference=?').get(q.reference) as Row|undefined;
      if (old) { if (old.fingerprint !== fingerprint) throw Error('REFERENCE_BINDING_MISMATCH'); return old.id; }
      const id = randomUUID();
      this.db.prepare('INSERT INTO staging_orders(id,reference,owner,body,fingerprint,state,created_at) VALUES(?,?,?,?,?,?,?)').run(id,q.reference,q.owner.toLowerCase(),body,fingerprint,'QUOTED',now);
      this.db.prepare('INSERT INTO staging_events(order_id,to_state,occurred_at) VALUES(?,?,?)').run(id,'QUOTED',now);
      return id;
    }).immediate();
  }
  owned(id: string, owner: string): Row {
    const row = this.db.prepare('SELECT * FROM staging_orders WHERE id=? AND owner=?').get(id,owner.toLowerCase()) as Row|undefined;
    if (!row) throw Error('ORDER_NOT_FOUND');
    return row;
  }
  private move(row: Row, next: StagingState, now: number) {
    if (!edges[row.state].includes(next)) throw Error('ILLEGAL_ORDER_TRANSITION');
    const r = this.db.prepare('UPDATE staging_orders SET state=? WHERE id=? AND state=?').run(next,row.id,row.state);
    if (r.changes !== 1) throw Error('ORDER_STATE_CONFLICT');
    this.db.prepare('INSERT INTO staging_events(order_id,from_state,to_state,occurred_at) VALUES(?,?,?,?)').run(row.id,row.state,next,now);
  }
  authorize(id: string, owner: string, now = Date.now()) {
    this.db.transaction(() => {
      const row = this.owned(id,owner), q = JSON.parse(row.body) as StagingQuote;
      if (q.expiresAt <= now) throw Error('QUOTE_EXPIRED');
      this.move(row,'AUTHORIZED',now);
    }).immediate();
  }
  /** Read-only witness verification, then atomic unique attribution. Never signs or pays. */
  async verifyPayment(id: string, owner: string, hash: string, assetKind: 'erc20'|'native', witnesses: {primaryWitness:WitnessPorts;secondaryWitness:WitnessPorts}, now = Date.now()) {
    const q=JSON.parse(this.owned(id,owner).body) as StagingQuote;
    const receipt=await verifyMainnetUsdcReceipt({hash,sender:q.owner,recipient:q.merchant,amountMicro:BigInt(q.saleMicro),assetKind},witnesses);
    if(receipt.status!=='VERIFIED')throw Error('PAYMENT_NOT_VERIFIED');
    const proof={chainId:5042,txHash:receipt.hash,sender:receipt.sender,recipient:receipt.recipient,amountMicro:receipt.amountMicro};
    this.db.transaction(() => {
      const row = this.owned(id,owner), q = JSON.parse(row.body) as StagingQuote;
      if (proof.sender.toLowerCase() !== q.owner.toLowerCase() || proof.recipient.toLowerCase() !== q.merchant.toLowerCase() || proof.amountMicro !== q.saleMicro) throw Error('PAYMENT_BINDING_MISMATCH');
      const tx = proof.txHash.toLowerCase();
      const old = this.db.prepare('SELECT order_id FROM staging_receipts WHERE tx_hash=?').get(tx) as {order_id:string}|undefined;
      if (old) { if (old.order_id !== id) throw Error('PAYMENT_ALREADY_ATTRIBUTED'); return; }
      if (q.expiresAt <= now) throw Error('EXPIRED_PAYMENT_REQUIRES_MANUAL_RECONCILIATION');
      this.move(row,'PAYMENT_VERIFIED',now);
      this.db.prepare('INSERT INTO staging_receipts(tx_hash,order_id,binding) VALUES(?,?,?)').run(tx,id,JSON.stringify(receipt));
    }).immediate();
  }
  reserve(id: string, owner: string, raw: unknown, now = Date.now()) {
    const balance = z.object({availableUsdMicro:micro,observedAt:z.number().int().safe()}).strict().parse(raw);
    this.db.transaction(() => {
      const row = this.owned(id,owner), q = JSON.parse(row.body) as StagingQuote;
      if (balance.observedAt > now || now - balance.observedAt > 15000) throw Error('RESERVE_BALANCE_STALE');
      const rows = this.db.prepare('SELECT reserve_micro FROM staging_orders').all() as {reserve_micro:string}[];
      const reserved = rows.reduce((sum,r) => sum + BigInt(r.reserve_micro),0n);
      if (BigInt(balance.availableUsdMicro) - reserved - BigInt(q.costMicro) < 10000000n) throw Error('PROCUREMENT_RESERVE_BELOW_TEN_DOLLARS');
      this.move(row,'SUPPLY_RESERVED',now);
      this.db.prepare('UPDATE staging_orders SET reserve_micro=? WHERE id=?').run(q.costMicro,id);
    }).immediate();
  }
  /** Persist this intent BEFORE external procurement I/O; never call twice on restart. */
  procurementIntent(id: string, owner: string, now = Date.now()) {
    return this.db.transaction(() => {const row=this.owned(id,owner);this.move(row,'PROCUREMENT_SUBMITTED',now);return (JSON.parse(row.body) as StagingQuote).reference;}).immediate();
  }
  quarantine(id: string, owner: string, now = Date.now()) {
    this.db.transaction(() => {const row=this.owned(id,owner);this.move(row,'SUPPLIER_UNKNOWN',now);}).immediate();
  }
  requestRefundReview(id: string, owner: string, now = Date.now()) {
    this.db.transaction(() => {
      const row=this.owned(id,owner);
      if (row.state === 'QUOTED' || row.state === 'AUTHORIZED' || row.state === 'CANCELLED') throw Error('NO_VERIFIED_PAYMENT');
      this.db.prepare('INSERT OR IGNORE INTO staging_refund_requests(order_id,requested_at) VALUES(?,?)').run(id,now);
    }).immediate();
    return {status:'MANUAL_REVIEW',refundExecuted:false as const};
  }
  snapshot() {
    const r = this.db.prepare('SELECT COUNT(*) AS count FROM staging_orders').get() as {count:number};
    return {kind:'CLOSED_STAGING_NOT_COMMERCE_RUNTIME',chainId:5042,orders:r.count,journalMode:this.db.pragma('journal_mode',{simple:true}),integrity:this.db.pragma('quick_check',{simple:true}),purchasesEnabled:false,signingEnabled:false};
  }
}
