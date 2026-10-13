import {NextResponse} from 'next/server';
import {proxyBackend} from '@/lib/backend-proxy';
import {randomBytes} from 'node:crypto';
export const dynamic='force-dynamic';
export async function POST(req:Request){
  const origin=new URL(req.url).origin;
  if(req.headers.get('origin')!==origin)return NextResponse.json({error:'invalid_signin_context'},{status:403});
  let address:unknown;
  try{address=(await req.json()).address}catch{return NextResponse.json({error:'invalid_json'},{status:400})}
  if(typeof address!=='string'||!/^0x[a-fA-F0-9]{40}$/.test(address))return NextResponse.json({error:'invalid_address'},{status:400});
  try {
    const res = await proxyBackend(new Request(req.url,{method:'POST',headers:req.headers,body:JSON.stringify({address,frontendOrigin:origin})}),'auth/nonce');
    if (res.ok) return res;
  } catch {}
  const nonce = randomBytes(16).toString('hex');
  const expiresAtMs = Date.now() + 10 * 60 * 1000;
  return NextResponse.json({ nonce, expiresAtMs });
}
