import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'mercenta-retail-qa-'));
const key='QA-PRIVATE-PROXY-KEY-'.repeat(3),wallet='0x'+'11'.repeat(20),other='0x'+'22'.repeat(20),hash='0x'+'ab'.repeat(32);
fs.writeFileSync(path.join(tmp,'proxy-key'),key);fs.writeFileSync(path.join(tmp,'supplier-key'),'QA-NO-REAL-SUPPLIER');
let src=fs.readFileSync(new URL('./service.mjs',import.meta.url),'utf8').replace('const PORT = 3016;','const PORT = 0;').replaceAll("'/var/lib/mercenta/mainnet_fulfillment.sqlite'",JSON.stringify(path.join(tmp,'qa.sqlite'))).replaceAll("'/var/lib/mercenta'",JSON.stringify(tmp)).replaceAll("'/etc/mercenta/retail-proxy-key'",JSON.stringify(path.join(tmp,'proxy-key'))).replaceAll("'/etc/mercenta/retail-supplier-key'",JSON.stringify(path.join(tmp,'supplier-key')));
src+='\nexport {server,db};\n';fs.writeFileSync(path.join(tmp,'fixture.mjs'),src);
const realFetch=globalThis.fetch;let payer=wallet,paid=830001000000000000n,procurementAttempts=0;
globalThis.fetch=async(url,init)=>{if(url==='https://rpc.mainnet.arc.io'){const body=JSON.parse(init.body);return Response.json({result:body.method==='eth_getTransactionReceipt'?{status:'0x1'}:{from:payer,to:'0x58863e4a739da0e62c2eba258b7783e95d5c48ce',value:'0x'+paid.toString(16)}});}procurementAttempts++;throw Error('QA_SUPPLIER_NETWORK_DISABLED');};
const {server,db}=await import(pathToFileURL(path.join(tmp,'fixture.mjs')));if(!server.listening)await new Promise(resolve=>server.once('listening',resolve));const base='http://127.0.0.1:'+server.address().port;
const headers={'X-Mercenta-Retail-Proxy':key,'X-Mercenta-Wallet':wallet,'Content-Type':'application/json'};
const payload=()=>({txHash:hash,wallet,denominationId:'QA-SKU',quantity:1,expectedAmountUnits:'830001'});
async function post(data,h=headers){return realFetch(base+'/fulfill',{method:'POST',headers:h,body:JSON.stringify(data)});}
async function cleanup(){globalThis.fetch=realFetch;await new Promise(resolve=>server.close(resolve));db.close();fs.rmSync(tmp,{recursive:true,force:true});}
try {
await test('anonymous history and fulfillment are denied without side effects',async()=>{assert.equal((await realFetch(base+'/orders')).status,401);assert.equal((await post(payload(),{})).status,401);assert.equal(procurementAttempts,0);});
await test('cannot list arbitrary wallets or dump all orders',async()=>{assert.equal((await realFetch(base+'/orders?wallet='+other,{headers})).status,403);const r=await realFetch(base+'/orders',{headers});assert.deepEqual((await r.json()).orders,[]);});
await test('valid private key does not permit wallet tampering',async()=>{assert.equal((await post({...payload(),wallet:other})).status,400);payer=other;assert.equal((await post(payload())).status,403);payer=wallet;assert.equal(procurementAttempts,0);});
await test('six-decimal underpayment cannot trigger procurement',async()=>{paid=830000000000000000n;assert.equal((await post(payload())).status,409);assert.equal(procurementAttempts,0);paid=830001000000000000n;});
await test('invalid quantity and missing expected price are denied',async()=>{assert.equal((await post({...payload(),quantity:0})).status,400);assert.equal((await post({...payload(),expectedAmountUnits:undefined})).status,400);assert.equal(procurementAttempts,0);});
await test('supplier failure leaves durable claim and cannot retry purchase',async()=>{assert.equal((await post(payload())).status,500);assert.equal(procurementAttempts,1);assert.equal((await post(payload())).status,409);assert.equal(procurementAttempts,1);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM retail_claims').get().n,1);});
await test('existing delivery is returned only to its owner',async()=>{db.prepare('INSERT INTO fulfilled_orders VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(hash,'QA-ORDER','QA-REFERENCE',wallet,'QA voucher','QA option','QA-SKU','0.830001',1,'["QA-NOT-REAL-CODE"]','DELIVERED',Date.now());assert.equal((await post(payload(),{...headers,'X-Mercenta-Wallet':other})).status,400);assert.equal((await post({...payload(),wallet:other},{...headers,'X-Mercenta-Wallet':other})).status,403);assert.equal((await post(payload())).status,200);assert.equal(procurementAttempts,1);});

} finally {await cleanup();}
