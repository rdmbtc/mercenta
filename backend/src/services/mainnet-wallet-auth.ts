/** Independent Mainnet identity. A sign-in proof grants no spending permission. */
import type Database from 'better-sqlite3';
import {createHash,randomBytes} from 'node:crypto';
import {verifyMessage} from 'viem';
import {z} from 'zod';
const address=z.string().regex(/^0x[a-fA-F0-9]{40}$/).refine(a=>!/^0x0{40}$/i.test(a));
const originSchema=z.literal('https://mainnet.mercenta.xyz');
const tokenHash=(s:string)=>createHash('sha256').update(s).digest('hex');
export const MAINNET_SESSION_COOKIE='__Host-mercenta-mainnet-session';
export const MAINNET_COOKIE_OPTIONS={secure:true,httpOnly:true,sameSite:'strict' as const,path:'/',maxAge:900};
type Challenge={nonce:string;address:string;origin:string;message:string;expires:number;consumed:number};
export class MainnetWalletAuth {
 constructor(private readonly db:Database.Database){
  try{const pin=db.prepare("SELECT value FROM staging_metadata WHERE key='network'").get() as {value:string}|undefined;if(pin?.value!=='arc-mainnet:5042:staging-v1')throw Error('pin');}catch{throw Error('MAINNET_SESSION_NAMESPACE_REQUIRED');}
  db.exec(`
  CREATE TABLE IF NOT EXISTS staging_auth_challenges(nonce TEXT PRIMARY KEY,address TEXT NOT NULL,origin TEXT NOT NULL,message TEXT NOT NULL,expires INTEGER NOT NULL,consumed INTEGER NOT NULL DEFAULT 0);
  CREATE TABLE IF NOT EXISTS staging_auth_sessions(token_hash TEXT PRIMARY KEY,address TEXT NOT NULL,created INTEGER NOT NULL,expires INTEGER NOT NULL,revoked INTEGER NOT NULL DEFAULT 0);
 `);}
 issue(rawAddress:unknown,rawOrigin:unknown,now=Date.now()){
  const wallet=address.parse(rawAddress).toLowerCase(),origin=originSchema.parse(rawOrigin),nonce=randomBytes(32).toString('hex'),expiresAt=now+300000;
  const message=`mainnet.mercenta.xyz wants you to sign in to Mercenta Mainnet.\n\nWallet: ${wallet}\nURI: ${origin}\nChain ID: 5042\nNonce: ${nonce}\nIssued At: ${new Date(now).toISOString()}\nExpiration: ${new Date(expiresAt).toISOString()}\n\nIdentity only. This signature does not authorize payments, purchases, deposits or refunds.`;
  this.db.transaction(()=>{
   this.db.prepare('DELETE FROM staging_auth_challenges WHERE expires<?').run(now);
   this.db.prepare('DELETE FROM staging_auth_sessions WHERE expires<? OR revoked=1').run(now);
   const count=(this.db.prepare('SELECT COUNT(*) AS n FROM staging_auth_challenges WHERE address=? AND expires>? AND consumed=0').get(wallet,now) as {n:number}).n;
   if(count>=3)throw Error('AUTH_CHALLENGE_RATE_LIMIT');
   this.db.prepare('INSERT INTO staging_auth_challenges(nonce,address,origin,message,expires) VALUES(?,?,?,?,?)').run(nonce,wallet,origin,message,expiresAt);
  }).immediate();
  return {nonce,message,expiresAt,chainId:5042,paymentsAuthorized:false};
 }
 async verify(raw:unknown,now=Date.now()){
  const b=z.object({address,origin:originSchema,nonce:z.string().regex(/^[a-f0-9]{64}$/),signature:z.string().regex(/^0x[a-fA-F0-9]{130}$/)}).strict().parse(raw);
  const row=this.db.prepare('SELECT * FROM staging_auth_challenges WHERE nonce=?').get(b.nonce) as Challenge|undefined;
  if(!row||row.consumed||row.expires<=now||row.address!==b.address.toLowerCase()||row.origin!==b.origin)throw Error('MAINNET_AUTH_REJECTED');
  let valid=false;try{valid=await verifyMessage({address:row.address as `0x${string}`,message:row.message,signature:b.signature as `0x${string}`});}catch{}
  if(!valid)throw Error('MAINNET_AUTH_REJECTED');
  return this.db.transaction(()=>{
   const consumed=this.db.prepare('UPDATE staging_auth_challenges SET consumed=1 WHERE nonce=? AND consumed=0 AND expires>?').run(b.nonce,now);
   if(consumed.changes!==1)throw Error('MAINNET_AUTH_REJECTED');
   const token=randomBytes(32).toString('base64url'),expiresAt=now+900000;
   this.db.prepare('INSERT INTO staging_auth_sessions VALUES(?,?,?,?,0)').run(tokenHash(token),row.address,now,expiresAt);
   return {token,address:row.address,expiresAt,chainId:5042,paymentsAuthorized:false,cookie:MAINNET_SESSION_COOKIE};
  }).immediate();
 }
 actor(token:string,origin:string,now=Date.now()){
  originSchema.parse(origin);if(!/^[A-Za-z0-9_-]{43}$/.test(token))throw Error('MAINNET_SESSION_REJECTED');
  const row=this.db.prepare('SELECT address FROM staging_auth_sessions WHERE token_hash=? AND expires>? AND revoked=0').get(tokenHash(token),now) as {address:string}|undefined;
  if(!row)throw Error('MAINNET_SESSION_REJECTED');return row.address;
 }
 revoke(token:string){this.db.prepare('UPDATE staging_auth_sessions SET revoked=1 WHERE token_hash=?').run(tokenHash(token));}
}
