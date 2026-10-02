// Read-only public acceptance checks. No credentials, payment signatures or POSTs.
const origin='https://app.mercenta.xyz';
const service='https://api.mercenta.xyz/api/x402/margin-report';
const urls=[['apiHealth','https://api.mercenta.xyz/api/health',200],['privateBalanceGuard','https://api.mercenta.xyz/api/account/circle/balances',401],['unpaidSeller',service,402],['fundingProof',origin+'/circle/gateway-funding.arc-testnet.json',200],['submissionGuide','https://docs.mercenta.xyz/docs/guides/submission',200]];
const results=await Promise.all(urls.map(async([name,url,status])=>{
 try{const r=await fetch(url,{signal:AbortSignal.timeout(20000)});const text=await r.text();const result={name,url,status:r.status,pass:r.status===status};
 if(name==='unpaidSeller'&&result.pass){const required=JSON.parse(Buffer.from(r.headers.get('payment-required')??'','base64').toString());const a=required.accepts?.[0];result.pass=required.x402Version===2&&required.resource.url===service&&a.network==='eip155:5042002'&&a.amount==='1000'&&a.payTo.toLowerCase()==='0x58863e4a739da0e62c2eba258b7783e95d5c48ce'&&a.asset.toLowerCase()==='0x3600000000000000000000000000000000000000'&&a.extra.verifyingContract.toLowerCase()==='0x0077777d7eba4688bdef3e311b846f25870a19b9';result.priceTestUsdc='0.001000';}
 if(name==='fundingProof'&&result.pass){const p=JSON.parse(text);const nano=s=>{if(!/^\d+(\.\d{1,9})?$/.test(s))throw Error();const [i,d='']=s.split('.');return BigInt(i)*1000000000n+BigInt(d.padEnd(9,'0'));};result.pass=p.kind==='platform-testnet-funding-not-a-sale'&&p.chainId===5042002&&p.depositUsdc==='0.100000'&&nano(p.gasTotalUsdc)<=nano(p.gasCapUsdc);result.depositUsdc=p.depositUsdc;result.fundingProofSnapshotPaidRequests=p.paidServiceRequests;}
 return result;
 }catch{return {name,url,pass:false,error:'PUBLIC_CHECK_UNAVAILABLE'};}
}));
const report={checkedAt:new Date().toISOString(),checks:results,allPassed:results.every(r=>r.pass),fundsMoved:false,signaturesCreated:0,paidExecutionVerified:false,scope:'Public release and unpaid x402 requirements only; not an authenticated paid execution or customer-traction check.'};
console.log(JSON.stringify(report,null,2));if(!report.allPassed)process.exitCode=1;
