import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {generatePrivateKey,privateKeyToAccount} from 'viem/accounts';import {BatchEvmScheme} from '@circle-fin/x402-batching/client';
import {openDb} from '../src/db.js';import {loadConfig} from '../src/config.js';import {initAccount} from '../src/services/account.js';import {chat,initAgentChat,paidReportRequest} from '../src/services/agent-chat.js';
import {CircleDemoSeller,sellerRequirements,DEMO_SERVICE_ID,DEMO_SERVICE_URL} from '../src/services/circle-demo-seller.js';
import {CircleAgent,type CirclePorts} from '../src/services/circle-agent.js';import {NETWORK,CHAIN,type AgentConfig} from '../src/services/circle-policy.js';
const recipient='0x'+'3'.repeat(40),account=privateKeyToAccount(generatePrivateKey()),wallet=account.address.toLowerCase(),actor='wallet:'+wallet;
const a:AgentConfig={provider:'local-eoa',walletAddress:wallet,ownerWallet:wallet,enabled:true,privateKeyPath:'test-only-never-read',services:[{id:DEMO_SERVICE_ID,url:DEMO_SERVICE_URL,payTo:recipient,maxAmountUnits:'1000'}]};
test('Official Circle buyer payload is accepted by the seller with offline cryptographic verification',async()=>{
 const db=openDb(':memory:');let settles=0;const seller=new CircleDemoSeller(db,recipient,()=>a,{writable:()=>true,lookup:async()=>[],settle:async()=>{settles++;return {success:true,payer:wallet,network:NETWORK,transaction:randomUUID()};}});
 const scheme=new BatchEvmScheme({address:account.address,signTypedData:p=>account.signTypedData(p as any)});
 const requirements=sellerRequirements(recipient),payload=await scheme.createPaymentPayload(2,requirements);
 const header=Buffer.from(JSON.stringify({...payload,accepted:requirements,resource:{url:DEMO_SERVICE_URL}})).toString('base64');
 assert.equal((await seller.handle(header)).status,200);assert.equal(settles,1);db.close();
});
test('Chat prepares a quoted report once, never signs or submits, and restores the same reply',async()=>{
 const db=openDb(':memory:');initAccount(db);initAgentChat(db);let quotes=0;const id=randomUUID();const quote=async()=>{quotes++;return {id:randomUUID(),amountUnits:'1000'} as any;};
 const c={...loadConfig(),DATABASE_PATH:':memory:',CIRCLE_AGENT_CONFIG_FILE:undefined};
 const first=await chat(db,c,actor,id,'Prepare a paid margin report',quote);const again=await chat(db,c,actor,id,'Prepare a paid margin report',quote);
 assert.deepEqual(first,again);assert.equal(quotes,1);assert.equal(first.authority,'PROPOSAL_ONLY');assert.ok(first.circlePaymentId);assert.match(first.message,/No payment signed or submitted/);db.close();
});
test('Ordinary margin discussion or x402 balance does not authorize a paid report quote',()=>{
 for(const s of ['Show x402 balance','Explain profit margin','Tell me about paid margin reports'])assert.equal(paidReportRequest(s),false);
 assert.equal(paidReportRequest('Подготовь платный отчет по марже'),true);
});
test('Buyer disk restart reconciles one original authorization and recovers only a cached resource; no re-sign or re-submit',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'mercenta-circle-restart-')),path=join(dir,'state.sqlite');let db=openDb(path),signs=0,paid=0,recoveries=0;
 const nonce='0x'+'4'.repeat(64),tx='0x'+'5'.repeat(64),transferId=randomUUID();
 const c={...loadConfig(),DATABASE_PATH:path,CIRCLE_AGENT_CONFIG_FILE:undefined};
 const ports:CirclePorts={walletCheck:async()=>{},sign:async()=>{signs++;return {x402Version:2,payload:{signature:'0x'+'a'.repeat(130),authorization:{from:wallet,to:recipient,value:'1000',validAfter:'0',validBefore:'9999999999',nonce}}};},receipt:async()=>({blockHash:'0x'+'6'.repeat(64),confirmed:true}),http:async(url,h)=>{
  if(url.includes('/x402/transfers'))return {status:200,headers:{},body:JSON.stringify({transfers:[{id:transferId,status:'completed',token:'USDC',sendingNetwork:NETWORK,recipientNetwork:NETWORK,fromAddress:wallet,toAddress:recipient,amount:'1000',nonce,txHash:tx}]})};
  if(h?.['X-Mercenta-Replay']==='cached-only'){recoveries++;return {status:200,headers:{},body:'{"source":"cached-original","verifiedBusinessSale":false}'};}
  if(h?.['PAYMENT-SIGNATURE']){paid++;throw Error('Response lost after Gateway acceptance');}
  return {status:402,headers:{'payment-required':Buffer.from(JSON.stringify({x402Version:2,accepts:[sellerRequirements(recipient)],resource:{url:DEMO_SERVICE_URL}})).toString('base64')},body:''};
 }};
 try{let buyer=new CircleAgent(db,c,ports,a);const p=await buyer.prepare(actor,randomUUID(),DEMO_SERVICE_ID);assert.equal((await buyer.confirm(actor,p.id,true)).status,'UNKNOWN');db.close();db=openDb(path);buyer=new CircleAgent(db,c,ports,a);
 assert.equal((await buyer.reconcile(actor,p.id)).status,'COMPLETED');await buyer.reconcile(actor,p.id);await buyer.confirm(actor,p.id,true);await buyer.recoverResource(actor,p.id);await buyer.recoverResource(actor,p.id);
 assert.equal(signs,1);assert.equal(paid,1);assert.equal(recoveries,1);assert.match(buyer.resource(actor,p.id).content,/cached-original/);
 const entries=db.prepare('SELECT * FROM ledger_entries WHERE batch_id=?').all('circle:'+p.id);assert.equal(entries.length,2);
 await assert.rejects(()=>buyer.recoverResource('wallet:0x'+'1'.repeat(40),p.id));
 }finally{db.close();rmSync(dir,{recursive:true,force:true});}
});
