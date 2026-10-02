import type {FastifyInstance} from 'fastify';
import type {DB} from '../db.js';
import type {Config} from '../config.js';
import {z} from 'zod';
import {accountActor} from './account.js';
import {initWorkspace,profile,saveProfile,getBudget,saveBudget,budgetUsage,journal,addNote,sensitiveText} from '../services/workspace.js';
import {memoryState} from '../services/runtime.js';
import {TEST_PRODUCTS} from '../services/account.js';
import {financialCoach} from '../services/financial-coach.js';
export function registerWorkspace(app:FastifyInstance,db:DB,c:Config){initWorkspace(db);
 app.get('/api/account/catalog-preview',()=>({products:TEST_PRODUCTS,mode:'testnet-simulated-preview',liveProcurement:false}));
 const writable=()=>{if(memoryState(c).pressured)throw new Error('MEMORY_PRESSURE_READ_ONLY')};
 app.get('/api/account/workspace',req=>{const a=accountActor(req,c);return {profile:profile(db,a),budget:getBudget(db,a),usage:budgetUsage(db,a)}});
 app.post('/api/account/workspace/profile',req=>{const a=accountActor(req,c);writable();return saveProfile(db,a,req.body)});
 app.post('/api/account/workspace/budget',req=>{const a=accountActor(req,c);writable();return saveBudget(db,a,req.body)});
 app.get('/api/account/journal',req=>{const a=accountActor(req,c),q=z.object({page:z.coerce.number().int().min(1).max(200).default(1)}).parse(req.query);return journal(db,a,c.DELIVERY_ENCRYPTION_KEY,q.page)});
 app.post('/api/account/journal',req=>{const a=accountActor(req,c);writable();return addNote(db,a,req.body,c.DELIVERY_ENCRYPTION_KEY)});
 app.post('/api/account/journal/coach',async req=>{const a=accountActor(req,c);writable();const b=z.object({question:z.string().trim().min(3).max(600),shareAggregates:z.literal(true),language:z.enum(['en','ru'])}).strict().parse(req.body);if(sensitiveText(b.question))throw new Error('DO_NOT_SHARE_SECRETS');const j=journal(db,a,c.DELIVERY_ENCRYPTION_KEY),u=budgetUsage(db,a),budget=getBudget(db,a);return financialCoach(c,{question:b.question,language:b.language,declaredIncomeUnits:j.declaredIncomeUnits,declaredExpenseUnits:j.declaredExpenseUnits,usage:u,budget:budget?{monthly:budget.monthly,spendBps:budget.spendBps,perOrder:budget.perOrder,daily:budget.daily}:null});});
 // No credentials, balances or unverified operational claims in this public status.
 app.get('/api/launch-readiness',()=>({network:'arc-testnet',chainId:5042002,mainnetEnabled:false,liveGoodsEnabled:false,procurement:'AppRoute planned; official API contract and reconciliation must be validated',gates:[{id:'supplier',status:'blocked',detail:'Verified AppRoute API specification, credentials, stock/price mapping and sandbox order + lookup + refunds'},{id:'payments',status:'blocked',detail:'Production chain/token/merchant allowlist, fresh restricted signer and reviewed deposit/withdrawal reconciliation'},{id:'security',status:'blocked',detail:'Rotate exposed credentials, contract review, backups/restore drill and independent financial security review'},{id:'operations',status:'blocked',detail:'Monitoring, support contacts, refund policy, terms/privacy and jurisdiction/compliance review'}]}));
}
