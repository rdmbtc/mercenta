import {createCipheriv,createDecipheriv,createHash,createHmac,randomBytes,randomUUID} from 'node:crypto';
import {z} from 'zod';
import type {DB} from '../db.js';
export const blindExecuteInput=z.object({requestId:z.string().uuid(),handle:z.string().uuid(),operation:z.literal('demo.digest'),input:z.object({text:z.string().min(1).max(2000)}).strict()}).strict();
export const blindGrantInput=z.object({requestId:z.string().uuid(),confirmSynthetic:z.literal(true)}).strict();
const owner=(a:string)=>{if(!/^wallet:0x[a-f0-9]{40}$/.test(a))throw Error('WALLET_AUTH_REQUIRED');};
const digest=(s:string)=>createHash('sha256').update(s).digest('hex');
type Credential={id:string;actor:string;cipher:string|null;expires_at:number;revoked_at:number|null;used_calls:number;quota_reserved_units:string;created_at:number};
type Job={id:string;actor:string;handle:string;request_id:string;fingerprint:string;state:string;receipt:string|null;created_at:number};
export type BlindReceipt={id:string;handle:string;operation:'demo.digest';state:string;inputDigest:string;outputDigest:string|null;isolation:'SOFTWARE_ISOLATION_DEMO';attestationVerified:false;realProviderCall:false;moneyMoved:false;quotaReservedUnits:string;createdAt:number;};
export function initBlindBroker(db:DB){db.exec(`
CREATE TABLE IF NOT EXISTS blind_credentials(id TEXT PRIMARY KEY,actor TEXT NOT NULL,cipher TEXT,expires_at INTEGER NOT NULL,revoked_at INTEGER,used_calls INTEGER NOT NULL DEFAULT 0,quota_reserved_units TEXT NOT NULL DEFAULT '0',created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS blind_grants(actor TEXT NOT NULL,request_id TEXT NOT NULL,handle TEXT NOT NULL REFERENCES blind_credentials(id),PRIMARY KEY(actor,request_id));
CREATE TABLE IF NOT EXISTS blind_jobs(id TEXT PRIMARY KEY,actor TEXT NOT NULL,handle TEXT NOT NULL REFERENCES blind_credentials(id),request_id TEXT NOT NULL,fingerprint TEXT NOT NULL,state TEXT NOT NULL,receipt TEXT,created_at INTEGER NOT NULL,UNIQUE(actor,request_id));
CREATE INDEX IF NOT EXISTS blind_actor_created ON blind_credentials(actor,created_at);
CREATE TRIGGER IF NOT EXISTS blind_job_terminal_immutable BEFORE UPDATE ON blind_jobs WHEN OLD.state<>'RUNNING' BEGIN SELECT RAISE(ABORT,'IMMUTABLE_BLIND_RECEIPT'); END;
CREATE TRIGGER IF NOT EXISTS blind_job_no_delete BEFORE DELETE ON blind_jobs BEGIN SELECT RAISE(ABORT,'IMMUTABLE_BLIND_RECEIPT'); END;
`);}
export class BlindBroker {
  #key:Buffer;
  #closed=false;
  private active(){if(this.#closed)throw Error("BLIND_BROKER_CLOSED");}
  constructor(private db:DB,rootKey:string){if(!/^[a-f\d]{64}$/i.test(rootKey))throw Error('BLIND_BROKER_NOT_CONFIGURED');this.#key=createHmac('sha256',Buffer.from(rootKey,'hex')).update('mercenta/blind-broker/v1/testnet').digest();initBlindBroker(db);}
  private aad(actor:string,id:string){return Buffer.from('testnet\n'+actor+'\n'+id+'\ndemo.digest');}
  private seal(actor:string,id:string,secret:Buffer){const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',this.#key,iv);c.setAAD(this.aad(actor,id));const data=Buffer.concat([c.update(secret),c.final()]);return [iv,c.getAuthTag(),data].map(v=>v.toString('base64')).join('.');}
  private open(c:Credential){if(!c.cipher)throw Error('BLIND_HANDLE_UNAVAILABLE');const [iv,tag,data]=c.cipher.split('.').map(s=>Buffer.from(s,'base64'));const d=createDecipheriv('aes-256-gcm',this.#key,iv!);d.setAAD(this.aad(c.actor,c.id));d.setAuthTag(tag!);return Buffer.concat([d.update(data!),d.final()]);}
  private credential(actor:string,id:string){owner(actor);const c=this.db.prepare('SELECT * FROM blind_credentials WHERE id=? AND actor=?').get(id,actor) as Credential|undefined;if(!c)throw Error('BLIND_HANDLE_NOT_FOUND');return c;}
  view(actor:string,id:string,now=Date.now()){const c=this.credential(actor,id);return {handle:c.id,operation:'demo.digest' as const,kind:'SYNTHETIC_DEMO' as const,expiresAt:c.expires_at,status:c.revoked_at!==null?'REVOKED':c.expires_at<=now?'EXPIRED':'ACTIVE',callsRemaining:Math.max(0,1-c.used_calls),isolation:'SOFTWARE_ISOLATION_DEMO' as const,attestationVerified:false as const,productionIngestionEnabled:false as const};}
  issueSynthetic(actor:string,raw:unknown,now=Date.now()){
    this.active();owner(actor);const b=blindGrantInput.parse(raw);
    return this.db.transaction(()=>{const previous=this.db.prepare('SELECT handle FROM blind_grants WHERE actor=? AND request_id=?').get(actor,b.requestId) as {handle:string}|undefined;if(previous)return this.view(actor,previous.handle,now);
      this.db.prepare('UPDATE blind_credentials SET cipher=NULL WHERE expires_at<=?').run(now);
      const count=this.db.prepare('SELECT count(*) n FROM blind_credentials WHERE actor=? AND created_at>?').get(actor,now-86400000) as {n:number};if(count.n>=20)throw Error('BLIND_DEMO_DAILY_LIMIT');
      const id=randomUUID(),secret=randomBytes(32);try{this.db.prepare('INSERT INTO blind_credentials(id,actor,cipher,expires_at,created_at) VALUES(?,?,?,?,?)').run(id,actor,this.seal(actor,id,secret),now+600000,now);this.db.prepare('INSERT INTO blind_grants VALUES(?,?,?)').run(actor,b.requestId,id);return this.view(actor,id,now);}finally{secret.fill(0);}
    })();
  }
  revoke(actor:string,id:string,now=Date.now()){this.credential(actor,id);this.db.prepare('UPDATE blind_credentials SET revoked_at=coalesce(revoked_at,?),cipher=NULL WHERE id=? AND actor=?').run(now,id,actor);return this.view(actor,id,now);}
  private receipt(j:Job):BlindReceipt{if(j.receipt)return JSON.parse(j.receipt) as BlindReceipt;return {id:j.id,handle:j.handle,operation:'demo.digest',state:'UNKNOWN',inputDigest:j.fingerprint,outputDigest:null,isolation:'SOFTWARE_ISOLATION_DEMO',attestationVerified:false,realProviderCall:false,moneyMoved:false,quotaReservedUnits:'1000',createdAt:j.created_at};}
  async execute(actor:string,raw:unknown,now=Date.now(),internalExecutor?:(secret:Buffer,text:string,signal:AbortSignal)=>Promise<string>){
    this.active();owner(actor);const b=blindExecuteInput.parse(raw),fingerprint=digest(JSON.stringify({handle:b.handle,operation:b.operation,input:b.input}));
    const claim=this.db.transaction(()=>{const old=this.db.prepare('SELECT * FROM blind_jobs WHERE actor=? AND request_id=?').get(actor,b.requestId) as Job|undefined;if(old){if(old.fingerprint!==fingerprint)throw Error('IDEMPOTENCY_CONFLICT');return {job:old,existing:true};}
      const c=this.credential(actor,b.handle);if(c.revoked_at!==null||!c.cipher)throw Error('BLIND_HANDLE_UNAVAILABLE');if(c.expires_at<=now)throw Error('BLIND_PERMISSION_EXPIRED');if(c.used_calls>=1)throw Error('BLIND_CALL_LIMIT');
      const id=randomUUID();this.db.prepare('UPDATE blind_credentials SET used_calls=used_calls+1,quota_reserved_units=? WHERE id=?').run('1000',c.id);
      this.db.prepare("INSERT INTO blind_jobs VALUES(?,?,?,?,?,'RUNNING',NULL,?)").run(id,actor,c.id,b.requestId,fingerprint,now);return {job:this.db.prepare('SELECT * FROM blind_jobs WHERE id=?').get(id) as Job,existing:false};})();
    if(claim.existing)return this.receipt(claim.job);
    let secret:Buffer|undefined;let timer:ReturnType<typeof setTimeout>|undefined;const controller=new AbortController();let outputDigest:string|null=null,state='UNKNOWN';
    try{const c=this.credential(actor,b.handle);if(c.revoked_at!==null||c.expires_at<=Date.now())throw Error('BLIND_PERMISSION_EXPIRED');secret=this.open(c);const output=internalExecutor?await Promise.race([internalExecutor(secret,b.input.text,controller.signal),new Promise<never>((_resolve,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('BLIND_EXECUTOR_TIMEOUT'));},5000);})]):createHmac('sha256',secret).update(b.input.text).digest('hex');if(!/^[a-f\d]{64}$/.test(output)||output===secret.toString('hex'))throw Error('BLIND_EXECUTOR_RESPONSE_REJECTED');outputDigest=output;state='SUCCEEDED';}catch{/* Never serialize the exception or release an unknown execution's quota. */}finally{if(timer)clearTimeout(timer);secret?.fill(0);}
    const receipt:BlindReceipt={id:claim.job.id,handle:b.handle,operation:b.operation,state,inputDigest:fingerprint,outputDigest,isolation:'SOFTWARE_ISOLATION_DEMO',attestationVerified:false,realProviderCall:false,moneyMoved:false,quotaReservedUnits:'1000',createdAt:now};
    this.db.prepare("UPDATE blind_jobs SET state=?,receipt=? WHERE id=? AND state='RUNNING'").run(state,JSON.stringify(receipt),claim.job.id);return receipt;
  }
  history(actor:string){owner(actor);return {items:(this.db.prepare('SELECT * FROM blind_jobs WHERE actor=? ORDER BY created_at DESC LIMIT 20').all(actor) as Job[]).map(j=>this.receipt(j)),attestationVerified:false,realProviderCall:false};}
  close(){this.#closed=true;this.#key.fill(0);}
}
