import {createHmac} from 'node:crypto';
import {refundInput,containsSupportSecret} from '@/lib/refund-input';
export const runtime='nodejs';export const dynamic='force-dynamic';
const hosts=new Set(['mercenta.xyz','www.mercenta.xyz','app.mercenta.xyz','testnet.mercenta.xyz','mainnet.mercenta.xyz']);
export async function POST(request:Request){
 const url=new URL(request.url),origin=request.headers.get('origin');
 if(!hosts.has(url.hostname)||origin!==url.origin||url.protocol!=='https:')return Response.json({code:'ORIGIN_REJECTED'},{status:403});
 const secret=process.env.BACKEND_PROXY_SECRET;
 if(!secret||secret.length<32)return Response.json({code:'SUPPORT_UNAVAILABLE'},{status:503});
 if(!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')??''))return Response.json({code:'INVALID_REQUEST'},{status:415});
 try{
 const reader=request.body?.getReader();if(!reader)throw Error('INVALID_REQUEST');let total=0;const chunks:Uint8Array[]=[];
 for(;;){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>8192){await reader.cancel();return Response.json({code:'INVALID_REQUEST'},{status:413});}chunks.push(value);}
 const parsed=refundInput.safeParse(JSON.parse(Buffer.concat(chunks).toString('utf8')));
 if(!parsed.success||containsSupportSecret(parsed.data.details))return Response.json({code:'INVALID_REQUEST'},{status:400});
 // Vercel supplies this header. Without a trusted platform header all sources share a conservative bucket.
 const source=process.env.VERCEL==='1'?(request.headers.get('x-vercel-forwarded-for')??'shared').split(',')[0].slice(0,100):'shared';
 const sourceHash=createHmac('sha256',secret).update('support-source/v1:'+source).digest('hex');
 const body=JSON.stringify({request:parsed.data,sourceHash}),ts=String(Date.now()),path='/api/support/refund',actor='support:public';
 const signature=createHmac('sha256',secret).update(`${ts}\nPOST\n${path}\n${actor}\n${body}`).digest('hex');
 const base=new URL(process.env.BACKEND_URL??'https://api.mercenta.xyz');
 if(base.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(base.hostname))throw Error('SUPPORT_UNAVAILABLE');
 const response=await fetch(new URL(path,base),{method:'POST',body,headers:{'Content-Type':'application/json','x-mercenta-actor':actor,'x-mercenta-timestamp':ts,'x-mercenta-signature':signature},redirect:'error',cache:'no-store',signal:AbortSignal.timeout(10000)});
 const data=await response.json();
 if(response.status===202&&typeof data.ticketId==='string'&&data.refundExecuted===false)return Response.json({ticketId:data.ticketId,status:data.status,manualReview:true,refundExecuted:false},{status:202,headers:{'Cache-Control':'no-store'}});
 return Response.json({code:response.status===429?'SUPPORT_RATE_LIMIT':'SUPPORT_UNAVAILABLE'},{status:response.status===429?429:503,headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({code:'SUPPORT_UNAVAILABLE'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
