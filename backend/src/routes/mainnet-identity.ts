/** Identity-only routes. No custody, quote, deposit, procurement or financial grant is mounted here. */
import type {FastifyInstance,FastifyRequest} from 'fastify';
import {z} from 'zod';
import {MainnetWalletAuth,MAINNET_SESSION_COOKIE} from '../services/mainnet-wallet-auth.js';
import type {MainnetStagingStore} from '../services/mainnet-staging-store.js';
const origin='https://mainnet.mercenta.xyz';
function token(req:FastifyRequest){const pairs=(req.headers.cookie??'').split(';').map(s=>s.trim()).filter(s=>s.startsWith(MAINNET_SESSION_COOKIE+'='));if(pairs.length!==1)return '';const value=pairs[0]!.slice(MAINNET_SESSION_COOKIE.length+1);return /^[A-Za-z0-9_-]{43}$/.test(value)?value:'';}
export function registerMainnetIdentity(app:FastifyInstance,store:MainnetStagingStore){
 const auth=new MainnetWalletAuth(store.db);
 app.addHook('onRequest',async(req,reply)=>{
  if(!req.url.startsWith('/api/auth/'))return;
  reply.header('Cache-Control','no-store').header('Vary','Origin');
  if(req.headers.origin!==origin)return reply.code(403).send({code:'MAINNET_ORIGIN_REQUIRED',paymentsEnabled:false});
  reply.header('Access-Control-Allow-Origin',origin).header('Access-Control-Allow-Credentials','true');
 });
 app.options('/api/auth/:action',(req,reply)=>{
  const b=z.object({action:z.enum(['nonce','verify','session','logout'])}).safeParse(req.params);
  if(!b.success)return reply.code(404).send({code:'UNKNOWN_AUTH_ACTION'});
  return reply.header('Access-Control-Allow-Methods','GET, POST, OPTIONS').header('Access-Control-Allow-Headers','Content-Type').header('Access-Control-Max-Age','300').code(204).send();
 });
 app.post('/api/auth/nonce',(req,reply)=>{
  const b=z.object({address:z.string().regex(/^0x[a-fA-F0-9]{40}$/)}).strict().safeParse(req.body);
  if(!b.success)return reply.code(422).send({code:'INVALID_AUTH_INPUT'});
  try{return auth.issue(b.data.address,origin);}catch{return reply.code(429).send({code:'AUTH_CHALLENGE_UNAVAILABLE'});}
 });
 app.post('/api/auth/verify',async(req,reply)=>{
  const b=z.object({address:z.string(),nonce:z.string(),signature:z.string()}).strict().safeParse(req.body);
  if(!b.success)return reply.code(422).send({code:'INVALID_AUTH_INPUT'});
  try{
   const s=await auth.verify({...b.data,origin});
   reply.header('Set-Cookie',`${MAINNET_SESSION_COOKIE}=${s.token}; Path=/; Max-Age=900; HttpOnly; Secure; SameSite=Strict`);
   return {authenticated:true,address:s.address,expiresAt:s.expiresAt,chainId:5042,paymentsEnabled:false};
  }catch{return reply.code(401).send({code:'MAINNET_AUTH_REJECTED',paymentsEnabled:false});}
 });
 app.get('/api/auth/session',(req)=>{
  try{return {signInAvailable:true,authenticated:true,address:auth.actor(token(req),origin),chainId:5042,paymentsEnabled:false};}
  catch{return {signInAvailable:true,authenticated:false,chainId:5042,paymentsEnabled:false};}
 });
 app.post('/api/auth/logout',(req,reply)=>{
  auth.revoke(token(req));reply.header('Set-Cookie',`${MAINNET_SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`);
  return {authenticated:false,paymentsEnabled:false};
 });
}
