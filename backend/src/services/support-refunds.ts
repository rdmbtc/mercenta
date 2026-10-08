import {createHmac,randomUUID} from 'node:crypto';
import type {DB} from '../db.js';
import {encryptCode,decryptCode} from './fulfillment/index.js';
import {refundInput,containsSupportSecret} from './refund-input.js';
export type RefundStatus='SUBMITTED'|'IN_REVIEW'|'CLOSED';
type Row={id:string;request_id:string;fingerprint:string;contact_hash:string;source_hash:string;payload:string;status:RefundStatus;created_at:number;updated_at:number};
export class SupportRefunds {
 private key:string;
 constructor(private db:DB,root:string){
 if(!/^[a-f0-9]{64}$/i.test(root))throw Error('SUPPORT_NOT_CONFIGURED');
 this.key=createHmac('sha256',Buffer.from(root,'hex')).update('mercenta/support/refund/v1').digest('hex');
 db.exec(`CREATE TABLE IF NOT EXISTS support_refunds(id TEXT PRIMARY KEY,request_id TEXT UNIQUE NOT NULL,fingerprint TEXT NOT NULL,contact_hash TEXT NOT NULL,source_hash TEXT NOT NULL,payload TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN ('SUBMITTED','IN_REVIEW','CLOSED')),created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL);
 CREATE INDEX IF NOT EXISTS support_refunds_contact ON support_refunds(contact_hash,created_at);
 CREATE INDEX IF NOT EXISTS support_refunds_source ON support_refunds(source_hash,created_at);
 CREATE TABLE IF NOT EXISTS support_refund_reviews(id INTEGER PRIMARY KEY AUTOINCREMENT,ticket_id TEXT NOT NULL REFERENCES support_refunds(id),status TEXT NOT NULL,created_at INTEGER NOT NULL);
 `);
 }
 private hash(s:string){return createHmac('sha256',this.key).update(s).digest('hex');}
 submit(raw:unknown,source:string,now=Date.now()){
 const input=refundInput.parse(raw);if(containsSupportSecret(input.details))throw Error('DO_NOT_SHARE_SECRETS');
 if(!/^[a-f0-9]{64}$/.test(source))throw Error('UNAUTHORIZED');
 const fingerprint=this.hash(JSON.stringify(input)),contact=this.hash(input.email);
 return this.db.transaction(()=>{
 const old=this.db.prepare('SELECT * FROM support_refunds WHERE request_id=?').get(input.requestId) as Row|undefined;
 if(old){if(old.fingerprint!==fingerprint)throw Error('IDEMPOTENCY_CONFLICT');return this.result(old);}
 const n=(sql:string,...args:(string|number)[])=>(this.db.prepare(sql).get(...args) as {n:number}).n;
 if(n('SELECT count(*) n FROM support_refunds WHERE contact_hash=? AND created_at>?',contact,now-86400000)>=5||n('SELECT count(*) n FROM support_refunds WHERE source_hash=? AND created_at>?',source,now-3600000)>=6)throw Error('SUPPORT_RATE_LIMIT');
 if(n("SELECT count(*) n FROM support_refunds WHERE status!='CLOSED'")>=10000)throw Error('SUPPORT_QUEUE_NOT_CONFIGURED');
 const row:Row={id:randomUUID(),request_id:input.requestId,fingerprint,contact_hash:contact,source_hash:source,payload:encryptCode(JSON.stringify(input),this.key),status:'SUBMITTED',created_at:now,updated_at:now};
 this.db.prepare('INSERT INTO support_refunds VALUES(?,?,?,?,?,?,?,?,?)').run(row.id,row.request_id,row.fingerprint,row.contact_hash,row.source_hash,row.payload,row.status,now,now);
 return this.result(row);
 })();
 }
 private result(row:Row){return {ticketId:row.id,status:row.status,createdAt:row.created_at,manualReview:true,refundExecuted:false,ownershipVerified:false};}
 list(){return this.db.prepare('SELECT id,status,created_at,updated_at FROM support_refunds ORDER BY created_at DESC LIMIT 100').all();}
 read(id:string){const row=this.db.prepare('SELECT * FROM support_refunds WHERE id=?').get(id) as Row|undefined;if(!row)throw Error('SUPPORT_TICKET_NOT_FOUND');return {...this.result(row),request:JSON.parse(decryptCode(row.payload,this.key))};}
 review(id:string,status:RefundStatus,now=Date.now()){
 if(!['SUBMITTED','IN_REVIEW','CLOSED'].includes(status))throw Error('INVALID_REQUEST');
 return this.db.transaction(()=>{const row=this.db.prepare('SELECT * FROM support_refunds WHERE id=?').get(id) as Row|undefined;if(!row)throw Error('SUPPORT_TICKET_NOT_FOUND');
 this.db.prepare('UPDATE support_refunds SET status=?,updated_at=? WHERE id=?').run(status,now,id);
 this.db.prepare('INSERT INTO support_refund_reviews(ticket_id,status,created_at) VALUES(?,?,?)').run(id,status,now);
 return {ticketId:id,status,refundExecuted:false};})();
 }
}
