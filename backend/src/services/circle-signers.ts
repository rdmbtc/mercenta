import {readFileSync,lstatSync} from 'node:fs';
import {privateKeyToAccount} from 'viem/accounts';
import {BatchEvmScheme} from '@circle-fin/x402-batching/client';
import {initiateDeveloperControlledWalletsClient} from '@circle-fin/developer-controlled-wallets';
import {checkedRequirements,CHAIN,type AgentConfig,type Requirements} from './circle-policy.js';
export function localAccount(c:AgentConfig){
 if(c.provider!=='local-eoa')throw new Error('LOCAL_SIGNER_REQUIRED');
 try{const s=lstatSync(c.privateKeyPath);if(!s.isFile()||s.isSymbolicLink()||s.size>4096||process.platform!=='win32'&&(s.mode&0o027)!==0)throw new Error();const k=JSON.parse(readFileSync(c.privateKeyPath,'utf8'));if(k.chainId!==5042002||typeof k.privateKey!=='string'||!/^0x[a-fA-F0-9]{64}$/.test(k.privateKey))throw new Error();const a=privateKeyToAccount(k.privateKey as `0x${string}`);if(a.address.toLowerCase()!==c.walletAddress)throw new Error();return a}catch{throw new Error('LOCAL_SIGNER_CONFIGURATION_INVALID')}
}
export async function verifyConfiguredWallet(c:AgentConfig){
 if(c.provider==='local-eoa'){localAccount(c);return}
 const sdk=initiateDeveloperControlledWalletsClient({apiKey:c.apiKey,entitySecret:c.entitySecret});const w=(await sdk.getWallet({id:c.walletId})).data?.wallet;
 if(!w||w.blockchain!=='ARC-TESTNET'||w.accountType!=='EOA'||w.address.toLowerCase()!==c.walletAddress)throw new Error('CIRCLE_WALLET_MISMATCH');
}
export async function signGatewayPayload(c:AgentConfig,r:Requirements){
 if(!c.enabled)throw new Error('CIRCLE_EXECUTION_DISABLED');
 const s=c.services.find(x=>x.payTo===r.payTo.toLowerCase()&&BigInt(r.amount)<=BigInt(x.maxAmountUnits));if(!s)throw new Error('CIRCLE_SERVICE_NOT_ALLOWED');
 const accepted=checkedRequirements(Buffer.from(JSON.stringify({x402Version:2,accepts:[r],resource:{url:s.url}})).toString('base64'),s).accepted;
 const account=c.provider==='local-eoa'?localAccount(c):null;
 const sdk=c.provider==='circle-mpc'?initiateDeveloperControlledWalletsClient({apiKey:c.apiKey,entitySecret:c.entitySecret}):null;
 const scheme=new BatchEvmScheme({address:c.walletAddress as `0x${string}`,signTypedData:async p=>{
  if(Number(p.domain.chainId)!==5042002||String(p.domain.verifyingContract).toLowerCase()!==CHAIN.gatewayWallet.toLowerCase()||p.primaryType!=='TransferWithAuthorization'||String(p.message.from).toLowerCase()!==c.walletAddress||String(p.message.to).toLowerCase()!==accepted.payTo||String(p.message.value)!==accepted.amount)throw new Error('UNSAFE_GATEWAY_SIGNATURE');
  if(account)return account.signTypedData(p as Parameters<typeof account.signTypedData>[0]);
  const typed={domain:{...p.domain,chainId:p.domain.chainId.toString()},primaryType:p.primaryType,types:{EIP712Domain:[{name:'name',type:'string'},{name:'version',type:'string'},{name:'chainId',type:'uint256'},{name:'verifyingContract',type:'address'}],...p.types},message:p.message};
  const result=await sdk!.signTypedData({walletId:c.provider==='circle-mpc'?c.walletId:'',data:JSON.stringify(typed,(_k,v)=>typeof v==='bigint'?v.toString():v),memo:'Mercenta confirmed Arc Testnet API purchase'});
  const signature=result.data?.signature;if(!signature)throw new Error('CIRCLE_SIGNATURE_MISSING');return (signature.startsWith('0x')?signature:`0x${signature}`) as `0x${string}`;
 }});
 return scheme.createPaymentPayload(2,accepted);
}
