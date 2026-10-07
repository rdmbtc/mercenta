#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {parse}=await import('../backend/node_modules/dotenv/lib/main.js');
const local=fs.existsSync(path.join(root,'backend/.env'))?parse(fs.readFileSync(path.join(root,'backend/.env'))):{};
const primary=process.env.ARC_RPC_URL??local.ARC_RPC_URL??'https://rpc.testnet.arc.network';
const secondary=process.env.ARC_SECONDARY_RPC_URL??local.ARC_SECONDARY_RPC_URL;
const {createReceiptRpcWitness}=await import('../backend/dist/services/receipt-rpc.js');
const {generateReceiptProof}=await import('../backend/dist/services/receipt-proof-generator.js');
const report={kind:'READ_ONLY_TESTNET_READINESS',timestamp:new Date().toISOString(),network:'Arc Testnet',configuredWitnesses:secondary?2:1,chainIds:[],receipt:null,canBroadcast:false,productionReady:false,status:'BLOCKED',blockers:[]};
let a,b;try{a=createReceiptRpcWitness('primary',primary);report.chainIds.push(await a.getChainId());if(secondary){b=createReceiptRpcWitness('secondary',secondary);report.chainIds.push(await b.getChainId())}else report.blockers.push('SECONDARY_RPC_NOT_CONFIGURED')}catch{report.blockers.push('RPC_READ_FAILED')}
if(report.chainIds.some(id=>id!==5042002))report.blockers.push('WRONG_TESTNET_CHAIN');
const idx=process.argv.indexOf('--evidence');if(idx>=0){try{const raw=JSON.parse(fs.readFileSync(process.argv[idx+1],'utf8'));if(a&&b){report.receipt=await generateReceiptProof({hash:raw.hash,expectedSender:raw.expectedSender,expectedRecipient:raw.expectedRecipient,expectedAmountMicro:BigInt(raw.expectedAmountMicro),chainId:5042002,minConfirmations:2,assetKind:raw.assetKind??'erc20'},{primaryWitness:a,secondaryWitness:b});if(report.receipt.status!=='VERIFIED')report.blockers.push('RECEIPT_NOT_VERIFIED')}else report.blockers.push('DUAL_WITNESS_UNAVAILABLE')}catch{report.blockers.push('INVALID_EVIDENCE_INPUT')}}else report.blockers.push('NO_OWNER_SUPPLIED_RECEIPT_INPUT');
report.blockers.push('CONSENTED_BUSINESS_PILOT_NOT_ATTESTED','MAINNET_NOT_AUTHORIZED');
fs.mkdirSync(path.join(root,'work/release-verification'),{recursive:true});fs.writeFileSync(path.join(root,'work/release-verification/live-readiness.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));process.exitCode=1;
