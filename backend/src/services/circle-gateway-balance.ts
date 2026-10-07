import {parseUnits} from 'viem';
import {CHAIN,GATEWAY_API,type AgentConfig} from './circle-policy.js';
export async function gatewayAvailableUnits(c:AgentConfig,fetcher:typeof fetch=fetch):Promise<bigint>{
 const r=await fetcher(GATEWAY_API+'/balances',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:'USDC',sources:[{depositor:c.walletAddress,domain:CHAIN.domain}]}),signal:AbortSignal.timeout(8000),redirect:'error'});
 if(!r.ok||!r.body)throw new Error('GATEWAY_BALANCE_UNAVAILABLE');
 const reader=r.body.getReader();let bytes=0;const chunks:Uint8Array[]=[];
 try{for(;;){const next=await reader.read();if(next.done)break;bytes+=next.value.length;if(bytes>32768)throw new Error('GATEWAY_RESPONSE_TOO_LARGE');chunks.push(next.value)}}finally{await reader.cancel().catch(()=>{})}
 let body:unknown;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{throw new Error('GATEWAY_BALANCE_UNAVAILABLE')}
 const b=(body as {balances?:unknown})?.balances;
 if(!Array.isArray(b)||b.length!==1||typeof b[0]?.balance!=='string'||!/^(0|[1-9]\d*)(\.\d{1,6})?$/.test(b[0].balance))throw new Error('GATEWAY_BALANCE_UNAVAILABLE');
 if(b[0].token!==undefined&&b[0].token!=='USDC')throw new Error('GATEWAY_BALANCE_MISMATCH');
 if(b[0].domain!==undefined&&b[0].domain!==CHAIN.domain)throw new Error('GATEWAY_BALANCE_MISMATCH');
 if(b[0].depositor!==undefined&&String(b[0].depositor).toLowerCase()!==c.walletAddress)throw new Error('GATEWAY_BALANCE_MISMATCH');
 return parseUnits(b[0].balance,6);
}
