// @vitest-environment jsdom
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {getMainnetOrders,saveMainnetOrder,syncRemoteOrders,mainnetAmountUnits,mainnetAmountDisplay,providerDeliveryCodes,mainnetReceiptExport,type MainnetOrder} from '@/lib/mainnet-orders';
const wallet='0x1111111111111111111111111111111111111111';
const hash='0x'+'ab'.repeat(32);
const order=(changes:Partial<MainnetOrder>={}):MainnetOrder=>({id:'order-one',created_at:Date.now(),initiator:wallet,initiator_address:wallet,reference:hash,name:'Steam voucher',product_id:'sku',country:'GLOBAL',quantity:1,amount_units:'830001',status:'PENDING',tx_hash:hash,codes:[],network:'mainnet',delivery_source:'unconfirmed',...changes});
beforeEach(()=>localStorage.clear());
afterEach(()=>vi.unstubAllGlobals());
describe('Mainnet account evidence boundaries',()=>{
 it('preserves all six decimals without floating point rounding',()=>{expect(mainnetAmountUnits('0.830001',3)).toBe('2490003');expect(mainnetAmountDisplay('2490003')).toBe('2.490003');});
 it.each(['0','-1','0.0000001','NaN','Infinity','1e4',' 1','1.','1.0000000'])('rejects invalid amount %s',value=>expect(()=>mainnetAmountUnits(value)).toThrow());
 it.each([0,-1,1.5,101,Infinity])('rejects invalid quantity %s',quantity=>expect(()=>mainnetAmountUnits('1',quantity)).toThrow());
 it('never manufactures provider codes',()=>{expect(providerDeliveryCodes(undefined)).toEqual([]);expect(providerDeliveryCodes(['MCT-ABCD-1234-1234'])).toEqual([]);expect(providerDeliveryCodes(['valid',12])).toEqual([]);expect(providerDeliveryCodes([''])).toEqual([]);expect(providerDeliveryCodes(['PROVIDER-CODE'])).toEqual(['PROVIDER-CODE']);});
 it('migrates old fulfilled browser records to unconfirmed references',()=>{localStorage.setItem('mercenta-mainnet-orders',JSON.stringify([order({status:'FULFILLED',delivery_source:undefined,codes:['TOPUP_CREDITED:@private']})]));expect(getMainnetOrders(wallet)[0]).toMatchObject({status:'RECORDED',codes:[],delivery_source:'unconfirmed'});});
 it('does not invent delivery from public historical references',()=>{const rows=getMainnetOrders('0x0b2ce1f0f24fb9f5510daead55602913962f4bdd');expect(rows.length).toBe(2);expect(rows.every(o=>o.status==='RECORDED'&&o.codes.length===0)).toBe(true);});
 it('handles corrupt browser storage and scopes by full address',()=>{localStorage.setItem('mercenta-mainnet-orders','{}');expect(getMainnetOrders(wallet)).toEqual([]);saveMainnetOrder(order());expect(getMainnetOrders('0x1111…1111')).toEqual([]);expect(getMainnetOrders('0x2222222222222222222222222222222222222222')).toEqual([]);});
 it('deduplicates a submitted transaction and accepts separate provider delivery',()=>{saveMainnetOrder(order());saveMainnetOrder(order({id:'new-id',status:'FULFILLED',delivery_source:'provider_response',codes:['PRIVATE-CODE']}));expect(getMainnetOrders(wallet)).toHaveLength(1);expect(getMainnetOrders(wallet)[0].status).toBe('FULFILLED');});
 it('exports redacted records without claiming independent verification',()=>{const result=mainnetReceiptExport(order({status:'FULFILLED',delivery_source:'provider_response',codes:['PRIVATE-CODE','TOPUP_CREDITED:@private']}));expect(JSON.stringify(result)).not.toContain('PRIVATE-CODE');expect(JSON.stringify(result)).not.toContain('@private');expect(result.amount.usdc).toBe('0.830001');expect(result.transaction.verification).toBe('not_independently_verified_by_this_export');});
 it('rejects fabricated remote default amounts and mismatched wallet records',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({orders:[{tx_hash:hash,codes:['CODE'],created_at:Date.now()},{tx_hash:hash,codes:['CODE'],amount_usdc:'1',created_at:Date.now(),wallet:'0x2222222222222222222222222222222222222222'}]})}));await syncRemoteOrders(wallet);expect(getMainnetOrders(wallet)).toEqual([]);});
});
