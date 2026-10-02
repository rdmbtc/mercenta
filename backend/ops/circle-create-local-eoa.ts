/** Creates an EMPTY isolated testnet wallet. No network writes or Gateway deposits. */
import {mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {homedir} from 'node:os';import {join} from 'node:path';import {spawnSync} from 'node:child_process';
import {generatePrivateKey,privateKeyToAccount} from 'viem/accounts';
import {agentConfigSchema} from '../src/services/circle-policy.js';
const dir=process.platform==='win32'?join(process.env.LOCALAPPDATA??homedir(),'Mercenta','circle'):join(homedir(),'.config','mercenta-circle');
mkdirSync(dir,{recursive:true,mode:0o700});
if(process.platform==='win32'){
 const username=process.env.USERNAME;if(!username)throw new Error('USER_IDENTITY_REQUIRED');
 const acl=spawnSync('icacls',[dir,'/inheritance:r','/grant:r',username+':(OI)(CI)F','SYSTEM:(OI)(CI)F'],{encoding:'utf8'});if(acl.status!==0)throw new Error('PRIVATE_DIRECTORY_ACL_FAILED');
}
const keyFile=join(dir,'arc-agent-key.json'),configFile=join(dir,'arc-agent-config.json');
if(!existsSync(keyFile))writeFileSync(keyFile,JSON.stringify({chainId:5042002,privateKey:generatePrivateKey()}),{mode:0o600,flag:'wx'});
const key=JSON.parse(readFileSync(keyFile,'utf8'));if(key.chainId!==5042002||typeof key.privateKey!=='string')throw new Error('EXISTING_KEY_INVALID');
const account=privateKeyToAccount(key.privateKey as `0x${string}`);
let createdConfig=false;
if(!existsSync(configFile)){
 const cfg=agentConfigSchema.parse({provider:'local-eoa',privateKeyPath:keyFile,walletAddress:account.address,ownerWallet:account.address,enabled:false,services:[]});
 writeFileSync(configFile,JSON.stringify(cfg,null,2),{mode:0o600,flag:'wx'});createdConfig=true;
}
const cfg=agentConfigSchema.parse(JSON.parse(readFileSync(configFile,'utf8')));
if(cfg.provider!=='local-eoa'||cfg.walletAddress!==account.address.toLowerCase())throw new Error('EXISTING_CONFIG_MISMATCH');
console.log(JSON.stringify({walletAddress:account.address,chainId:5042002,provider:'local-eoa',custody:'server-managed-local-eoa',createdConfig,enabled:cfg.enabled,servicesAllowed:cfg.services.length,ownerBinding:'provisional-agent-self; link approved portal owner before activation',privateStorage:'outside repository; restricted local access',privateKeyPrinted:false,networkWrites:0,fundsMoved:false}));
