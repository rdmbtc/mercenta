import {describe,it,expect} from 'vitest';
import {allowedMainnetApi} from '@/lib/network-profile';
import {sourceMainnetProducts,mainnetGuidance,checkoutDetail} from '@/lib/mainnet-assistant';
import {summarizeMainnetOrders} from '@/lib/mainnet-telemetry';
import type {MainnetOrder} from '@/lib/mainnet-orders';
describe('Mainnet wallet and assistant boundaries',()=>{
 it('permits identity, never Testnet account operations',()=>{for(const p of ['/api/auth/nonce','/api/auth/verify','/api/auth/logout']){expect(allowedMainnetApi(p,'POST')).toBe(true);expect(allowedMainnetApi(p,'GET')).toBe(false);}expect(allowedMainnetApi('/api/me','GET')).toBe(true);for(const p of ['/api/account/operator/runs','/api/account/agent/messages','/api/account/profit/plan','/api/backend/auth/verify'])expect(allowedMainnetApi(p,'POST')).toBe(false);});
 it('sources within budget and region without execution',()=>{const results=sourceMainnetProducts('Steam','6','US');expect(results.length).toBeGreaterThan(0);expect(results.every(p=>Number(p.price)<=6&&(p.country==='US'||p.country==='GLOBAL'))).toBe(true);expect(checkoutDetail(results[0]).quantity).toBe(1);expect(sourceMainnetProducts('Steam','1','US')).toEqual([]);expect(sourceMainnetProducts('nonexistent-product','100','ANY')).toEqual([]);});
 it.each(['-1','0','NaN','Infinity','1e9','0.0000001'])('rejects invalid budget %s',budget=>expect(()=>sourceMainnetProducts('Steam',budget,'ANY')).toThrow());
 it('labels guidance honestly and does not promise fees or settlement',()=>{expect(mainnetGuidance('hello')).toContain('rules-based');expect(mainnetGuidance('gas')).toContain('does not measure finality');expect(mainnetGuidance('balance')).toContain('not your available balance');expect(mainnetGuidance('policy')).toContain('not a live 5/5');});
 it('counts direct top-ups separately and sums exact micro-units',()=>{const rows=[{amount_units:'830000',codes:['TOPUP_CREDITED:example']},{amount_units:'830001',codes:['voucher']} ] as MainnetOrder[];expect(summarizeMainnetOrders(rows)).toEqual({totalOrders:2,shopOrders:1,directTopUpOrders:1,totalSpentUnits:'1660001',shopSpentUnits:'830001',directTopUpSpentUnits:'830000'});});
});
