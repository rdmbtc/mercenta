import type {FastifyInstance,FastifyRequest} from 'fastify';
import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {verifyMessage} from 'viem';
import {z} from 'zod';
import type {DB} from '../db.js';import type {Config} from '../config.js';
function trusted(req:FastifyRequest,c:Config){const a=req.headers['x-mercenta-actor'],ts=req.headers['x-mercenta-timestamp'],s=req.headers['x-mercenta-signature'];if(typeof a!=='string'||! /^(wallet:0x[a-f0-9]{40}|session:[a-f0-9-]{36})$/.test(a)||typeof ts!=='string'||!/^\d{13}$/.test(ts)||Math.abs(Date.now()-Number(ts))>30000||typeof s!=='string')throw new Error('UNAUTHORIZED');const x=Buffer.from(s),y=Buffer.from(createHmac('sha256',c.BACKEND_PROXY_SECRET).update(`${ts}\n${req.method}\n${req.url}\n${a}\n${req.body?JSON.stringify(req.body):''}`).digest('hex'));if(x.length!==y.length||!timingSafeEqual(x,y))throw new Error('UNAUTHORIZED');}
export function authMessage(address:string,nonce:string,issuedAt:number){return `Mercenta wants you to sign in.\n\nAddress: ${address.toLowerCase()}\nNonce: ${nonce}\nIssued: ${new Date(issuedAt).toISOString()}\n\nSigning proves wallet ownership. It does NOT authorize any payment or transfer.`;}
export function initChallenges(db:DB){db.exec('CREATE TABLE IF NOT EXISTS wallet_challenges(nonce TEXT PRIMARY KEY,address TEXT NOT NULL,origin TEXT NOT NULL,created INTEGER NOT NULL,expires INTEGER NOT NULL,consumed INTEGER NOT NULL DEFAULT 0)');}
export function issueChallenge(db:DB,address:string,origin:string,now=Date.now()){db.prepare('DELETE FROM wallet_challenges WHERE expires<?').run(now);const nonce=randomBytes(32).toString('hex'),expiresAtMs=now+600000;db.prepare('INSERT INTO wallet_challenges(nonce,address,origin,created,expires) VALUES(?,?,?,?,?)').run(nonce,address.toLowerCase(),origin,now,expiresAtMs);return {nonce,address:address.toLowerCase(),message:null,expiresAtMs};}
export async function verifyChallenge(db:DB,b:{address:string;nonce:string;frontendOrigin:string;signature:`0x${string}`;issuedAt:number},now=Date.now()){
 const r=db.prepare('SELECT * FROM wallet_challenges WHERE nonce=?').get(b.nonce) as {address:string;origin:string;created:number;expires:number;consumed:number}|undefined;
 if(!r||r.consumed||r.expires<=now||r.address!==b.address.toLowerCase()||r.origin!==b.frontendOrigin||b.issuedAt<r.created-30000||b.issuedAt>now+30000||now-b.issuedAt>600000)throw new Error('UNAUTHORIZED');
 let valid=false;try{valid=await verifyMessage({address:b.address as `0x${string}`,message:authMessage(b.address,b.nonce,b.issuedAt),signature:b.signature})}catch{/* malformed proof */}
 if(!valid)throw new Error('UNAUTHORIZED');const consumed=db.prepare('UPDATE wallet_challenges SET consumed=1 WHERE nonce=? AND consumed=0 AND expires>?').run(b.nonce,now);if(consumed.changes!==1)throw new Error('UNAUTHORIZED');return {ok:true,address:r.address};
}
export function registerAuthRoutes(app:FastifyInstance,db:DB,c:Config){initChallenges(db);const address=z.string().regex(/^0x[a-fA-F0-9]{40}$/),frontendOrigin=z.string().url().max(300).refine(x=>new URL(x).origin===x&&(/^https:\/\//.test(x)||/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(x)));
 app.post('/api/auth/nonce',req=>{trusted(req,c);const b=z.object({address,frontendOrigin}).parse(req.body);return issueChallenge(db,b.address,b.frontendOrigin)});
 app.post('/api/auth/verify',async req=>{trusted(req,c);const b=z.object({address,frontendOrigin,nonce:z.string().regex(/^[a-f0-9]{64}$/),issuedAt:z.number().int().safe(),signature:z.string().regex(/^0x[a-fA-F0-9]{130}$/)}).parse(req.body);return verifyChallenge(db,{...b,signature:b.signature as `0x${string}`})});
}
