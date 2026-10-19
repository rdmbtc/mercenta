import {NextResponse} from 'next/server';
import {proxyBackend} from '@/lib/backend-proxy';
import {smallJson} from '@/lib/mainnet-retail';
import {issueNonce} from '@/lib/auth';
import {getDb} from '@/lib/db';
export const dynamic='force-dynamic';
export async function POST(req:Request){
  const origin=new URL(req.url).origin;
  if(req.headers.get('origin')!==origin)return NextResponse.json({error:'invalid_signin_context'},{status:403});
  let address:unknown;
  try{address=(await smallJson(req)).address}catch{return NextResponse.json({error:'invalid_request'},{status:400})}
  if(typeof address!=='string'||!/^0x[a-fA-F0-9]{40}$/.test(address))return NextResponse.json({error:'invalid_address'},{status:400});
  try {
    const res = await proxyBackend(new Request(req.url,{method:'POST',headers:req.headers,body:JSON.stringify({address,frontendOrigin:origin})}),'auth/nonce');
    if (res.ok) return res;
  } catch {}
  // Issue a durable single-use nonce: a signature must never be replayable.
  const { nonce, expiresAtMs } = issueNonce(getDb(), Date.now());
  return NextResponse.json({ nonce, expiresAtMs }, { headers: { 'Cache-Control': 'no-store' } });
}
