import {describe,it,expect} from 'vitest';
import {compactUsdc,buildSetupPlan,purposeTemplates,productTitle} from '../lib/workspace-discovery';
describe('clear discovery without monetary authority',()=>{
 it('displays meaningful decimals without silent rounding',()=>{expect(compactUsdc('5273400')).toEqual({text:'5.2734',approximate:false,exact:'5.273400'});expect(compactUsdc('6000000').text).toBe('6.00');expect(compactUsdc('0').text).toBe('0.00')});
 it('labels rounding and preserves exact micro-units',()=>{expect(compactUsdc('9999999')).toEqual({text:'≈ 10.00',approximate:true,exact:'9.999999'});expect(compactUsdc('1')).toMatchObject({text:'≈ 0.00',exact:'0.000001'})});
 it('rejects malformed unit strings',()=>{for(const n of ['-1','1e3','1.5',''])expect(()=>compactUsdc(n)).toThrow()});
 it('uses distinct editable templates rather than a universal allocation',()=>{const a=buildSetupPlan('2',purposeTemplates.buyer.spend,purposeTemplates.buyer.goal),b=buildSetupPlan('2',purposeTemplates.reseller.spend,purposeTemplates.reseller.goal);expect(a.plan).toMatchObject({perOrder:'1.700000',spendBps:8500,reserveBps:1500,profitBps:0});expect(b.plan).toMatchObject({perOrder:'1.400000',spendBps:7000,reserveBps:2000,profitBps:1000})});
 it('recalculates custom shares and conserves every micro-unit',()=>{const d=buildSetupPlan('0.000003',40,20);expect(d.parts.map(BigInt).reduce((a,b)=>a+b,0n)).toBe(3n);expect(d.plan).toMatchObject({spendBps:4000,reserveBps:4000,profitBps:2000})});
 it('bounds purchase caps and rejects invalid plans',()=>{expect(buildSetupPlan('100',90,5).plan).toMatchObject({perOrder:'5.000000',daily:'10.000000'});for(const [m,s,g] of [['0',70,10],['2',91,10],['2',0,0],['2',70.5,10],['2',NaN,0],['0.000001',1,0]] as [string,number,number][])expect(()=>buildSetupPlan(m,s,g)).toThrow()});
 it('retains product identity while simplifying display names',()=>{const p={id:'test-gaming',name:'Gaming voucher · test delivery'};expect(productTitle(p)).toBe('Gaming voucher');expect(p.name).toBe('Gaming voucher · test delivery')});
});
