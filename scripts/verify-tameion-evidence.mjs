import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const manifest=JSON.parse(await fs.readFile(resolve(root,'submission/tameion-evidence.json'),'utf8'));
const endpoint=process.env.ARC_EVIDENCE_RPC_URL || 'https://rpc.mainnet.arc.io';
const url=new URL(endpoint);
if(url.protocol!=='https:') throw new Error('HTTPS_RPC_REQUIRED');
async function rpc(method,params=[]){const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error('RPC_HTTP_ERROR');const data=await response.json();if(data.error)throw new Error('RPC_ERROR');return data.result;}
const report={schema:'mercenta.chain-observations.v1',checkedAt:new Date().toISOString(),chainId:Number(await rpc('eth_chainId')),verification:'Single RPC observations only; no independent business, sponsor-funding or delivery verification.',transactions:[]};
if(report.chainId!==5042)throw new Error('WRONG_CHAIN');
for(const item of manifest.transactions){
 const [tx,receipt]=await Promise.all([rpc('eth_getTransactionByHash',[item.hash]),rpc('eth_getTransactionReceipt',[item.hash])]);
 if(!tx||!receipt)throw new Error('MISSING_TRANSACTION:'+item.id);
 const expectedWei=BigInt(item.amountMicro)*1_000_000_000_000n;
 if(receipt.status!=='0x1'||tx.from.toLowerCase()!==item.buyer.toLowerCase()||tx.to?.toLowerCase()!==manifest.merchant.toLowerCase()||BigInt(tx.value)!==expectedWei||tx.input!=='0x')throw new Error('DIRECT_PAYMENT_MISMATCH:'+item.id);
 const block=await rpc('eth_getBlockByNumber',[receipt.blockNumber,false]);
 if(!block||block.hash.toLowerCase()!==receipt.blockHash.toLowerCase())throw new Error('BLOCK_MISMATCH:'+item.id);
 report.transactions.push({id:item.id,hash:item.hash,status:'confirmed_direct_native_payment',buyer:tx.from,recipient:tx.to,amountMicro:item.amountMicro,valueWei:BigInt(tx.value).toString(),blockNumber:Number(BigInt(receipt.blockNumber)),blockHash:receipt.blockHash,timestamp:new Date(Number(BigInt(block.timestamp))*1000).toISOString(),routerUsed:false,deliveryVerifiedByThisCheck:false,customerIdentityVerifiedByThisCheck:false});
}
const out=resolve(root,'submission/tameion-chain-observations.json');
await fs.writeFile(out,JSON.stringify(report,null,2)+'\n');
console.log('Verified chain ID and exact successful direct native payments for '+report.transactions.length+' historical references.');
console.log('No transaction signed or sent. Output: submission/tameion-chain-observations.json');
