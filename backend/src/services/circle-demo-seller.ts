import { createHash } from 'node:crypto';
import { z } from 'zod';
import { recoverTypedDataAddress, type Address, type Hex } from 'viem';
import { BatchFacilitatorClient } from '@circle-fin/x402-batching/server';
import type { DB } from '../db.js';
import { CHAIN, NETWORK, GATEWAY_API, matchTransfer, type AgentConfig } from './circle-policy.js';
import { boundedHttps } from './circle-http.js';
import { profitQuote } from './profit.js';

export const DEMO_SERVICE_ID = 'mercenta-margin-report';
export const DEMO_SERVICE_URL = 'https://api.mercenta.xyz/api/x402/margin-report';
export const DEMO_AMOUNT = '1000'; // 0.001 test USDC. Never a mainnet service.
export const AUTH_TYPES = { TransferWithAuthorization: [
  {name:'from',type:'address'}, {name:'to',type:'address'}, {name:'value',type:'uint256'},
  {name:'validAfter',type:'uint256'}, {name:'validBefore',type:'uint256'}, {name:'nonce',type:'bytes32'},
] } as const;
const address = z.string().regex(/^0x[a-fA-F0-9]{40}$/).transform(v=>v.toLowerCase());
const uint = z.string().regex(/^(0|[1-9]\d{0,19})$/);
const paymentSchema = z.object({
  x402Version:z.literal(2),
  accepted:z.object({scheme:z.literal('exact'),network:z.literal(NETWORK),asset:address,amount:z.literal(DEMO_AMOUNT),payTo:address,maxTimeoutSeconds:z.literal(604900),extra:z.object({name:z.literal('GatewayWalletBatched'),version:z.literal('1'),verifyingContract:address}).strict()}).strict(),
  resource:z.object({url:z.literal(DEMO_SERVICE_URL),description:z.string().max(1000).optional(),mimeType:z.string().max(100).optional()}).strict(),
  payload:z.object({signature:z.string().regex(/^0x[a-fA-F0-9]{130}$/),authorization:z.object({from:address,to:address,value:z.literal(DEMO_AMOUNT),validAfter:uint,validBefore:uint,nonce:z.string().regex(/^0x[a-fA-F0-9]{64}$/).transform(v=>v.toLowerCase())}).strict()}).strict(),
}).strict();
type Payment = z.infer<typeof paymentSchema>;
type SellerRow = {nonce:string;payer:string;digest:string;state:string;response:string;acceptance_id:string|null;created_at:number};
export type SellerPorts = {
  settle:(payment:Payment,requirements:ReturnType<typeof sellerRequirements>)=>Promise<unknown>;
  lookup:(nonce:string)=>Promise<unknown[]>;
  writable:()=>boolean;
};
export function sellerRequirements(recipient:string) {
  return {scheme:'exact',network:NETWORK,asset:CHAIN.usdc.toLowerCase(),amount:DEMO_AMOUNT,payTo:recipient.toLowerCase(),maxTimeoutSeconds:604900,extra:{name:'GatewayWalletBatched',version:'1',verifyingContract:CHAIN.gatewayWallet.toLowerCase()}};
}
export function sellerPorts(writable:()=>boolean):SellerPorts {
  const client = new BatchFacilitatorClient({url:'https://gateway-api-testnet.circle.com'});
  return {writable,settle:(p,r)=>client.settle({...p,resource:{...p.resource,description:p.resource.description??'Mercenta-owned test scenario report',mimeType:p.resource.mimeType??'application/json'}},r),lookup:async nonce=>{
    const result=await boundedHttps(`${GATEWAY_API}/x402/transfers?nonce=${encodeURIComponent(nonce)}&network=${encodeURIComponent(NETWORK)}&pageSize=100`);
    if(result.status!==200)throw Error('STATUS_UNAVAILABLE');
    const body=z.object({transfers:z.array(z.unknown()).max(1)}).parse(JSON.parse(result.body));return body.transfers;
  }};
}
export class CircleDemoSeller {
  constructor(private db:DB,private recipient:string,private config:()=>AgentConfig|null,private ports:SellerPorts) {
    db.exec(`CREATE TABLE IF NOT EXISTS circle_demo_seller_receipts(nonce TEXT PRIMARY KEY,payer TEXT NOT NULL,digest TEXT NOT NULL,state TEXT NOT NULL,response TEXT NOT NULL,acceptance_id TEXT,created_at INTEGER NOT NULL);`);
  }
  challenge(){const required={x402Version:2,resource:{url:DEMO_SERVICE_URL,description:'Mercenta-owned testnet margin scenario report; not an external supplier or customer sale.',mimeType:'application/json'},accepts:[sellerRequirements(this.recipient)]};return {status:402,headers:{'PAYMENT-REQUIRED':Buffer.from(JSON.stringify(required)).toString('base64')},body:{error:'PAYMENT_REQUIRED',priceTestUsdc:'0.001000',service:DEMO_SERVICE_ID,selfHostedDemo:true}};}
  private enabled(payer:string){const c=this.config(),s=c?.services.find(s=>s.id===DEMO_SERVICE_ID);return !!c?.enabled&&c.walletAddress===payer&&s?.url===DEMO_SERVICE_URL&&s.payTo===this.recipient.toLowerCase()&&s.maxAmountUnits===DEMO_AMOUNT;}
  async handle(header?:string,cachedOnly=false){
    if(!header)return this.challenge();
    if(header.length>16000||!/^[A-Za-z0-9+/=_-]+$/.test(header))return this.error(400,'INVALID_PAYMENT');
    let p:Payment;
    try {p=paymentSchema.parse(JSON.parse(Buffer.from(header,'base64').toString('utf8')));}catch{return this.error(400,'INVALID_PAYMENT');}
    const auth=p.payload.authorization;
    if(!this.enabled(auth.from))return this.error(503,'DEMO_SERVICE_NOT_ENABLED');
    const expected=sellerRequirements(this.recipient);
    if(p.accepted.asset!==expected.asset||p.accepted.payTo!==expected.payTo||p.accepted.extra.verifyingContract!==expected.extra.verifyingContract||auth.to!==expected.payTo||auth.from===auth.to)return this.error(400,'PAYMENT_SCOPE_MISMATCH');
    try {
      const signer=await recoverTypedDataAddress({domain:{name:'GatewayWalletBatched',version:'1',chainId:5042002,verifyingContract:CHAIN.gatewayWallet as Address},types:AUTH_TYPES,primaryType:'TransferWithAuthorization',message:{from:auth.from as Address,to:auth.to as Address,value:BigInt(auth.value),validAfter:BigInt(auth.validAfter),validBefore:BigInt(auth.validBefore),nonce:auth.nonce as Hex},signature:p.payload.signature as Hex});
      if(signer.toLowerCase()!==auth.from)throw Error();
    }catch{return this.error(400,'INVALID_SIGNATURE');}
    if(!this.enabled(auth.from))return this.error(503,'DEMO_SERVICE_NOT_ENABLED');
    const digest=createHash('sha256').update(JSON.stringify({signature:p.payload.signature.toLowerCase(),authorization:auth,requirements:expected,url:DEMO_SERVICE_URL})).digest('hex');
    let previous=this.db.prepare('SELECT * FROM circle_demo_seller_receipts WHERE nonce=?').get(auth.nonce) as SellerRow|undefined;
    if(previous){
      if(previous.digest!==digest||previous.payer!==auth.from)return this.error(409,'NONCE_CONFLICT');
      if(previous.state==='ACCEPTED')return this.deliver(previous);
      if(previous.state==='REJECTED')return this.error(402,'PAYMENT_REJECTED');
      // An uncertain or interrupted request is ONLY reconciled, never settled again.
      if(!this.ports.writable())return this.error(503,'READ_ONLY_MODE');
      try {const matches=await this.ports.lookup(auth.nonce);if(matches.length!==1)return this.error(503,'PAYMENT_RECONCILIATION_PENDING');
        const t=matchTransfer(matches[0],{nonce:auth.nonce,from:auth.from,to:this.recipient,amount:DEMO_AMOUNT});
        if(t.status==='failed'){this.db.prepare("UPDATE circle_demo_seller_receipts SET state='REJECTED' WHERE nonce=?").run(auth.nonce);return this.error(402,'PAYMENT_REJECTED');}
        this.db.prepare("UPDATE circle_demo_seller_receipts SET state='ACCEPTED',acceptance_id=? WHERE nonce=? AND state IN('SUBMITTING','UNKNOWN')").run(t.id,auth.nonce);
        previous=this.db.prepare('SELECT * FROM circle_demo_seller_receipts WHERE nonce=?').get(auth.nonce) as SellerRow;return this.deliver(previous);
      }catch{return this.error(503,'PAYMENT_RECONCILIATION_PENDING');}
    }
    if(cachedOnly)return this.error(409,'ORIGINAL_RECEIPT_NOT_FOUND');
    if(!this.ports.writable())return this.error(503,'READ_ONLY_MODE');
    const now=Math.floor(Date.now()/1000);
    if(BigInt(auth.validAfter)>BigInt(now)||BigInt(auth.validBefore)<BigInt(now+604800)||BigInt(auth.validBefore)>BigInt(now+604960))return this.error(400,'INVALID_AUTHORIZATION_WINDOW');
    const quote=profitQuote({gross:'2',cogs:'1.532',fees:'0.006',taps:[1000,2500,2500,4000],minMarginBps:500});
    const response=JSON.stringify({schemaVersion:1,service:DEMO_SERVICE_ID,selfHostedDemo:true,source:'fixed-declared-test-scenario',authorizationNonce:auth.nonce,serviceCostUnits:DEMO_AMOUNT,scenario:{product:'Creator credits — simulated test top-up',grossUsdc:'2.000000',cogsUsdc:'1.532000',otherAssumedFeesUsdc:'0.005000',paidReportFeeUsdc:'0.001000'},quote,verifiedBusinessSale:false,statement:'A paid scenario calculation is not a supplier purchase, external customer revenue, an investment return or tax advice.'});
    const inserted=this.db.prepare("INSERT OR IGNORE INTO circle_demo_seller_receipts(nonce,payer,digest,state,response,created_at) VALUES(?,?,?,'SUBMITTING',?,?)").run(auth.nonce,auth.from,digest,response,Date.now());
    if(!inserted.changes)return this.error(503,'PAYMENT_RECONCILIATION_PENDING');
    // Durable nonce reservation BEFORE contacting Gateway. No private signature is stored.
    let timer:ReturnType<typeof setTimeout>|undefined;
    try {
      const raw=await Promise.race([this.ports.settle(p,expected),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('TIMEOUT')),10000)})]);
      const result=z.object({success:z.boolean(),network:z.literal(NETWORK),transaction:z.string(),payer:address.optional(),errorReason:z.string().optional()}).parse(raw);
      if(!result.success){
        // nonce_already_used / infrastructure failures are not proof of nonpayment.
        this.db.prepare("UPDATE circle_demo_seller_receipts SET state='UNKNOWN' WHERE nonce=?").run(auth.nonce);
        return this.error(503,'PAYMENT_RECONCILIATION_PENDING');
      }
      if(result.payer!==auth.from||!z.string().uuid().safeParse(result.transaction).success)throw Error('ATTRIBUTION_MISMATCH');
      this.db.prepare("UPDATE circle_demo_seller_receipts SET state='ACCEPTED',acceptance_id=? WHERE nonce=? AND state='SUBMITTING'").run(result.transaction,auth.nonce);
      return this.deliver(this.db.prepare('SELECT * FROM circle_demo_seller_receipts WHERE nonce=?').get(auth.nonce) as SellerRow);
    }catch{this.db.prepare("UPDATE circle_demo_seller_receipts SET state='UNKNOWN' WHERE nonce=? AND state='SUBMITTING'").run(auth.nonce);return this.error(503,'PAYMENT_RECONCILIATION_PENDING');}
    finally{if(timer)clearTimeout(timer);}
  }
  private deliver(r:SellerRow){return {status:200,headers:{'PAYMENT-RESPONSE':Buffer.from(JSON.stringify({success:true,network:NETWORK,payer:r.payer,transaction:r.acceptance_id})).toString('base64')},body:{...JSON.parse(r.response),receipt:{gatewayAcceptanceId:r.acceptance_id,state:'gateway-accepted-not-proof-of-final-onchain-settlement'}}};}
  private error(status:number,error:string){return {status,headers:{} as Record<string,string>,body:{error}};}
}
