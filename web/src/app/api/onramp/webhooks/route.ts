import {NextResponse} from 'next/server';
import {boundedBody,onrampConfig} from '@/lib/onramp-config';
import {verifyOnrampNotification} from '@/lib/onramp-webhook';
import {storeVerifiedOnrampNotification} from '@/lib/onramp-store';
export const runtime='nodejs';export const dynamic='force-dynamic';
// Subscription reachability check only. POST remains gated until the provider
// contract and durable processing are configured; HEAD never credits a deposit.
export async function HEAD(){return new NextResponse(null,{status:204,headers:{'Cache-Control':'no-store'}});}
export async function POST(req:Request){
 const c=onrampConfig();if(!c.webhookReady||!c.apiKey)return NextResponse.json({error:'WEBHOOK_NOT_CONFIGURED'},{status:503});
 try{const raw=await boundedBody(req,65536);const id=await verifyOnrampNotification(raw,req.headers.get('x-circle-key-id'),req.headers.get('x-circle-signature'));const inserted=await storeVerifiedOnrampNotification(c.environment,id,raw);return NextResponse.json({received:true,duplicate:!inserted},{headers:{'Cache-Control':'no-store'}});}
 catch(e){const message=(e as Error).message;const status=message==='BODY_TOO_LARGE'?413:['INVALID_SIGNATURE','INVALID_KEY','INVALID_NOTIFICATION'].includes(message)?400:message==='NOTIFICATION_ID_CONFLICT'?409:503;return NextResponse.json({error:status===503?'WEBHOOK_RETRY_REQUIRED':'WEBHOOK_REJECTED'},{status});}
}
