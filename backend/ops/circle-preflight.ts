import {join} from 'node:path';
import {createPublicClient,http,formatUnits,type Address} from 'viem';
import {loadAgentConfig} from '../src/services/circle-policy.js';
import {verifyConfiguredWallet} from '../src/services/circle-signers.js';
import {gatewayAvailableUnits} from '../src/services/circle-gateway-balance.js';
async function main(){
 const path=process.env.CIRCLE_AGENT_CONFIG_FILE??(process.env.LOCALAPPDATA?join(process.env.LOCALAPPDATA,'Mercenta','circle','arc-agent-config.json'):undefined);
 const config=loadAgentConfig(path);if(!config)throw Error('CIRCLE_AGENT_NOT_CONFIGURED');
 await verifyConfiguredWallet(config);
 const rpc=createPublicClient({transport:http(process.env.ARC_RPC_URL??'https://rpc.testnet.arc.network',{timeout:10000,retryCount:0})});
 if(await rpc.getChainId()!==5042002)throw Error('WRONG_CHAIN');
 const code=await rpc.getCode({address:config.walletAddress as Address});if(code&&code!=='0x')throw Error('EOA_REQUIRED');
 const [native,gateway]=await Promise.all([rpc.getBalance({address:config.walletAddress as Address}),gatewayAvailableUnits(config)]);
 console.log(JSON.stringify({walletAddress:config.walletAddress,ownerWallet:config.ownerWallet,provider:config.provider,enabled:config.enabled,chainId:5042002,walletUsdc:formatUnits(native,18),gatewayAvailableUsdc:formatUnits(gateway,6),balancesAreSeparate:true,servicesApproved:config.services.length,provisionalOwner:config.ownerWallet===config.walletAddress,fundsMoved:false,paymentSigned:false,privateStorage:'not disclosed'}));
}
main().catch(()=>{console.error('CIRCLE_PREFLIGHT_FAILED: inspect configuration, key permissions or testnet connectivity; no payment executed.');process.exitCode=1});
