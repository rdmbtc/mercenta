import {request} from 'node:https';
import {lookup} from 'node:dns/promises';
export type HttpResult={status:number;headers:Record<string,string>;body:string};
export function publicIPv4(ip:string){const p=ip.split('.').map(Number);if(p.length!==4||p.some(x=>!Number.isInteger(x)||x<0||x>255))return false;const a=p[0]!,b=p[1]!;return !(a===0||a===10||a===127||a>=224||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&(b===168||b===0||b===2)||a===100&&b>=64&&b<=127||a===198&&(b===18||b===19||b===51)||a===203&&b===0);}
export async function boundedHttps(url:string,headers:Record<string,string>={}):Promise<HttpResult>{
 const u=new URL(url);if(u.protocol!=='https:'||u.username||u.password||u.port&&u.port!=='443')throw new Error('HTTPS_REQUIRED');
 const addresses=await lookup(u.hostname,{family:4,all:true});if(!addresses.length||addresses.some(x=>!publicIPv4(x.address)))throw new Error('NONPUBLIC_DESTINATION');
 const pinned=addresses[0]!.address;
 return new Promise((resolve,reject)=>{
  const req=request(u,{method:'GET',headers:{accept:'application/json',...headers},servername:u.hostname,lookup:((_host:unknown,options:any,cb:any)=>options?.all?cb(null,[{address:pinned,family:4}]):cb(null,pinned,4)) as any},res=>{
   let bytes=0;const chunks:Buffer[]=[];res.on('data',b=>{bytes+=b.length;if(bytes>65536){req.destroy(new Error('RESPONSE_TOO_LARGE'));return}chunks.push(b)});res.on('error',()=>reject(new Error('SERVICE_RESPONSE_FAILED')));res.on('end',()=>{const h:Record<string,string>={};for(const[k,v]of Object.entries(res.headers))if(typeof v==='string')h[k]=v;resolve({status:res.statusCode??0,headers:h,body:Buffer.concat(chunks).toString('utf8')})});
  });
  const timer=setTimeout(()=>req.destroy(new Error('SERVICE_TIMEOUT')),10000);req.on('close',()=>clearTimeout(timer));req.on('error',()=>reject(new Error('SERVICE_REQUEST_FAILED')));req.end();
 });
}
