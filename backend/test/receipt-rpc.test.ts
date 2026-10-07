import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createReceiptRpcWitness} from '../src/services/receipt-rpc.js';
const hash='0x'+'a'.repeat(64);
function mock(result:unknown,wrongId=false):typeof fetch{return (async(_url,init)=>{const req=JSON.parse(String(init?.body));return new Response(JSON.stringify({jsonrpc:'2.0',id:wrongId?999:req.id,result}),{status:200})}) as typeof fetch}
test('RPC adapter rejects insecure and credential-bearing endpoints',()=>{for(const url of ['http://rpc.example','https://user:secret@rpc.example'])assert.throws(()=>createReceiptRpcWitness('p',url),/INVALID_RPC_ENDPOINT/)});
test('read-only chain probe parses exact chain ID',async()=>{assert.equal(await createReceiptRpcWitness('p','https://rpc.example',mock('0x4cef52')).getChainId(),5042002)});
test('RPC envelope request IDs must match',async()=>{await assert.rejects(createReceiptRpcWitness('p','https://rpc.example',mock('0x1',true)).getHead(),/RPC_INVALID_ENVELOPE/)});
test('receipt must bind requested transaction hash',async()=>{await assert.rejects(createReceiptRpcWitness('p','https://rpc.example',mock({transactionHash:'0x'+'b'.repeat(64),logs:[]})).getReceipt(hash),/RPC_RECEIPT_HASH_MISMATCH/)});
test('oversized RPC response is rejected',async()=>{await assert.rejects(createReceiptRpcWitness('p','https://rpc.example',mock('x'.repeat(131073))).getHead(),/RPC_RESPONSE_TOO_LARGE/)});
test('RPC null receipt is not settlement evidence',async()=>{assert.equal(await createReceiptRpcWitness('p','https://rpc.example',mock(null)).getReceipt(hash),null)});
