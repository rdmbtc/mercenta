import {describe,it,expect} from 'vitest';
import {NextRequest} from 'next/server';
import {GET} from '@/app/api/mainnet-readiness/route';
import {MAINNET_PREPARATION,isMainnetPreparation} from '@/lib/mainnet-preparation';
import {middleware} from '@/middleware';
import {allowedMainnetApi,networkDestination} from '@/lib/network-profile';
import mainnet from '@/lib/openapi-mainnet.json';
describe('Mainnet preparation is not payment approval',()=>{
 it('publishes recorded evidence with payments and signing closed',async()=>{const r=GET(new Request('https://mainnet.mercenta.xyz/api/mainnet-readiness'));expect(r.status).toBe(200);expect(r.headers.get('cache-control')).toBe('no-store');const p=await r.json();expect(isMainnetPreparation(p)).toBe(true);expect(p.purchasesEnabled).toBe(false);expect(p.walletSigningEnabled).toBe(false);expect(p.gates.filter((g:{status:string})=>g.status==='pending')).toHaveLength(3)});
 it.each(['app.mercenta.xyz','testnet.mercenta.xyz','mainnet.mercenta.xyz.evil.test'])('rejects non-mainnet host %s even with forged headers',async host=>{expect(GET(new Request('https://'+host+'/api/mainnet-readiness',{headers:{'x-mercenta-network':'mainnet'}})).status).toBe(404)});
 it.each([{purchasesEnabled:true},{walletSigningEnabled:true},{chainId:5042002},{phase:'live'},{kind:'GO_LIVE_APPROVAL'},{verifiedAt:'invalid'},{gates:[]},{gates:Array(5).fill(MAINNET_PREPARATION.gates[0])}])('rejects unsafe or malformed preparation metadata %j',patch=>{expect(isMainnetPreparation({...MAINNET_PREPARATION,...patch})).toBe(false)});
 it('permits only GET for preparation and refuses mutations before proxy',()=>{expect(allowedMainnetApi('/api/mainnet-readiness','GET')).toBe(true);for(const method of ['POST','PUT','PATCH','DELETE']){expect(allowedMainnetApi('/api/mainnet-readiness',method)).toBe(false);expect(middleware(new NextRequest('https://mainnet.mercenta.xyz/api/mainnet-readiness',{method})).status).toBe(503)}});
 it('routes status to launch details without query or session transfer',()=>{const r=middleware(new NextRequest('https://mainnet.mercenta.xyz/status?token=secret'));expect(r.headers.get('x-middleware-rewrite')).toBe('https://mainnet.mercenta.xyz/app?section=launch');expect(networkDestination('mainnet','launch')).toBe('https://mainnet.mercenta.xyz/app?section=launch')});
 it('documents preparation without enabling financial operations',()=>{const o=mainnet.paths['/api/mainnet-readiness'].get;expect(o['x-enabled']).toBe(true);expect(o.responses['200']).toBeDefined();expect(o.description).toContain('not launch approval')});
});
