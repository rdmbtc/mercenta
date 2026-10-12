import {NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
import {createOnrampServerKit,KitError} from '@circle-fin/onramp-kit/server';
import {requireSession} from '@/lib/auth';
import {onrampConfig,boundedBody} from '@/lib/onramp-config';
import {reserveOnrampAttempt,recordOnrampSession} from '@/lib/onramp-store';
import {z} from 'zod';
export const dynamic='force-dynamic';export const runtime='nodejs';
const bodySchema=z.object({amount:z.string().regex(/^\d{1,5}(\.\d{1,2})?$/).refine(v=>Number(v)>0&&Number(v)<=10000).optional(),currency:z.enum(['USD','EUR']).default('USD')}).strict();
const json=(code:string,status:number)=>NextResponse.json({code},{status,headers:{'Cache-Control':'no-store'}});
export async function POST(req:Request){
 const origin=new URL(req.url).origin;if(req.headers.get('origin')!==origin)return json('ORIGIN_REJECTED',403);
 try{
  const user=requireSession(req,Date.now());if(!user)return json('WALLET_AUTH_REQUIRED',401);
  const config=onrampConfig();if(!config.enabled||config.appOrigin!==origin)return json('ONRAMP_NOT_CONFIGURED',503);
  const bytes=await boundedBody(req,4096);let body:unknown;try{body=JSON.parse(new TextDecoder().decode(bytes));}catch{return json('INVALID_JSON',400);}
  const input=bodySchema.safeParse(body);if(!input.success)return json('INVALID_FUNDING_REQUEST',400);
  await reserveOnrampAttempt(user.address,config.environment);
  const launchReference=randomUUID();
  const kit=createOnrampServerKit({apiKey:config.apiKey,baseUrl:config.apiBaseUrl,widgetBaseUrl:config.widgetBaseUrl,referrerDomain:config.referrerDomain,requestTimeoutMs:15000});
  const session=await kit.createSession({appUserId:'mercenta:'+config.environment+':'+user.address.toLowerCase(),destinationAddress:user.address.toLowerCase(),destinationChain:'arc',amount:input.data.amount,currency:input.data.currency,assets:{tokens:['USDC'],chains:['arc']},metadata:{app:'mercenta',environment:config.environment,launchReference}});
  if(!session.sessionToken||!Number.isFinite(Date.parse(session.expiresAt))||Date.parse(session.expiresAt)<=Date.now()||new URL(session.widgetUrl).origin!==config.widgetBaseUrl||session.destinationWallet&&session.destinationWallet.toLowerCase()!==user.address.toLowerCase())return json('INVALID_PROVIDER_SESSION',502);
  await recordOnrampSession(config.environment,session.sessionId||launchReference,user.address,session.expiresAt);
  return NextResponse.json({sessionId:session.sessionId,launchReference,sessionToken:session.sessionToken,widgetUrl:session.widgetUrl,destinationWallet:user.address.toLowerCase(),expiresAt:session.expiresAt,traceId:session.traceId},{headers:{'Cache-Control':'no-store'}});
 }catch(e){if((e as Error).message==='BODY_TOO_LARGE')return json('BODY_TOO_LARGE',413);if((e as Error).message==='ONRAMP_RATE_LIMIT')return json('ONRAMP_RATE_LIMIT',429);if(e instanceof KitError)return json('ONRAMP_PROVIDER_UNAVAILABLE',e.type==='RATE_LIMIT'?429:e.type==='INPUT'?400:502);return json('ONRAMP_TEMPORARILY_UNAVAILABLE',503);}
}
