#!/usr/bin/env node
import fs from 'node:fs';import {createHash} from 'node:crypto';
import {createReceiptRpcWitness} from '../backend/dist/services/receipt-rpc.js';
import {CHAIN,NETWORK,GATEWAY_API,matchTransfer} from '../backend/dist/services/circle-policy.js';
import {boundedHttps} from '../backend/dist/services/circle-http.js';
async function main(){
 const args=process.argv.slice(2);if(args.some(x=>x!=='--integrity-only'))throw Error('UNKNOWN_ARGUMENT');
 const r=JSON.parse(fs.readFileSync(new URL('../submission/CIRCLE-TESTNET-ACCEPTANCE.json',import.meta.url),'utf8')),p=r.integrityPayload;
 if(r.status!=='VERIFIED_TECHNICAL_ACCEPTANCE'||r.chainId!==5042002||r.externalBusinessPilot!==false||r.mainnetUsed!==false||r.newAuthorizations!==1||r.maxAmountUnits!=='1000'||r.payment.amountUnits!=='1000'||r.payment.network!==NETWORK||r.payment.circleTransferId!==p.transferId||r.payment.id!==p.paymentId||r.walletAddress!==p.payer||r.ownerWallet!==p.recipient||r.payment.txHash!==p.hash||p.chainId!==5042002||p.amountMicro!=='1000'||p.responseDigest!==r.resource.digest||p.blockHash!==r.batchProof.blockHash||p.kind!==r.kind)throw Error('EVIDENCE_BINDING_INVALID');
 const digest=createHash('sha256').update(JSON.stringify(p)).digest('hex');if(digest!==r.evidenceDigest)throw Error('INTEGRITY_DIGEST_MISMATCH');
 if(r.journal.length!==2||r.journal.some(x=>x.amount_units!=='1000'||x.currency!=='USDC')||!r.journal.some(x=>x.direction==='DEBIT')||!r.journal.some(x=>x.direction==='CREDIT'))throw Error('EXACT_BALANCED_JOURNAL_REQUIRED');
 if(args.includes('--integrity-only'))return {status:'INTEGRITY_PASS_LIVE_SETTLEMENT_NOT_RECHECKED',digest,newPayments:false,externalBusinessPilot:false};
 const response=await boundedHttps(`${GATEWAY_API}/x402/transfers?nonce=${encodeURIComponent(p.nonce)}&network=${encodeURIComponent(NETWORK)}&pageSize=100`);if(response.status!==200)throw Error('LIVE_GATEWAY_UNAVAILABLE');const raw=JSON.parse(response.body);if(raw.transfers?.length!==1)throw Error('AMBIGUOUS_GATEWAY_TRANSFER');
 const transfer=matchTransfer(raw.transfers[0],{nonce:p.nonce,from:p.payer,to:p.recipient,amount:p.amountMicro});if(transfer.id!==p.transferId||transfer.status!=='completed'||transfer.txHash!==p.hash)throw Error('TRANSFER_ATTRIBUTION_MISMATCH');
 const primary=createReceiptRpcWitness('primary','https://rpc.testnet.arc.network'),secondary=createReceiptRpcWitness('secondary','https://rpc.quicknode.testnet.arc.network');
 for(const w of [primary,secondary])if(await w.getChainId()!==5042002)throw Error('WRONG_CHAIN');
 const [r1,r2,t1,t2,h1,h2]=await Promise.all([primary.getReceipt(p.hash),secondary.getReceipt(p.hash),primary.getTransaction(p.hash),secondary.getTransaction(p.hash),primary.getHead(),secondary.getHead()]);
 if(!r1||!r2||!t1||!t2||r1.status!==1||r2.status!==1||r1.blockHash!==r2.blockHash||r1.blockHash!==p.blockHash||r1.blockNumber!==r2.blockNumber||t1.hash.toLowerCase()!==p.hash.toLowerCase()||t2.hash.toLowerCase()!==p.hash.toLowerCase()||t1.chainId!==5042002||t2.chainId!==5042002||t1.to.toLowerCase()!==CHAIN.gatewayWallet.toLowerCase()||t2.to.toLowerCase()!==t1.to.toLowerCase()||t1.from.toLowerCase()!==t2.from.toLowerCase()||t1.value!==t2.value||r1.from.toLowerCase()!==t1.from.toLowerCase()||r2.from.toLowerCase()!==t2.from.toLowerCase()||r1.to.toLowerCase()!==t1.to.toLowerCase()||r2.to.toLowerCase()!==t2.to.toLowerCase()||h1-r1.blockNumber+1n<2n||h2-r2.blockNumber+1n<2n)throw Error('CANONICAL_BATCH_WITNESS_MISMATCH');
 const [b1,b2]=await Promise.all([primary.getBlock(r1.blockNumber),secondary.getBlock(r2.blockNumber)]);if(!b1||!b2||b1.hash!==r1.blockHash||b2.hash!==r2.blockHash)throw Error('NONCANONICAL_BLOCK');
 return {status:'LIVE_TECHNICAL_TESTNET_RECEIPT_VERIFIED',amountMicro:'1000',transferId:transfer.id,txHash:p.hash,confirmations:Number(h1<h2?h1-r1.blockNumber+1n:h2-r1.blockNumber+1n),circleNonceAttribution:true,dualCanonicalBatchWitnesses:true,independentPerPaymentBatchDecoding:false,businessIdentityVerified:false,externalBusinessPilot:false,newPayments:false,digestIsDigitalSignature:false};
}
main().then(r=>console.log(JSON.stringify(r,null,2))).catch(()=>{console.error('RECEIPT_VERIFICATION_BLOCKED_OR_INVALID; no payment signed or sent.');process.exitCode=1});
