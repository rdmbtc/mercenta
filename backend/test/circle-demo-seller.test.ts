import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { openDb } from '../src/db.js';
import { CircleDemoSeller, DEMO_SERVICE_ID, DEMO_SERVICE_URL, DEMO_AMOUNT, AUTH_TYPES, sellerRequirements, type SellerPorts } from '../src/services/circle-demo-seller.js';
import { CHAIN, NETWORK, checkedRequirements, type AgentConfig } from '../src/services/circle-policy.js';
const recipient='0x'+'3'.repeat(40);
const account=privateKeyToAccount(generatePrivateKey()); // Ephemeral test-only signer; never funded or printed.
const wallet=account.address.toLowerCase();
const config:AgentConfig={provider:'local-eoa',walletAddress:wallet,ownerWallet:wallet,privateKeyPath:'unused-test-only',enabled:true,services:[{id:DEMO_SERVICE_ID,url:DEMO_SERVICE_URL,payTo:recipient,maxAmountUnits:DEMO_AMOUNT}]};
async function signature(nonce='0x'+'4'.repeat(64),change:Record<string,string>={}){
  const auth={from:wallet,to:recipient,value:DEMO_AMOUNT,validAfter:'0',validBefore:String(Math.floor(Date.now()/1000)+604900),nonce,...change};
  const signed=await account.signTypedData({domain:{name:'GatewayWalletBatched',version:'1',chainId:5042002,verifyingContract:CHAIN.gatewayWallet},types:AUTH_TYPES,primaryType:'TransferWithAuthorization',message:{from:auth.from as `0x${string}`,to:auth.to as `0x${string}`,value:BigInt(auth.value),validAfter:BigInt(auth.validAfter),validBefore:BigInt(auth.validBefore),nonce:auth.nonce as `0x${string}`}});
  return Buffer.from(JSON.stringify({x402Version:2,accepted:sellerRequirements(recipient),resource:{url:DEMO_SERVICE_URL},payload:{signature:signed,authorization:auth}})).toString('base64');
}
function fixture(opts:{timeout?:boolean;readonly?:boolean;disabled?:boolean;lookup?:()=>Promise<unknown[]>}={}){
  const db=openDb(':memory:');let settlements=0,lookups=0;
  const ports:SellerPorts={writable:()=>!opts.readonly,settle:async()=>{settlements++;if(opts.timeout)throw Error('network timeout');return {success:true,network:NETWORK,payer:wallet,transaction:randomUUID()};},lookup:async()=>{lookups++;return opts.lookup?opts.lookup():[];}};
  const cfg={...config,enabled:!opts.disabled};
  return {db,ports,cfg,seller:new CircleDemoSeller(db,recipient,()=>cfg,ports),counts:()=>({settlements,lookups})};
}
test('Seller unpaid 402 is compatible with the existing bounded buyer and does not contact Gateway',()=>{
  const f=fixture(),r=f.seller.challenge();assert.equal(r.status,402);const q=checkedRequirements(r.headers['PAYMENT-REQUIRED'],config.services[0]);assert.equal(q.accepted.amount,'1000');assert.equal(q.accepted.network,NETWORK);assert.deepEqual(f.counts(),{settlements:0,lookups:0});f.db.close();
});
test('Seller accepts one signed payment and returns stable cached result after restart without another settlement',async()=>{
  const f=fixture(),h=await signature(),first=await f.seller.handle(h);assert.equal(first.status,200);const restarted=new CircleDemoSeller(f.db,recipient,()=>f.cfg,f.ports),again=await restarted.handle(h,true);assert.deepEqual(again,first);assert.equal(f.counts().settlements,1);const body=first.body as any;assert.equal(body.quote.allocatableMarginUnits,'462000');assert.equal(body.quote.profitUnits,'46200');assert.equal(body.verifiedBusinessSale,false);assert.equal(body.receipt.state,'gateway-accepted-not-proof-of-final-onchain-settlement');assert.ok(!JSON.stringify(f.db.prepare('SELECT * FROM circle_demo_seller_receipts').all()).includes(JSON.parse(Buffer.from(h,'base64').toString()).payload.signature));f.db.close();
});
test('Seller concurrent duplicate requests cause no second settlement',async()=>{
  const f=fixture(),h=await signature();const results=await Promise.all([f.seller.handle(h),f.seller.handle(h)]);assert.ok(results.some(x=>x.status===200));assert.equal(f.counts().settlements,1);f.db.close();
});
test('Seller validates scope/signature/window before any settlement',async()=>{
  const f=fixture();for(const change of [{to:'0x'+'5'.repeat(40)},{value:'1001'},{validBefore:'9999999999'},{validAfter:'9999999999'},{nonce:'bad'}]){
    if(change.nonce){assert.equal((await f.seller.handle('not-base64!')).status,400);continue;}
    assert.equal((await f.seller.handle(await signature(undefined,change))).status,400);
  }
  const p=JSON.parse(Buffer.from(await signature(),'base64').toString());p.payload.signature='0x'+'1'.repeat(130);assert.equal((await f.seller.handle(Buffer.from(JSON.stringify(p)).toString('base64'))).status,400);
  p.accepted.network='eip155:1';assert.equal((await f.seller.handle(Buffer.from(JSON.stringify(p)).toString('base64'))).status,400);assert.equal(f.counts().settlements,0);f.db.close();
});
test('Seller stays fail-closed under memory pressure or disabled config',async()=>{
  for(const options of [{readonly:true},{disabled:true}]){const f=fixture(options);assert.equal((await f.seller.handle(await signature())).status,503);assert.equal(f.counts().settlements,0);assert.equal((f.db.prepare('SELECT count(*) n FROM circle_demo_seller_receipts').get() as any).n,0);f.db.close();}
});
test('Seller cached-only recovery can never initiate a new payment',async()=>{
  const f=fixture();assert.equal((await f.seller.handle(await signature(),true)).status,409);assert.equal(f.counts().settlements,0);f.db.close();
});
test('Seller timeout reserves nonce durably; replay only reconciles the original Gateway transfer',async()=>{
  const h=await signature(),p=JSON.parse(Buffer.from(h,'base64').toString()),auth=p.payload.authorization;
  const f=fixture({timeout:true,lookup:async()=>[{id:randomUUID(),status:'received',token:'USDC',sendingNetwork:NETWORK,recipientNetwork:NETWORK,fromAddress:wallet,toAddress:recipient,amount:DEMO_AMOUNT,nonce:auth.nonce,txHash:null}]});
  assert.equal((await f.seller.handle(h)).status,503);assert.equal((await f.seller.handle(h,true)).status,200);assert.equal(f.counts().settlements,1);assert.equal(f.counts().lookups,1);f.db.close();
});
test('Seller unresolved or mismatched transfer stays uncertain and never re-settles',async()=>{
  const h=await signature();for(const lookup of [async()=>[],async()=>[{id:randomUUID(),status:'received',token:'USDC',sendingNetwork:NETWORK,recipientNetwork:NETWORK,fromAddress:wallet,toAddress:recipient,amount:'9999',nonce:'0x'+'4'.repeat(64),txHash:null}]]){
    const f=fixture({timeout:true,lookup});await f.seller.handle(h);assert.equal((await f.seller.handle(h,true)).status,503);assert.equal(f.counts().settlements,1);f.db.close();
  }
});
