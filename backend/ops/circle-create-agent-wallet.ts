/** Operator-only bootstrap. Never called from HTTP or a model tool. */
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {initiateDeveloperControlledWalletsClient} from '@circle-fin/developer-controlled-wallets';
import {agentConfigSchema} from '../src/services/circle-policy.js';
const file=process.argv[2];
if(!file||process.argv[3]!=='--create-testnet-eoa'){console.error('Usage: tsx ops/circle-create-agent-wallet.ts <private-bootstrap.json> --create-testnet-eoa');process.exit(2)}
const schema=z.object({apiKey:z.string().startsWith('TEST_API_KEY:').min(25),entitySecret:z.string().regex(/^[a-fA-F0-9]{64}$/),ownerWallet:z.string().regex(/^0x[a-fA-F0-9]{40}$/)}).strict();
async function main(){
 const secret=schema.parse(JSON.parse(readFileSync(file!,'utf8'))),stateFile=file+'.state.json',output=file+'.agent.json';
 if(existsSync(output)){const previous=agentConfigSchema.parse(JSON.parse(readFileSync(output,'utf8')));if(previous.provider!=='circle-mpc')throw new Error('OTHER_PROVIDER_CONFIG_EXISTS');console.log(JSON.stringify({existing:true,walletId:previous.walletId,walletAddress:previous.walletAddress,enabled:previous.enabled}));return}
 const stateSchema=z.object({walletSetRequestId:z.string().uuid(),walletRequestId:z.string().uuid(),walletSetId:z.string().uuid().optional()}).strict();
 const state=stateSchema.parse(existsSync(stateFile)?JSON.parse(readFileSync(stateFile,'utf8')):{walletSetRequestId:randomUUID(),walletRequestId:randomUUID()});
 const save=()=>writeFileSync(stateFile,JSON.stringify(state,null,2),{mode:0o600});save();
 const client=initiateDeveloperControlledWalletsClient({apiKey:secret.apiKey,entitySecret:secret.entitySecret});
 if(!state.walletSetId){const r=await client.createWalletSet({name:'Mercenta Arc Testnet Agent',idempotencyKey:state.walletSetRequestId});if(!r.data?.walletSet?.id)throw new Error('WALLET_SET_UNCONFIRMED');state.walletSetId=r.data.walletSet.id;save()}
 const response=await client.createWallets({walletSetId:state.walletSetId!,blockchains:['ARC-TESTNET'],count:1,accountType:'EOA',idempotencyKey:state.walletRequestId});
 const wallet=response.data?.wallets?.[0];if(!wallet||wallet.blockchain!=='ARC-TESTNET'||wallet.accountType!=='EOA')throw new Error('WALLET_CREATION_UNCONFIRMED');
 const cfg=agentConfigSchema.parse({...secret,provider:"circle-mpc",walletId:wallet.id,walletAddress:wallet.address,enabled:false,services:[]});writeFileSync(output,JSON.stringify(cfg,null,2),{mode:0o600,flag:'wx'});
 console.log(JSON.stringify({walletId:wallet.id,walletAddress:wallet.address,blockchain:'ARC-TESTNET',accountType:'EOA',enabled:false,fundsMoved:false,privateKeysExported:false}));
}
main().catch(()=>{console.error('Circle bootstrap did not complete. Keep the existing state file and reuse its idempotency keys; do not regenerate requests. Provider details and credentials withheld.');process.exitCode=1});
