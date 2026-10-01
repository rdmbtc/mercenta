/** Migrated from browser-local quota / fabricated vault fixtures to authoritative backend math and quota. */
import {describe,it,expect} from 'vitest';import {randomUUID} from 'node:crypto';import {openDb} from '../../../backend/src/db';import {loadConfig} from '../../../backend/src/config';import {quota,advise} from '../../../backend/src/services/agent';import {projectYield,loanRisk} from '@/lib/liquidity-math';
const config=loadConfig({NODE_ENV:'test'});describe('Server-owned advisor quota',()=>{
 it('initializes exactly ten',()=>{const db=openDb(':memory:');expect(quota(db,'a').remaining).toBe(10);db.close()});
 it('consumes one per completed consultation',async()=>{const db=openDb(':memory:');await advise(db,config,'a',randomUUID(),'Earn',[]);expect(quota(db,'a').remaining).toBe(9);db.close()});
 it('replay consumes no further quota',async()=>{const db=openDb(':memory:'),id=randomUUID();await advise(db,config,'a',id,'Earn',[]);await advise(db,config,'a',id,'Earn',[]);expect(quota(db,'a').used).toBe(1);db.close()});
 it('exhausts on request eleven without payment',async()=>{const db=openDb(':memory:');for(let i=0;i<10;i++)await advise(db,config,'a',randomUUID(),'Earn',[]);const r=await advise(db,config,'a',randomUUID(),'Earn',[]);expect(r.code).toBe('FREE_LIMIT_REACHED');expect(r.quota.isPaid).toBe(false);db.close()});
 it('isolates visitors',async()=>{const db=openDb(':memory:');await advise(db,config,'a',randomUUID(),'Earn',[]);expect(quota(db,'b').remaining).toBe(10);db.close()});
 it('recommends only supplied catalog IDs',async()=>{const db=openDb(':memory:');const r=await advise(db,config,'a',randomUUID(),'H100 inference',[{id:'h100',name:'H100 Cluster',category:'cloud',price:'624.00',currency:'USD'}]);expect(r.recommendations[0].id).toBe('h100');expect(r.authority).toBe('PROPOSAL_ONLY');db.close()});
});describe('Explicit sandbox risk calculations',()=>{
 it('uses string units, not fabricated vault addresses',()=>expect(projectYield(1000000000n,540n,365).gainUnits).toBe('54000000'));
 it('zero debt has no liquidation health',()=>expect(loanRisk(10000000n,0n).healthFactorBps).toBe(null));
 it('enforces exact 75% maximum',()=>expect(loanRisk(10000000n,6930000000n).allowed).toBe(true));
 it('rejects a single micro-unit beyond LTV',()=>expect(loanRisk(10000000n,6930000001n).allowed).toBe(false));
});
