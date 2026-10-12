import {retailResponse,retailWallet,retailKey,retailUpstream,sameOrigin,smallJson,fulfillSchema,readQuote} from '@/lib/mainnet-retail';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(req:Request){
 if(!sameOrigin(req))return retailResponse({error:'ORIGIN_NOT_ALLOWED'},403);
 const wallet=retailWallet(req);if(!wallet)return retailResponse({error:'SIGN_IN_REQUIRED'},401);
 const key=retailKey();if(!key)return retailResponse({error:'RETAIL_NOT_CONFIGURED'},503);
 let data;try{data=fulfillSchema.parse(await smallJson(req));}catch{return retailResponse({error:'INVALID_REQUEST'},400);}
 if(data.wallet.toLowerCase()!==wallet)return retailResponse({error:'WALLET_MISMATCH'},403);
 const q=readQuote(data.quote,key);
 if(!q||q.wallet!==wallet||q.denominationId!==data.denominationId||q.quantity!==data.quantity||q.accountReference!==data.accountReference)return retailResponse({error:'INVALID_OR_EXPIRED_QUOTE'},409);
 return retailUpstream('fulfill',wallet,key,{txHash:data.txHash,wallet,denominationId:q.denominationId,quantity:q.quantity,productName:q.productName,optionName:q.optionName,productType:q.productType,accountReference:q.accountReference,expectedAmountUnits:q.amountUnits});
}
