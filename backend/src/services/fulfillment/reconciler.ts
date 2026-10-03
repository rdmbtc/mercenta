import type { DB } from '../../db.js';
import type { Orders } from '../orders.js';
import type { FulfillmentPort } from './index.js';
/** Each row gets its own lease/error boundary; one failing provider lookup cannot starve other orders. */
export async function reconcileOnce(db:DB,orders:Orders,node:FulfillmentPort,now=Date.now()){
 if(!node.configured)return;
 const rows=db.prepare('SELECT order_id,attempts FROM reconciliations WHERE next_at<=? AND lease_until<? LIMIT 20').all(now,now) as {order_id:string;attempts:number}[];
 for(const r of rows){
  const leaseAt=Math.max(now,Date.now());
  const lease=db.prepare('UPDATE reconciliations SET lease_until=? WHERE order_id=? AND lease_until<?').run(leaseAt+60000,r.order_id,leaseAt);if(lease.changes!==1)continue;
  try{const o=orders.get(r.order_id);if(o?.request_ref)orders.applySupply(o.id,await node.lookup(o.request_ref));}
  catch{orders.unknown(r.order_id)}
  finally{db.prepare('UPDATE reconciliations SET attempts=attempts+1,next_at=?,lease_until=0 WHERE order_id=?').run(Math.max(now,Date.now())+Math.min(3600000,15000*2**Math.min(r.attempts,8)),r.order_id)}
 }
}
export function startReconciler(db:DB,orders:Orders,node:FulfillmentPort){
 orders.recover();let running=false;const tick=async()=>{if(running)return;running=true;try{await reconcileOnce(db,orders,node)}finally{running=false}};
 const timer=setInterval(()=>void tick().catch(()=>{}),15000);timer.unref();return()=>clearInterval(timer);
}
