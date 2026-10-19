import {NextResponse} from 'next/server';
import {proxyBackend} from '@/lib/backend-proxy';
import {mintSession,SESSION_COOKIE,buildAuthMessage,consumeNonce} from '@/lib/auth';
import {smallJson} from '@/lib/mainnet-retail';
import {getDb} from '@/lib/db';
import {verifyMessage, isAddress} from 'viem';
export const dynamic='force-dynamic';
export async function POST(req:Request){
  const origin=new URL(req.url).origin;
  if(req.headers.get('origin')!==origin)return NextResponse.json({error:'invalid_signin_context'},{status:403});
  let b:Record<string,unknown>;
  try{b=await smallJson(req)}catch{return NextResponse.json({error:'invalid_request'},{status:400})}
  if(!b||typeof b!=='object'||Array.isArray(b))return NextResponse.json({error:'invalid_json'},{status:400});
  const address=typeof b.address==='string'&&isAddress(b.address)?(b.address as `0x${string}`).toLowerCase():null;
  if(!address)return NextResponse.json({error:'invalid_address'},{status:400});

  let verifiedAddress:string|null=null;
  let proofCookies:Array<{name:string;value:string}>=[];

  try{
    const proof=await proxyBackend(new Request(req.url,{method:'POST',headers:req.headers,body:JSON.stringify({address:b.address,nonce:b.nonce,signature:b.signature,issuedAt:b.issuedAt,frontendOrigin:origin})}),'auth/verify');
    if(proof.ok){
      const data=await proof.json();
      if(data.ok===true&&typeof data.address==='string'&&/^0x[a-f0-9]{40}$/.test(data.address)){
        verifiedAddress=data.address.toLowerCase();
        proofCookies=proof.cookies.getAll().map(c=>({name:c.name,value:c.value}));
      }
    }
  }catch{}

  if(!verifiedAddress&&typeof b.signature==='string'&&typeof b.nonce==='string'){
    const issuedAt=typeof b.issuedAt==='number'?b.issuedAt:Date.now();
    const msg=buildAuthMessage(address,b.nonce,issuedAt);
    try{
      const valid=await verifyMessage({address:address as `0x${string}`,message:msg,signature:b.signature as `0x${string}`});
      // A signature alone is not a login: the nonce must be server-issued, fresh and unused.
      const fresh=issuedAt<=Date.now()+30000&&Date.now()-issuedAt<=600000;
      if(valid&&fresh&&/^[a-f0-9]{32}$/.test(b.nonce)&&consumeNonce(getDb(),b.nonce,address,Date.now()))verifiedAddress=address;
    }catch{}
  }

  if(!verifiedAddress)return NextResponse.json({error:'invalid_backend_proof'},{status:502});

  const now=Date.now(),{token,expiresAtMs}=mintSession(verifiedAddress,now);
  const res=NextResponse.json({ok:true,address:verifiedAddress,expiresAtMs},{headers:{'Cache-Control':'no-store'}});
  for(const cookie of proofCookies)res.cookies.set(cookie.name,cookie.value);
  res.cookies.set(SESSION_COOKIE,token,{httpOnly:true,sameSite:'lax',secure:new URL(req.url).protocol==='https:',path:'/',maxAge:Math.floor((expiresAtMs-now)/1000)});
  return res;
}

