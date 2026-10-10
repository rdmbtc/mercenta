const {test}=require('node:test'),assert=require('node:assert/strict'),ganache=require('ganache'),fs=require('fs'),path=require('path'),solc=require('solc');
const {createPublicClient,createWalletClient,custom,keccak256,toHex,encodeFunctionData}=require('viem');
const {privateKeyToAccount}=require('viem/accounts');
const V=require('../artifacts/MercentaTreasuryVault.json'),Token=require('../artifacts/MockUSDC.json');
const USDC='0x3600000000000000000000000000000000000000',USYC='0x8a5d989bbb96929f689b0200f435f53da42bf490',TELLER='0x51a8ce47dc08ba5cd19c7aa84ea6fd6664f60f9b';
const id=s=>keccak256(toHex(s));let n=0;
const source=`// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
interface Token {function transferFrom(address,address,uint256)external returns(bool);function transfer(address,uint256)external returns(bool);function mint(address,uint256)external;}
contract MockTeller{
 Token constant cash=Token(0x3600000000000000000000000000000000000000);
 Token constant shares=Token(0x8a5D989Bbb96929F689B0200f435f53dA42bF490);
 uint public mode;address public target;bytes public reentry;bool public blocked;
 function configure(uint m,address t,bytes calldata d)external{mode=m;target=t;reentry=d;}
 function deposit(uint a,address r)external returns(uint){require(mode!=1,"issuer unavailable");cash.transferFrom(msg.sender,address(this),a);uint s=mode==2?a-1:a;shares.mint(r,s);if(mode==3)return s+1;if(reentry.length>0){(bool ok,bytes memory why)=target.call(reentry);require(!ok&&bytes4(why)==bytes4(keccak256("ReentrancyGuardReentrantCall()")));blocked=true;}return s;}
 function redeem(uint s,address r,address account)external returns(uint){require(mode!=1,"issuer unavailable");shares.transferFrom(account,address(this),s);uint a=mode==2?s-1:s;cash.transfer(r,a);return mode==3?a+1:a;}
}`;
const compiled=JSON.parse(solc.compile(JSON.stringify({language:'Solidity',sources:{'MockTeller.sol':{content:source}},settings:{optimizer:{enabled:true,runs:200},evmVersion:'paris',outputSelection:{'*':{'*':['abi','evm.deployedBytecode.object']}}}})));
assert.equal(compiled.errors?.filter(e=>e.severity==='error').length??0,0);const M=compiled.contracts['MockTeller.sol'].MockTeller;
async function run(work,opts={}){
 const provider=ganache.provider({chain:{chainId:opts.chainId??5042},logging:{quiet:true},wallet:{totalAccounts:5}});
 const accounts=await provider.request({method:'eth_accounts',params:[]});const chain={id:opts.chainId??5042,name:'Local synthetic treasury EVM',nativeCurrency:{name:'USDC',symbol:'USDC',decimals:18},rpcUrls:{default:{http:[]}}};
 const p=createPublicClient({transport:custom(provider),cacheTime:0,pollingInterval:10});
 const wallets=accounts.map(a=>createWalletClient({account:privateKeyToAccount(provider.getInitialAccounts()[a].secretKey),chain,transport:custom(provider)}));
 const receipt=async hash=>{const r=await p.waitForTransactionReceipt({hash});assert.equal(r.status,'success');return r;};
 try{
 for(const a of [USDC,USYC])await provider.request({method:'evm_setAccountCode',params:[a,Token.deployedBytecode]});
 await provider.request({method:'evm_setAccountCode',params:[TELLER,'0x'+M.evm.deployedBytecode.object]});
 const args=[accounts[0],accounts[3],opts.tellerKeeper?TELLER:accounts[1],100000000n,200000000n,300000000n,400000000n];
 if(opts.invalid){const h=await wallets[0].deployContract({abi:V.abi,bytecode:V.bytecode,args:opts.invalid(args),gas:6000000n});assert.equal((await p.waitForTransactionReceipt({hash:h})).status,'reverted');return;}
 if(opts.chainId){const h=await wallets[0].deployContract({abi:V.abi,bytecode:V.bytecode,args,gas:6000000n});assert.equal((await p.waitForTransactionReceipt({hash:h})).status,'reverted');return;}
 const r=await receipt(await wallets[0].deployContract({abi:V.abi,bytecode:V.bytecode,args,gas:6000000n})),vault=r.contractAddress;
 const tx=async(fn,args=[],i=0,address=vault,abi=V.abi)=>receipt(await wallets[i].writeContract({address,abi,functionName:fn,args,gas:1500000n}));
 const read=(fn,args=[])=>p.readContract({address:vault,abi:V.abi,functionName:fn,args});
 const tr=(a,fn,args=[])=>p.readContract({address:a,abi:Token.abi,functionName:fn,args});
 const reject=(fn,args=[],i=0)=>assert.rejects(p.simulateContract({address:vault,abi:V.abi,functionName:fn,args,account:accounts[i]}));
 const deadline=async()=>Number((await p.getBlock()).timestamp+55n);
 const action=()=>id('action-'+(++n));
 const risk=()=>tx('recordRiskSnapshot',[0n,id('ledger risk snapshot')]);
 const open=async()=>{await risk();await tx('attestIssuerAccess',[true]);await tx('unpause');};
 await tx('mint',[accounts[0],1000000000n],0,USDC,Token.abi);await tx('approve',[vault,1000000000n],0,USDC,Token.abi);await tx('fundMerchantCapital',[500000000n]);
 await work({provider,p,wallets,accounts,vault,tx,read,tr,reject,deadline,action,risk,open,configure:(m,d='0x')=>tx('configure',[m,vault,d],0,TELLER,M.abi)});
 }finally{await provider.disconnect();}
}
test('treasury deploys paused and requires owner attestation plus fresh risk snapshot',()=>run(async f=>{assert.equal(await f.read('paused'),true);await f.reject('unpause');await f.tx('attestIssuerAccess',[true]);await f.reject('unpause');await f.risk();await f.tx('unpause');assert.equal(await f.read('accountedCashMicro'),500000000n);}));
test('keeper cannot fund, attest, alter snapshot, withdraw or unpause',()=>run(async f=>{for(const [fn,args] of [['fundMerchantCapital',[1n]],['attestIssuerAccess',[true]],['recordRiskSnapshot',[0n,id('x')]],['withdrawMerchantCash',[1n]],['unpause',[]]])await f.reject(fn,args,1);}));
test('subscription/redeem match exact deltas and clear both Teller allowances',()=>run(async f=>{await f.open();await f.tx('subscribe',[f.action(),200000000n,200000000n,await f.deadline()],1);assert.equal(await f.read('accountedShares'),200000000n);assert.equal(await f.read('accountedCashMicro'),300000000n);assert.equal(await f.tr(USDC,'allowance',[f.vault,TELLER]),0n);await f.tx('redeem',[f.action(),50000000n,50000000n,await f.deadline()],1);assert.equal(await f.read('accountedCashMicro'),350000000n);assert.equal(await f.read('accountedShares'),150000000n);assert.equal(await f.tr(USYC,'allowance',[f.vault,TELLER]),0n);}));
test('direct gifts are never credited as owner-funded capital',()=>run(async f=>{await f.tx('mint',[f.vault,500000000n],0,USDC,Token.abi);assert.equal(await f.read('accountedCashMicro'),500000000n);await f.open();await f.tx('recordRiskSnapshot',[400000000n,id('all funds reserved')]);await f.reject('subscribe',[f.action(),1n,1n,await f.deadline()],1);}));
test('reserve floor and offchain protected liabilities stop subscription and withdrawal',()=>run(async f=>{await f.open();await f.tx('recordRiskSnapshot',[350000000n,id('refunds and customer liabilities')]);await f.reject('subscribe',[f.action(),50000001n,1n,await f.deadline()],1);await f.reject('withdrawMerchantCash',[50000001n]);assert.equal(await f.read('accountedCashMicro'),500000000n);}));
test('expired risk snapshot rejects new allocation, reopening and withdrawals',()=>run(async f=>{await f.open();await f.provider.request({method:'evm_increaseTime',params:[16]});await f.provider.request({method:'evm_mine',params:[]});await f.reject('subscribe',[f.action(),1n,1n,await f.deadline()],1);await f.reject('withdrawMerchantCash',[1n]);await f.tx('pause',[],1);await f.reject('unpause');}));
test('action id replay, zero id, zero minimum and far deadline are rejected',()=>run(async f=>{await f.open();const a=f.action();await f.tx('subscribe',[a,1n,1n,await f.deadline()],1);await f.reject('subscribe',[a,1n,1n,await f.deadline()],1);await f.reject('subscribe',['0x'+'0'.repeat(64),1n,1n,await f.deadline()],1);await f.reject('subscribe',[f.action(),1n,0n,await f.deadline()],1);await f.reject('subscribe',[f.action(),1n,1n,(await f.deadline())+100],1);}));
test('Teller failure preserves accounted balance, unused action and allowance',()=>run(async f=>{await f.open();await f.configure(1);const a=f.action();const h=await f.wallets[1].writeContract({address:f.vault,abi:V.abi,functionName:'subscribe',args:[a,1n,1n,await f.deadline()],gas:1500000n});assert.equal((await f.p.waitForTransactionReceipt({hash:h})).status,'reverted');assert.equal(await f.read('actionUsed',[a]),false);assert.equal(await f.read('accountedCashMicro'),500000000n);assert.equal(await f.tr(USDC,'allowance',[f.vault,TELLER]),0n);}));
for(const mode of [2,3])test('adverse shares or falsified Teller return atomically roll back '+mode,()=>run(async f=>{await f.open();await f.configure(mode);await f.reject('subscribe',[f.action(),100n,100n,await f.deadline()],1);assert.equal(await f.read('accountedShares'),0n);}));
test('cycle and daily gross caps cannot be bypassed by redemption',()=>run(async f=>{await f.open();await f.reject('subscribe',[f.action(),200000001n,1n,await f.deadline()],1);await f.tx('subscribe',[f.action(),200000000n,1n,await f.deadline()],1);await f.tx('redeem',[f.action(),200000000n,1n,await f.deadline()],1);await f.reject('subscribe',[f.action(),100000001n,1n,await f.deadline()],1);}));
test('owner may redeem paused; keeper may not, and access revocation pauses',()=>run(async f=>{await f.open();await f.tx('subscribe',[f.action(),100n,100n,await f.deadline()],1);await f.tx('attestIssuerAccess',[false]);assert.equal(await f.read('paused'),true);await f.reject('redeem',[f.action(),100n,100n,await f.deadline()],1);await f.tx('redeem',[f.action(),100n,100n,await f.deadline()]);await f.reject('unpause');}));
test('withdrawal reaches only immutable merchant and preserves floor',()=>run(async f=>{await f.open();await f.tx('withdrawMerchantCash',[400000000n]);assert.equal(await f.tr(USDC,'balanceOf',[f.accounts[3]]),400000000n);assert.equal(await f.read('accountedCashMicro'),100000000n);await f.reject('withdrawMerchantCash',[1n]);}));
test('ownership cannot be renounced and keeper rotation pauses',()=>run(async f=>{await f.open();await f.reject('renounceOwnership');await f.tx('setKeeper',[f.accounts[2]]);assert.equal(await f.read('paused'),true);await f.reject('pause',[],1);}));
test('Teller reentrancy is rejected by guard even if Teller is configured as keeper',()=>run(async f=>{await f.open();const d=encodeFunctionData({abi:V.abi,functionName:'redeem',args:[f.action(),1n,1n,await f.deadline()]});await f.configure(0,d);await f.tx('subscribe',[f.action(),100n,100n,await f.deadline()]);assert.equal(await f.p.readContract({address:TELLER,abi:M.abi,functionName:'blocked'}),true);},{tellerKeeper:true}));
test('wrong chain cannot deploy',()=>run(async()=>{},{chainId:5042002}));
for(const change of [a=>{a[1]='0x'+'0'.repeat(40);return a;},a=>{a[3]=0n;return a;},a=>{a[5]=1n;return a;}])test('invalid immutable limits or roles cannot deploy',()=>run(async()=>{},{invalid:change}));

test('redemption rejects short assets and dishonest return, preserving shares and cash',()=>run(async f=>{await f.open();await f.tx('subscribe',[f.action(),100n,100n,await f.deadline()],1);for(const mode of [1,2,3]){await f.configure(mode);await f.reject('redeem',[f.action(),100n,100n,await f.deadline()],1);assert.equal(await f.read('accountedShares'),100n);assert.equal(await f.read('accountedCashMicro'),499999900n);assert.equal(await f.tr(USYC,'allowance',[f.vault,TELLER]),0n);}}));
test('maximum shares bounds cross-day exposure even with fresh added owner capital',()=>run(async f=>{await f.open();await f.tx('subscribe',[f.action(),200000000n,1n,await f.deadline()],1);await f.tx('subscribe',[f.action(),100000000n,1n,await f.deadline()],1);await f.tx('fundMerchantCapital',[500000000n]);await f.provider.request({method:'evm_increaseTime',params:[86400]});await f.provider.request({method:'evm_mine',params:[]});await f.risk();await f.reject('subscribe',[f.action(),200000000n,1n,await f.deadline()],1);assert.equal(await f.read('accountedShares'),300000000n);}));
test('owner handover requires nominated acceptance and no plain native funding',()=>run(async f=>{await f.tx('transferOwnership',[f.accounts[2]]);assert.equal((await f.read('owner')).toLowerCase(),f.accounts[0].toLowerCase());await f.reject('acceptOwnership',[],1);await f.tx('acceptOwnership',[],2);assert.equal((await f.read('owner')).toLowerCase(),f.accounts[2].toLowerCase());await assert.rejects(f.p.estimateGas({account:f.accounts[0],to:f.vault,value:1n}));}));
