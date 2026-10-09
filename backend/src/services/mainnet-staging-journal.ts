/** Integer, currency-separated journal for the closed Mainnet integration seam. */
import type Database from 'better-sqlite3';
import {createHash} from 'node:crypto';

type Account='merchant_cash'|'customer_liability'|'sales_revenue'|'sales_returns'|'procurement_expense'|'supplier_credit';
type Entry={account:Account;currency:'USDC'|'USD';debit:string;credit:string};
export class MainnetStagingJournal {
  constructor(private readonly db:Database.Database){
    db.exec(`CREATE TABLE IF NOT EXISTS staging_journals(id TEXT PRIMARY KEY,order_id TEXT NOT NULL,kind TEXT NOT NULL,binding TEXT NOT NULL,occurred_at INTEGER NOT NULL,UNIQUE(order_id,kind),FOREIGN KEY(order_id) REFERENCES staging_orders(id));
      CREATE TABLE IF NOT EXISTS staging_journal_lines(journal_id TEXT NOT NULL,line INTEGER NOT NULL,account TEXT NOT NULL,currency TEXT NOT NULL,debit TEXT NOT NULL,credit TEXT NOT NULL,PRIMARY KEY(journal_id,line),FOREIGN KEY(journal_id) REFERENCES staging_journals(id));
      CREATE TRIGGER IF NOT EXISTS staging_journal_no_update BEFORE UPDATE ON staging_journals BEGIN SELECT RAISE(ABORT,'APPEND_ONLY'); END;
      CREATE TRIGGER IF NOT EXISTS staging_journal_no_delete BEFORE DELETE ON staging_journals BEGIN SELECT RAISE(ABORT,'APPEND_ONLY'); END;
      CREATE TRIGGER IF NOT EXISTS staging_line_no_update BEFORE UPDATE ON staging_journal_lines BEGIN SELECT RAISE(ABORT,'APPEND_ONLY'); END;
      CREATE TRIGGER IF NOT EXISTS staging_line_no_delete BEFORE DELETE ON staging_journal_lines BEGIN SELECT RAISE(ABORT,'APPEND_ONLY'); END;`);
  }
  private append(orderId:string,fingerprint:string,kind:string,reference:string,entries:Entry[],now:number){
    return this.db.transaction(()=>{
    const totals=new Map<string,bigint>();
    for(const e of entries){if(!/^(0|[1-9]\d{0,11})$/.test(e.debit)||!/^(0|[1-9]\d{0,11})$/.test(e.credit))throw Error('JOURNAL_UNITS_INVALID');const d=BigInt(e.debit),c=BigInt(e.credit);if((d===0n)===(c===0n))throw Error('JOURNAL_ONE_SIDE_REQUIRED');totals.set(e.currency,(totals.get(e.currency)??0n)+d-c);}
    if(entries.length<2||[...totals.values()].some(v=>v!==0n))throw Error('JOURNAL_UNBALANCED');
    const binding=JSON.stringify({chainId:5042,orderId,fingerprint,kind,reference,entries});
    const id=createHash('sha256').update(binding).digest('hex');
    const old=this.db.prepare('SELECT id,binding FROM staging_journals WHERE order_id=? AND kind=?').get(orderId,kind) as {id:string;binding:string}|undefined;
    if(old){if(old.binding!==binding)throw Error('JOURNAL_BINDING_MISMATCH');return old.id;}
    this.db.prepare('INSERT INTO staging_journals(id,order_id,kind,binding,occurred_at) VALUES(?,?,?,?,?)').run(id,orderId,kind,binding,now);
    entries.forEach((e,i)=>this.db.prepare('INSERT INTO staging_journal_lines VALUES(?,?,?,?,?,?)').run(id,i,e.account,e.currency,e.debit,e.credit));
    return id;
    }).immediate();
  }
  payment(id:string,fingerprint:string,amount:string,tx:string,now:number){return this.append(id,fingerprint,'PAYMENT',tx,[{account:'merchant_cash',currency:'USDC',debit:amount,credit:'0'},{account:'customer_liability',currency:'USDC',debit:'0',credit:amount}],now);}
  delivery(id:string,fingerprint:string,sale:string,cost:string,reference:string,now:number){
    this.db.transaction(()=>{
    this.append(id,fingerprint,'DELIVERY',reference,[{account:'customer_liability',currency:'USDC',debit:sale,credit:'0'},{account:'sales_revenue',currency:'USDC',debit:'0',credit:sale}],now);
    // USD procurement changes are separate from USDC cash; no implicit FX conversion or balance import.
    this.append(id,fingerprint,'SUPPLY_COST',reference,[{account:'procurement_expense',currency:'USD',debit:cost,credit:'0'},{account:'supplier_credit',currency:'USD',debit:'0',credit:cost}],now);
    }).immediate();
  }
  refund(id:string,fingerprint:string,amount:string,tx:string,delivered:boolean,now:number){return this.append(id,fingerprint,'REFUND',tx,[{account:delivered?'sales_returns':'customer_liability',currency:'USDC',debit:amount,credit:'0'},{account:'merchant_cash',currency:'USDC',debit:'0',credit:amount}],now);}
  totals(){
    const rows=this.db.prepare('SELECT account,currency,debit,credit FROM staging_journal_lines').all() as Entry[];
    const out:Record<string,string>={};for(const r of rows){const k=r.currency+':'+r.account;out[k]=(BigInt(out[k]??'0')+BigInt(r.debit)-BigInt(r.credit)).toString();}return out;
  }
}
