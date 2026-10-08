import type {FastifyInstance,FastifyRequest} from 'fastify';
import {createHmac,timingSafeEqual} from 'node:crypto';import {z} from 'zod';
import type {Config} from '../config.js';import type {DB} from '../db.js';
import {SupportRefunds} from '../services/support-refunds.js';
export function verifySupportProxy(req:FastifyRequest,c:Config){
 const actor=req.headers['x-mercenta-actor'],ts=req.headers['x-mercenta-timestamp'],sig=req.headers['x-mercenta-signature'];
 if(actor!=='support:public'||typeof ts!=='string'||!/^\d{13}$/.test(ts)||Math.abs(Date.now()-Number(ts))>30000||typeof sig!=='string')throw Error('UNAUTHORIZED');
 const expected=createHmac('sha256',c.BACKEND_PROXY_SECRET).update(`${ts}\n${req.method}\n${req.url}\n${actor}\n${JSON.stringify(req.body)}`).digest('hex');
 const a=Buffer.from(sig),b=Buffer.from(expected);if(a.length!==b.length||!timingSafeEqual(a,b))throw Error('UNAUTHORIZED');
}
export function registerSupportRefunds(app:FastifyInstance,db:DB,c:Config){
 const queue=new SupportRefunds(db,c.DELIVERY_ENCRYPTION_KEY);
 app.post('/api/support/refund',{bodyLimit:8192},(req,reply)=>{
 verifySupportProxy(req,c);const input=z.object({request:z.unknown(),sourceHash:z.string().regex(/^[a-f0-9]{64}$/)}).strict().parse(req.body);
 try{return reply.header('Cache-Control','no-store').code(202).send(queue.submit(input.request,input.sourceHash));}
 catch(e){if(e instanceof Error&&e.message==='SUPPORT_RATE_LIMIT')return reply.header('Retry-After','3600').code(429).send({code:'SUPPORT_RATE_LIMIT'});throw e;}
 });
}
