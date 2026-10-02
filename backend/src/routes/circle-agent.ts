import type {FastifyInstance} from 'fastify';import {z} from 'zod';import type {DB} from '../db.js';import type {Config} from '../config.js';import {accountActor} from './account.js';import {CircleAgent} from '../services/circle-agent.js';
export function registerCircleAgent(app:FastifyInstance,db:DB,c:Config){
 const service=new CircleAgent(db,c),param=z.object({id:z.string().uuid()});
 app.get('/api/account/circle/balances',req=>service.balances(accountActor(req,c)));
 app.get('/api/account/circle/status',req=>service.status(accountActor(req,c)));
 app.get('/api/account/circle/payments',req=>service.list(accountActor(req,c)));
 app.post('/api/account/circle/payments',req=>{const actor=accountActor(req,c),b=z.object({requestId:z.string().uuid(),serviceId:z.string().regex(/^[a-z][a-z0-9-]{0,49}$/)}).strict().parse(req.body);return service.prepare(actor,b.requestId,b.serviceId)});
 app.get('/api/account/circle/payments/:id',req=>service.get(accountActor(req,c),param.parse(req.params).id));
 app.post('/api/account/circle/payments/:id/confirm',req=>{const actor=accountActor(req,c),b=z.object({confirmed:z.literal(true)}).strict().parse(req.body);return service.confirm(actor,param.parse(req.params).id,b.confirmed)});
 app.post('/api/account/circle/payments/:id/reconcile',req=>{const actor=accountActor(req,c);z.object({}).strict().parse(req.body??{});return service.reconcile(actor,param.parse(req.params).id)});
 app.post('/api/account/circle/payments/:id/recover-resource',req=>{const actor=accountActor(req,c);z.object({}).strict().parse(req.body??{});return service.recoverResource(actor,param.parse(req.params).id)});
 app.get('/api/account/circle/payments/:id/resource',req=>service.resource(accountActor(req,c),param.parse(req.params).id));
 app.get('/api/account/circle/payments/:id/evidence',req=>service.evidence(accountActor(req,c),param.parse(req.params).id));
}
