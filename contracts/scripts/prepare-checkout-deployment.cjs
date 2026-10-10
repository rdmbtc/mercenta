/** Produces an unsigned creation request, never signs, broadcasts or loads private credentials. */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {encodeDeployData,createPublicClient,http,parseAbi,keccak256}=require('viem');
const PIN='0x58863e4a739da0e62c2eba258b7783e95d5c48ce',TOKEN='0x3600000000000000000000000000000000000000';
const artifact=require('../artifacts/MercentaCheckout.json');
function validate(raw){
 const fields=['chainId','merchant','owner','quoteSigner','deployer','maxOrderMicro','dailyVolumeCapMicro','deploymentApproved'];
 if(!raw||typeof raw!=='object'||Object.keys(raw).some(k=>!fields.includes(k))||raw.chainId!==5042||typeof raw.deploymentApproved!=='boolean')throw Error('INVALID_PUBLIC_DEPLOYMENT_CONFIG');
 for(const key of ['merchant','owner','quoteSigner','deployer'])if(typeof raw[key]!=='string'||!/^0x[0-9a-f]{40}$/i.test(raw[key])||/^0x0{40}$/i.test(raw[key]))throw Error('CONFIRMED_PUBLIC_ADDRESSES_REQUIRED');
 if(raw.merchant.toLowerCase()!==PIN||[raw.owner,raw.quoteSigner].some(s=>s.toLowerCase()===TOKEN))throw Error('DEPLOYMENT_RECIPIENT_OR_ROLE_INVALID');
 for(const key of ['maxOrderMicro','dailyVolumeCapMicro'])if(typeof raw[key]!=='string'||! /^[1-9]\d{0,20}$/.test(raw[key]))throw Error('EXPLICIT_INTEGER_LIMITS_REQUIRED');
 const order=BigInt(raw.maxOrderMicro),day=BigInt(raw.dailyVolumeCapMicro);if(order>10n**18n||day>10n**20n||day<order)throw Error('DEPLOYMENT_LIMITS_INVALID');
 if(!artifact.compiler.startsWith('0.8.28+')||artifact.evmVersion!=='paris')throw Error('PINNED_COMPILER_REQUIRED');
 const source=fs.readFileSync(path.join(__dirname,'../src/MercentaCheckout.sol'),'utf8').replace(/\r\n/g,'\n');
 if(crypto.createHash('sha256').update(source).digest('hex')!==artifact.sourceSha256)throw Error('RECOMPILE_CHANGED_SOURCE');
 if((artifact.deployedBytecode.length-2)/2>24576)throw Error('RUNTIME_CODE_SIZE_LIMIT');
 return {...raw,merchant:PIN,maxOrderMicro:order,dailyVolumeCapMicro:day};
}
function buildUnsigned(raw){const c=validate(raw);return {chainId:5042,from:c.deployer,data:encodeDeployData({abi:artifact.abi,bytecode:artifact.bytecode,args:[c.owner,c.quoteSigner,c.merchant,c.maxOrderMicro,c.dailyVolumeCapMicro]}),value:'0x0',kind:'UNSIGNED_CREATION_ONLY',startsPaused:true,approvalRecorded:c.deploymentApproved};}
async function preflight(raw){const c=validate(raw),rows=[];for(const endpoint of ['https://rpc.mainnet.arc.io','https://rpc.quicknode.mainnet.arc.io']){const client=createPublicClient({transport:http(endpoint,{retryCount:0,timeout:10000})});if(await client.getChainId()!==5042)throw Error('WRONG_CHAIN');const decimals=await client.readContract({address:TOKEN,abi:parseAbi(['function decimals() view returns(uint8)']),functionName:'decimals'});if(Number(decimals)!==6)throw Error('WRONG_USDC_DECIMALS');const request=buildUnsigned(raw);const gas=await client.estimateGas({account:c.deployer,data:request.data,value:0n});const price=await client.getGasPrice();rows.push({host:new URL(endpoint).hostname,chainId:5042,tokenDecimals:6,estimatedGas:gas.toString(),gasPriceWei:price.toString()});}return rows;}
module.exports={validate,buildUnsigned,preflight};
if(require.main===module){(async()=>{const argv=process.argv.slice(2),opts={};for(let i=0;i<argv.length;i++){if(argv[i]==='--online')opts.online=true;else if(['--config','--out'].includes(argv[i])){if(!argv[i+1])throw Error('ARGUMENT_VALUE_REQUIRED');opts[argv[i].slice(2)]=argv[++i];}else throw Error('UNKNOWN_ARGUMENT');}if(!opts.config||!opts.out)throw Error('PUBLIC_CONFIG_AND_OUTPUT_PATH_REQUIRED');const raw=JSON.parse(fs.readFileSync(opts.config,'utf8')),request=buildUnsigned(raw),witnesses=opts.online?await preflight(raw):[];fs.writeFileSync(opts.out,JSON.stringify({request,witnesses,sourceSha256:artifact.sourceSha256,independentAudit:false,broadcast:false},null,2)+'\n',{mode:0o600});console.log(JSON.stringify({kind:'UNSIGNED_CREATION_ONLY',chainId:5042,recipient:PIN,dataHash:keccak256(request.data),startsPaused:true,independentAudit:false,broadcast:false,onlineReadOnlyChecks:witnesses.length}));})().catch(e=>{console.error(e.message);process.exitCode=1;});}
