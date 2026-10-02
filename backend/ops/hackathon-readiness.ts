import 'dotenv/config';
import {createPublicClient,http,keccak256,formatUnits,type Address} from 'viem';
import {loadConfig} from '../src/config.js';
import {PROFIT_CONTRACT} from '../src/services/profit-contract.js';
import {loadAgentConfig,checkedRequirements,NETWORK,CHAIN} from '../src/services/circle-policy.js';
import {gatewayAvailableUnits} from '../src/services/circle-gateway-balance.js';
import {boundedHttps} from '../src/services/circle-http.js';
import {DEMO_SERVICE_ID,DEMO_SERVICE_URL,DEMO_AMOUNT} from '../src/services/circle-demo-seller.js';

async function main(){
 const c=loadConfig(),a=loadAgentConfig(c.CIRCLE_AGENT_CONFIG_FILE);
 if(!a)throw Error('AGENT_NOT_CONFIGURED');
 const service=a.services.find(s=>s.id===DEMO_SERVICE_ID);
 if(!service||service.url!==DEMO_SERVICE_URL||service.maxAmountUnits!==DEMO_AMOUNT||service.payTo!==c.MERCHANT_WALLET?.toLowerCase())throw Error('DEMO_ALLOWLIST_NOT_PINNED');
 const client=createPublicClient({transport:http(c.ARC_RPC_URL)});
 if(await client.getChainId()!==5042002)throw Error('WRONG_CHAIN');
 const response=await boundedHttps(DEMO_SERVICE_URL);
 if(response.status!==402)throw Error('EXPECTED_UNPAID_402');
 const quote=checkedRequirements(response.headers['payment-required']??'',service);
 if(quote.accepted.amount!==DEMO_AMOUNT)throw Error('DEMO_PRICE_CHANGED');
 const supported=await boundedHttps('https://gateway-api-testnet.circle.com/v1/x402/supported');
 if(supported.status!==200)throw Error('SUPPORTED_NETWORKS_UNAVAILABLE');
 const kinds=JSON.parse(supported.body).kinds;
 if(!Array.isArray(kinds)||!kinds.some(k=>k.network===NETWORK&&k.x402Version===2&&k.extra?.verifyingContract?.toLowerCase()===CHAIN.gatewayWallet.toLowerCase()&&k.extra?.assets?.some((asset:{address:string})=>asset.address.toLowerCase()===CHAIN.usdc.toLowerCase())))throw Error('ARC_GATEWAY_NOT_SUPPORTED');
 const [code,native,gateway]=await Promise.all([client.getCode({address:PROFIT_CONTRACT.address as Address}),client.getBalance({address:a.walletAddress as Address}),gatewayAvailableUnits(a)]);
 if(!code||keccak256(code)!==PROFIT_CONTRACT.runtimeCodeHash)throw Error('PROFIT_CONTRACT_RUNTIME_MISMATCH');
 if(gateway<BigInt(DEMO_AMOUNT))throw Error('INSUFFICIENT_GATEWAY_BALANCE');
 console.log(JSON.stringify({readyForOwnerConfirmedDemo:a.enabled,chainId:5042002,service:DEMO_SERVICE_ID,servicePriceUsdc:'0.001000',unpaidEndpointStatus:402,walletTestUsdc:formatUnits(native,18),gatewayAvailableUnits:gateway.toString(),profitContractRuntimeVerified:true,requiresOwnerConfirmation:true,paidExecutionChecked:false,verifiedCustomerTraction:false,signaturesCreated:0,fundsMoved:false}));
}
main().catch(()=>{console.error('READINESS_CHECK_FAILED; no payment or signature attempted.');process.exitCode=1;});
