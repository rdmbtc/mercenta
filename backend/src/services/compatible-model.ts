import {createHash} from 'node:crypto';
import type {Config} from '../config.js';
type Message={role:'system'|'user';content:string};
const modelCooldown=new Map<string,number>(),credentialCooldown=new Map<string,number>();
export function configuredModels(c:Config){
 const primary=c.LLM_MODEL;if(!primary||!validModel(primary))return [];
 const extra=(c.LLM_FALLBACK_MODELS??'').split(',').map(v=>v.trim()).filter(Boolean);
 if(extra.length>3||extra.some(v=>!validModel(v)))return [];
 return [...new Set([primary,...extra])];
}
function validModel(v:string){return /^[A-Za-z0-9._/-]{1,100}$/.test(v);}
function endpoint(c:Config){
 if(!c.LLM_API_URL||!c.LLM_API_KEY)return null;
 try{const u=new URL(c.LLM_API_URL),h=u.hostname.toLowerCase();
 if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||u.port||!h.includes('.')||/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|\[)/.test(h)||/\.(local|internal|localhost)$/.test(h)||/^172\.(1[6-9]|2\d|3[01])\./.test(h)||!u.pathname.endsWith('/chat/completions'))return null;
 return u.href;
 }catch{return null;}
}
export function compatibleConfigured(c:Config){return !!endpoint(c)&&configuredModels(c).length>0;}
export function resetCompatibleCircuits(){modelCooldown.clear();credentialCooldown.clear();}
function retryMs(v:string|null){if(!v)return 60000;const n=Number(v),date=Date.parse(v);return Math.max(5000,Math.min(Number.isFinite(n)?n*1000:Number.isFinite(date)?date-Date.now():60000,3600000));}
async function content(r:Response){
 if(Number(r.headers.get('content-length')??0)>65536){await r.body?.cancel();throw Error('MODEL_RESPONSE_TOO_LARGE');}
 const reader=r.body?.getReader();if(!reader)throw Error('MODEL_EMPTY');let count=0;const chunks:Uint8Array[]=[];
 for(;;){const {done,value}=await reader.read();if(done)break;count+=value.length;if(count>65536){await reader.cancel();throw Error('MODEL_RESPONSE_TOO_LARGE');}chunks.push(value);}
 const d=JSON.parse(Buffer.concat(chunks).toString('utf8')) as {choices?:{message?:{content?:unknown}}[]};
 const text=d.choices?.[0]?.message?.content;if(typeof text!=='string')throw Error('MODEL_INVALID_RESPONSE');return text;
}
/** Private OpenAI-compatible endpoint; JSON is a proposal, never authority to move funds. */
export async function compatibleCompletion<T>(c:Config,messages:Message[],validate:(v:unknown)=>T,fetcher:typeof fetch=fetch,now=Date.now()):Promise<{value:T;provider:string;model:string}|null>{
 const url=endpoint(c),models=configuredModels(c),key=c.LLM_API_KEY;
 if(!url||!models.length||!key||messages.some(m=>m.content.includes(key)))return null;
 const credential=createHash('sha256').update(url+'\n'+key).digest('hex');if((credentialCooldown.get(credential)??0)>Date.now())return null;
 const deadline=now+12000;
 for(const model of models){const scope=credential+':'+model;if((modelCooldown.get(scope)??0)>Date.now())continue;const remaining=deadline-Date.now();if(remaining<500)break;
 try{const r=await fetcher(url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+key},body:JSON.stringify({model,messages,temperature:0,max_tokens:512,response_format:{type:'json_object'}}),redirect:'error',signal:AbortSignal.timeout(Math.min(5000,remaining))});
 if(!r.ok){await r.body?.cancel();if(r.status===401||r.status===403){credentialCooldown.set(credential,Date.now()+3600000);return null;}if(r.status===429){credentialCooldown.set(credential,Date.now()+retryMs(r.headers.get('Retry-After')));return null;}modelCooldown.set(scope,Date.now()+30000);continue;}
 const text=await content(r);if(text.includes(key))return null;
 const parsed=JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g,'').trim());return {value:validate(parsed),provider:'configured-model',model};
 }catch{modelCooldown.set(scope,Date.now()+30000);}
 }
 return null;
}
