import type {FastifyInstance} from 'fastify';
import {createHash} from 'node:crypto';import {z} from 'zod';
import type {DB} from '../db.js';import type {Config} from '../config.js';import {accountActor} from './account.js';
import {BlindBroker,blindExecuteInput,blindGrantInput} from '../services/blind-broker.js';import {planCapital} from '../services/capital-policy.js';
const units=z.string().regex(/^(0|[1-9]\d{0,17})$/),stamp=z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
export const capitalScenario=z.object({settledCashUnits:units,reserveFloorUnits:units,reservedOrderUnits:units,refundLiabilityUnits:units,liquidityBufferUnits:units,burn30dUnits:units,pendingPurchaseUnits:units,yieldRedeemableUnits:units,pendingIncomingUnits:units,maxActionUnits:units,observedAt:stamp,redemptionDelayMs:z.number().int().min(0).max(604800000),obligations:z.array(z.object({id:z.string().min(1).max(100),dueAt:stamp,amountUnits:units}).strict()).max(100),redemptionState:z.enum(['NONE','PENDING','UNKNOWN','SETTLED','FAILED']),paused:z.boolean(),eligibilityVerified:z.boolean(),quoteFresh:z.boolean()}).strict();
export function registerOperatorLab(app:FastifyInstance,db:DB,c:Config){
 const broker=new BlindBroker(db,c.DELIVERY_ENCRYPTION_KEY);const id=z.object({id:z.string().uuid()}).strict();
 app.get('/api/account/operator/lab/status',req=>{accountActor(req,c);return {mode:'ENGINEERING_LAB',treasuryExecutionEnabled:false,blindProviderExecutionEnabled:false,attestationVerified:false,modelSecretAccess:false};});
 app.post('/api/account/operator/lab/plan',req=>{accountActor(req,c);const b=z.object({snapshot:capitalScenario}).strict().parse(req.body);const plan=planCapital(b.snapshot,Date.now());return {...plan,source:'USER_SUPPLIED_SCENARIO_NOT_ACCOUNT_BALANCE',planDigest:createHash('sha256').update(JSON.stringify(plan)).digest('hex')};});
 app.post('/api/account/operator/lab/blind/grants',req=>broker.issueSynthetic(accountActor(req,c),blindGrantInput.parse(req.body)));
 app.get('/api/account/operator/lab/blind/grants/:id',req=>broker.view(accountActor(req,c),id.parse(req.params).id));
 app.post('/api/account/operator/lab/blind/grants/:id/revoke',req=>{z.object({}).strict().parse(req.body);return broker.revoke(accountActor(req,c),id.parse(req.params).id);});
 app.post('/api/account/operator/lab/blind/execute',req=>broker.execute(accountActor(req,c),blindExecuteInput.parse(req.body)));
 app.get('/api/account/operator/lab/blind/receipts',req=>broker.history(accountActor(req,c)));
 app.addHook('onClose',async()=>broker.close());
}
