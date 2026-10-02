import {createPublicClient,http,encodeFunctionData,parseAbi,keccak256,toHex,type Address,type Hash} from 'viem';
export type AllocationPlan={id:string;kind:string;status:string;expiresAt:number;preview:Record<string,unknown>;result:Record<string,unknown>|null};
export async function commerceApi<T>(path:string,body?:unknown):Promise<T>{const r=await fetch('/api/account/'+path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,cache:'no-store'}),d=await r.json();if(!r.ok)throw new Error(d.code??'SERVICE_UNAVAILABLE');if(d.stale||d.readOnly)throw new Error('READ_ONLY_SNAPSHOT');return d}
const rpc=createPublicClient({transport:http('https://rpc.testnet.arc.network',{timeout:10000,retryCount:0})});
const token='0x3600000000000000000000000000000000000000' as const;
const erc=parseAbi(['function approve(address,uint256) returns(bool)','function allowance(address,address) view returns(uint256)','function balanceOf(address) view returns(uint256)']);
const vaultAbi=parseAbi(['function settleSale(bytes32,uint256,uint256,uint256,uint256,uint16[4],uint16)']);
type Ethereum={request:(p:{method:string;params?:unknown[]})=>Promise<unknown>};
export async function signCommerceAllocation(plan:AllocationPlan,wallet:string,stillCurrent:()=>boolean,onSubmitted:(hash:string)=>void){
 if(plan.kind!=='profit-split'||plan.status!=='WALLET_SIGNATURE_REQUIRED'||plan.expiresAt<Date.now())throw new Error('ALLOCATION_NOT_SIGNABLE');
 const eth=(window as unknown as {ethereum?:Ethereum}).ethereum;if(!eth)throw new Error('WALLET_NOT_AVAILABLE');
 const guard=async()=>{const accounts=await eth.request({method:'eth_accounts'}) as string[];if(!stillCurrent()||accounts[0]?.toLowerCase()!==wallet.toLowerCase()||await eth.request({method:'eth_chainId'})!=='0x4cef52')throw new Error('WALLET_CHANGED')};
 const accounts=await eth.request({method:'eth_requestAccounts'}) as string[];if(accounts[0]?.toLowerCase()!==wallet.toLowerCase())throw new Error('SIGNED_IN_WALLET_MISMATCH');
 try{await eth.request({method:'wallet_switchEthereumChain',params:[{chainId:'0x4cef52'}]})}catch(e){if((e as {code?:number}).code!==4902)throw e;await eth.request({method:'wallet_addEthereumChain',params:[{chainId:'0x4cef52',chainName:'Arc Testnet',nativeCurrency:{name:'USDC',symbol:'USDC',decimals:18},rpcUrls:['https://rpc.testnet.arc.network'],blockExplorerUrls:['https://testnet.arcscan.app']}]});await eth.request({method:'wallet_switchEthereumChain',params:[{chainId:'0x4cef52'}]})}
 await guard();
 const d=await commerceApi<{chainId:number;from:string;to:string;token:string;amountUnits:string;data:`0x${string}`;runtimeCodeHash:string}>('agent/plans/'+plan.id+'/wallet',{confirmed:true});
 const r=await fetch('/contracts/deployment.arc-testnet.json',{cache:'no-store'});if(!r.ok)throw new Error('DEPLOYMENT_RECORD_UNAVAILABLE');const meta=await r.json() as {address:string;runtimeCodeHash:string};
 if(d.chainId!==5042002||d.from.toLowerCase()!==wallet.toLowerCase()||d.to.toLowerCase()!==meta.address.toLowerCase()||d.runtimeCodeHash!==meta.runtimeCodeHash||d.token.toLowerCase()!==token)throw new Error('UNTRUSTED_ALLOCATION');
 const q=plan.preview,input=q.input as {taps:[number,number,number,number];minMarginBps:number},saleId=(q.saleId??keccak256(toHex(plan.id))) as Hash;
 const amount=BigInt(String(q.grossUnits));if(amount<=0n||amount>10000000n||amount.toString()!==d.amountUnits)throw new Error('AMOUNT_POLICY_REJECTED');
 const expected=encodeFunctionData({abi:vaultAbi,functionName:'settleSale',args:[saleId,amount,BigInt(String(q.cogsUnits)),BigInt(String(q.feesUnits)),BigInt(String(q.refundReserveUnits)),input.taps,input.minMarginBps]});if(expected!==d.data)throw new Error('UNEXPECTED_CALLDATA');
 const code=await rpc.getCode({address:d.to as Address});if(!code||keccak256(code)!==meta.runtimeCodeHash)throw new Error('CONTRACT_CODE_MISMATCH');
 const balance=await rpc.readContract({address:token,abi:erc,functionName:'balanceOf',args:[wallet as Address]});if(balance<amount)throw new Error('WALLET_NEEDS_GROSS_PLUS_GAS');
 const transact=async(to:Address,data:`0x${string}`)=>{await guard();const gas=await rpc.estimateGas({account:wallet as Address,to,data}),price=await rpc.getGasPrice();if(gas*price*2n>250000000000000000n)throw new Error('TESTNET_GAS_SAFETY_CAP');await guard();return await eth.request({method:'eth_sendTransaction',params:[{from:wallet,to,data,value:'0x0'}]}) as Hash};
 const allowance=await rpc.readContract({address:token,abi:erc,functionName:'allowance',args:[wallet as Address,d.to as Address]});if(allowance!==amount){const hash=await transact(token,encodeFunctionData({abi:erc,functionName:'approve',args:[d.to as Address,amount]}));const receipt=await rpc.waitForTransactionReceipt({hash,timeout:90000});if(receipt.status!=='success')throw new Error('APPROVAL_REVERTED')}
 if(plan.expiresAt<Date.now())throw new Error('QUOTE_EXPIRED_AFTER_APPROVAL');
 const hash=await transact(d.to as Address,d.data);onSubmitted(hash);return hash;
}
export async function verifyCommerceAllocation(id:string,hash:string){const r=await rpc.waitForTransactionReceipt({hash:hash as Hash,confirmations:2,timeout:90000});if(r.status!=='success')throw new Error('ALLOCATION_REVERTED');return commerceApi<AllocationPlan>('agent/plans/'+id+'/verify',{txHash:hash})}
