import 'server-only';
import {createPublicKey,verify,type KeyObject} from 'node:crypto';
import {onrampConfig} from './onramp-config';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const keys=new Map<string,{key:KeyObject;expires:number}>();
/** Opt-in Circle v2 adapter. Confirm the Onramp provider contract before enabling. */
export async function verifyOnrampNotification(raw:Uint8Array,keyId:string|null,signature:string|null){
 const c=onrampConfig();if(!c.webhookReady)throw Error('WEBHOOK_NOT_CONFIGURED');
 if(!keyId||!uuid.test(keyId)||!signature||signature.length>256||!/^[A-Za-z0-9+/]+={0,2}$/.test(signature))throw Error('INVALID_SIGNATURE');
 const cacheId=c.environment+':'+keyId,cached=keys.get(cacheId);let key=cached&&cached.expires>Date.now()?cached.key:undefined;
 if(!key){const response=await fetch(c.apiBaseUrl+'/v2/notifications/publicKey/'+keyId,{headers:{Authorization:'Bearer '+c.apiKey},signal:AbortSignal.timeout(8000),cache:'no-store'});if(!response.ok)throw Error('KEY_LOOKUP_FAILED');const {data}=await response.json();if(data?.id!==keyId||data?.algorithm!=='ECDSA_SHA_256'||typeof data?.publicKey!=='string'||data.publicKey.length>4096)throw Error('INVALID_KEY');key=createPublicKey({key:Buffer.from(data.publicKey,'base64'),format:'der',type:'spki'});if(key.asymmetricKeyType!=='ec')throw Error('INVALID_KEY');if(keys.size>=64)keys.delete(keys.keys().next().value!);keys.set(cacheId,{key,expires:Date.now()+3600000});}
 if(!verify('sha256',raw,key,Buffer.from(signature,'base64')))throw Error('INVALID_SIGNATURE');
 let event:unknown;try{event=JSON.parse(Buffer.from(raw).toString('utf8'));}catch{throw Error('INVALID_NOTIFICATION');}
 const id=(event as {notificationId?:unknown})?.notificationId;if(typeof id!=='string'||!uuid.test(id))throw Error('INVALID_NOTIFICATION');
 return id;
}
