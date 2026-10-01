import {describe,it,expect} from 'vitest';
import {checkIntent,defaultWorkspacePolicy} from '@/lib/product-policy';
import {buildManifest} from '@/components/product/ProductCatalog';
import type {CatalogProduct} from '@/lib/supplier';
describe('Product workspace policy',()=>{
 it('clears the landing example',()=>{const r=checkIntent(2100,1700,'verified');expect(r.decision).toBe('Cleared');expect(r.checks).toHaveLength(5);expect(r.margin).toBeCloseTo(400/2100)});
 it('blocks thin margins',()=>expect(checkIntent(1800,1700,'verified').decision).toBe('Policy blocked'));
 it('blocks unknown suppliers',()=>expect(checkIntent(2100,1700,'uncertain').decision).toBe('Policy blocked'));
 it('routes an over-limit intent to review',()=>expect(checkIntent(7800,6200,'verified').decision).toBe('Human approval required'));
 it.each([[-1,0],[0,0],[2100,-1],[NaN,1700],[Infinity,1700],[2100,Infinity]])('rejects invalid intent %s / %s',(a,c)=>expect(checkIntent(a,c,'verified').decision).toBe('Policy blocked'));
 it('recomputes local policy changes',()=>expect(checkIntent(2100,1700,'verified',{...defaultWorkspacePolicy,grossMarginFloor:.5}).decision).toBe('Policy blocked'));
 it('treats spend and approval thresholds as inclusive',()=>expect(checkIntent(5000,4000,'verified').decision).toBe('Cleared'));
 it('blocks uncovered supplier reserves',()=>expect(checkIntent(10000,9500,'verified').checks.find(c=>c.id==='reserved')?.state).toBe('fail'));
});
const product=(id:string,currency:string):CatalogProduct=>({id,name:'Example '+id,brand:'Fixture',category:'developer',type:'voucher',denominations:[{id:id+'-d',name:'Credit',price:10,currency,available:true}],currency,minPrice:10,maxPrice:10,inStock:1,totalStock:0});
describe('Catalog batch manifest',()=>{
 it('keeps currency totals separate and respects quantity',()=>{const a=product('a','USD'),b=product('b','EUR');const m=buildManifest([{product:a,denom:a.denominations[0],quantity:2},{product:b,denom:b.denominations[0],quantity:3}]);expect(m.draft).toBe(true);expect(m.totals).toEqual({lines:2,units:5,byCurrency:{USD:'20.000000',EUR:'30.000000'}});expect(m.items[0].quantity).toBe(2);expect(m).not.toHaveProperty('receipt_proof')});
 it('exports an honest empty manifest',()=>expect(buildManifest([]).totals).toEqual({lines:0,units:0,byCurrency:{}}));
});
