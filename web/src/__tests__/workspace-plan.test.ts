import {describe,it,expect} from 'vitest';import {journey,allocation,validBudget,planUnits,friendlyWorkspaceError} from '../lib/workspace-plan';
describe('onboarding and exact budget planning',()=>{
 it('has a real destination and distinct instructions for each step',()=>{expect(new Set(journey.map(s=>s.id)).size).toBe(8);for(const s of journey){expect(s.en[1].length).toBeGreaterThan(30);expect(s.ru[1].length).toBeGreaterThan(30)}expect(journey.find(s=>s.id==='shop')?.section).toBe('Shop')});
 it('uses exact six-decimal accounting and assigns rounding dust to reserve',()=>{const parts=allocation('0.000003',[70,20,10,0]);expect(parts).toEqual(['2','1','0','0']);expect(parts.reduce((a,b)=>a+BigInt(b),0n)).toBe(3n);expect(planUnits('1.000001')).toBe(1000001n)});
 it('rejects signs, exponents and precision greater than six decimals',()=>{for(const x of ['-1','1e3','0.0000001','01','NaN'])expect(()=>planUnits(x)).toThrow()});
 it('validates caps against spending allocation, not gross plan',()=>{expect(validBudget('100','5','10',[70,20,10,0])).toBe(true);expect(()=>validBudget('100','5','80',[70,20,10,0])).toThrow();expect(()=>validBudget('100','11','10',[70,20,10,0])).toThrow();expect(()=>allocation('100',[70,10,10,0])).toThrow()});
 it('gives understandable bilingual errors without exposing raw backend messages',()=>{expect(friendlyWorkspaceError('WALLET_AUTH_REQUIRED','ru')).toContain('кошелёк');expect(friendlyWorkspaceError('BUDGET_REVISION_CONFLICT','en')).toContain('Refresh');expect(friendlyWorkspaceError('arbitrary secret','en')).not.toContain('secret')});
});
