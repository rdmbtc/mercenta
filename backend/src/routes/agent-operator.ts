import type {FastifyInstance} from 'fastify';import {z} from 'zod';import type {DB} from '../db.js';import type {Config} from '../config.js';import {accountActor} from './account.js';
import {initOperator,operatorInput,createOperator,operatorView,operatorHistory,advanceOperator,confirmOperator,cancelOperator,resumeOperator} from '../services/agent-operator.js';import {modelAvailability} from '../services/llm-providers.js';
export function registerOperator(app:FastifyInstance,db:DB,c:Config){initOperator(db);const param=z.object({id:z.string().uuid()}),empty=z.object({}).strict();
 app.get('/api/account/operator/runs',req=>({...operatorHistory(db,accountActor(req,c),c.DELIVERY_ENCRYPTION_KEY??''),model:modelAvailability(c)}));
 app.post('/api/account/operator/runs',req=>createOperator(db,c,accountActor(req,c),operatorInput.parse(req.body)));
 app.get('/api/account/operator/runs/:id',req=>operatorView(db,accountActor(req,c),param.parse(req.params).id,c.DELIVERY_ENCRYPTION_KEY??''));
 app.post('/api/account/operator/runs/:id/advance',req=>{empty.parse(req.body);return advanceOperator(db,c,accountActor(req,c),param.parse(req.params).id)});
 app.post('/api/account/operator/runs/:id/confirm',req=>{const b=z.object({acceptedAmountUnits:z.string().regex(/^[1-9][0-9]{0,7}$/),confirmNonRedeemable:z.literal(true)}).strict().parse(req.body);return confirmOperator(db,c,accountActor(req,c),param.parse(req.params).id,b.acceptedAmountUnits,b.confirmNonRedeemable)});
 app.post('/api/account/operator/runs/:id/cancel',req=>{empty.parse(req.body);return cancelOperator(db,c,accountActor(req,c),param.parse(req.params).id)});
 app.post('/api/account/operator/runs/:id/resume',req=>{empty.parse(req.body);return resumeOperator(db,c,accountActor(req,c),param.parse(req.params).id)});
}
