import type { FastifyInstance } from 'fastify';
import type { DB } from '../db.js';
import type { Config } from '../config.js';
import { loadAgentConfig } from '../services/circle-policy.js';
import { memoryState } from '../services/runtime.js';
import { CircleDemoSeller, sellerPorts } from '../services/circle-demo-seller.js';
export function registerCircleDemoSeller(app:FastifyInstance,db:DB,c:Config){
  if(!c.MERCHANT_WALLET)return;
  const seller=new CircleDemoSeller(db,c.MERCHANT_WALLET,()=>loadAgentConfig(c.CIRCLE_AGENT_CONFIG_FILE),sellerPorts(()=>!memoryState(c).pressured));
  app.get('/api/x402/margin-report',async(req,reply)=>{
    reply.header('Cache-Control','private, no-store');
    const signature=req.headers['payment-signature'];
    if(signature!==undefined&&typeof signature!=='string')return reply.code(400).send({error:'INVALID_PAYMENT'});
    const result=await seller.handle(signature,req.headers['x-mercenta-replay']==='cached-only');
    for(const [name,value]of Object.entries(result.headers))reply.header(name,value);
    return reply.code(result.status).send(result.body);
  });
}
