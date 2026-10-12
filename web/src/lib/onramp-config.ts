export type OnrampEnvironment='sandbox'|'production';
export function onrampConfig(env:NodeJS.ProcessEnv=process.env){
 const environment:OnrampEnvironment=env.ONRAMP_ENVIRONMENT==='production'?'production':'sandbox';
 const apiBaseUrl=environment==='production'?'https://api.circle.com':'https://api-test.circle.com';
 const widgetBaseUrl=environment==='production'?'https://onramp.arc.io':'https://onramp-sandbox.arc.io';
 const appOrigin=env.ONRAMP_APP_ORIGIN??'';let referrerDomain='';let originValid=false;
 try{const u=new URL(appOrigin);referrerDomain=u.hostname;originValid=u.origin===appOrigin&&(u.protocol==='https:'||(environment==='sandbox'&&u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname)));if(environment==='production'&&['localhost','127.0.0.1','testnet.mercenta.xyz'].includes(u.hostname))originValid=false;}catch{}
 const encryptionKey=env.ONRAMP_WEBHOOK_ENCRYPTION_KEY??'';
 const webhookReady=env.ONRAMP_WEBHOOK_PROFILE==='circle-v2'&&env.ONRAMP_WEBHOOK_CONTRACT_VERIFIED==='true'&&!!env.ONRAMP_DATABASE_URL&&/^[A-Za-z0-9+/]{43}=$/.test(encryptionKey);
 const reason=env.ONRAMP_ENABLED!=='true'?'disabled':!env.ONRAMP_API_KEY?'missing_api_key':!originValid?'invalid_app_origin':environment==='production'&&(!webhookReady||env.ONRAMP_RECONCILIATION_VERIFIED!=='true')?'production_reconciliation_required':null;
 return {environment,apiBaseUrl,widgetBaseUrl,appOrigin,referrerDomain,apiKey:env.ONRAMP_API_KEY??'',enabled:reason===null,reason,webhookReady};
}
export function publicOnrampConfig(requestOrigin:string){const c=onrampConfig();const originMatches=requestOrigin===c.appOrigin;return {enabled:c.enabled&&originMatches,environment:c.environment,widgetBaseUrl:c.widgetBaseUrl,asset:'USDC',chain:'Arc',reason:c.reason??(!originMatches?'origin_not_configured':null)};}
export async function boundedBody(req:Request,limit:number){const reader=req.body?.getReader();if(!reader)return new Uint8Array();const chunks:Uint8Array[]=[];let size=0;try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();throw Error('BODY_TOO_LARGE');}chunks.push(value);}}finally{reader.releaseLock();}const out=new Uint8Array(size);let offset=0;for(const c of chunks){out.set(c,offset);offset+=c.length;}return out;}
