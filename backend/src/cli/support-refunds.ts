import 'dotenv/config';import {openDb} from '../db.js';import {SupportRefunds,type RefundStatus} from '../services/support-refunds.js';
const path=process.env.DATABASE_PATH,key=process.env.DELIVERY_ENCRYPTION_KEY;
if(!path||!key)throw Error('SUPPORT_NOT_CONFIGURED');
const db=openDb(path);try{const queue=new SupportRefunds(db,key),[action,id,status]=process.argv.slice(2);
 if(action==='list')console.log(JSON.stringify(queue.list(),null,2));
 else if(action==='show'&&id)console.log(JSON.stringify(queue.read(id),null,2));
 else if(action==='review'&&id&&status&&['IN_REVIEW','CLOSED'].includes(status))console.log(JSON.stringify(queue.review(id,status as RefundStatus)));
 else throw Error('Usage: support-refunds list | show <ticket> | review <ticket> IN_REVIEW|CLOSED');
}finally{db.close();}
// Filesystem-owner tool only. No public ticket reader, ledger credit or payment operation.
