import {describe,it,expect} from 'vitest';import {primaryDestinations,sectionGroup,sectionSlug,sectionFromSlug,workspaceSections,capPreview} from '../lib/workspace-navigation';
describe('reduced workspace navigation',()=>{
 it('has exactly four essential destinations',()=>{expect(primaryDestinations.map(x=>x.id)).toEqual(['home','shop','wallet','assistant'])});
 it('keeps existing deep links and assigns every view to a primary destination',()=>{for(const s of workspaceSections){expect(sectionFromSlug(sectionSlug(s))).toBe(s);expect(primaryDestinations.some(g=>g.id===sectionGroup(s))).toBe(true)}expect(sectionGroup('Orders')).toBe('shop');expect(sectionGroup('Budget')).toBe('wallet');expect(sectionGroup('Financial Journal')).toBe('assistant');expect(sectionFromSlug('invented')).toBeNull()});
 it('creates bounded exact preview caps without transfer or signing authority',()=>{expect(capPreview('100')).toMatchObject({perOrder:'5.000000',daily:'10.000000',spendUnits:'70000000'});expect(capPreview('2')).toMatchObject({perOrder:'1.400000',daily:'1.400000'});const p=capPreview('0.000003');expect(BigInt(p.spendUnits)+BigInt(p.reserveUnits)+BigInt(p.goalUnits)).toBe(3n)});
 it('rejects zero, exponent notation, excess precision and plans too small for a purchase cap',()=>{for(const n of ['0','1e3','-1','0.0000001','0.000001'])expect(()=>capPreview(n)).toThrow()});
});
