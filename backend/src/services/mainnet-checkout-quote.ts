/** Typed-data bridge only. No private key, signing, broadcast or public payment route. */
import {z} from 'zod';
import {encodeAbiParameters,keccak256,toBytes,hashTypedData} from 'viem';
import {validateRetailQuote} from './mainnet-retail-policy.js';
export const CHECKOUT_QUOTE_TYPES={Quote:[
 {name:'orderId',type:'bytes32'},{name:'buyer',type:'address'},{name:'skuHash',type:'bytes32'},
 {name:'quantity',type:'uint32'},{name:'unitCostMicro',type:'uint256'},{name:'amountMicro',type:'uint256'},
 {name:'assetKind',type:'uint8'},{name:'validAfter',type:'uint48'},{name:'deadline',type:'uint48'},
 {name:'nonce',type:'uint256'},{name:'signerEpoch',type:'uint256'}
]} as const;
const uint=z.string().regex(/^(0|[1-9]\d{0,77})$/).refine(v=>BigInt(v)<(1n<<256n));
const bindingSchema=z.object({router:z.string().regex(/^0x[0-9a-f]{40}$/i).refine(v=>!/^0x0{40}$/i.test(v)),nonce:uint,signerEpoch:uint.refine(v=>BigInt(v)>0n),assetKind:z.union([z.literal(0),z.literal(1)])}).strict();
/** Binding is read from reviewed deployment metadata and durable server nonce allocation, never caller supplied. */
export function checkoutTypedData(rawQuote:unknown,rawBinding:unknown){
 const q=validateRetailQuote(rawQuote),b=bindingSchema.parse(rawBinding);
 return {domain:{name:'MercentaCheckout',version:'1',chainId:5042,verifyingContract:b.router.toLowerCase() as `0x${string}`},types:CHECKOUT_QUOTE_TYPES,primaryType:'Quote' as const,message:{
  orderId:keccak256(toBytes(q.id.toLowerCase())),buyer:q.owner as `0x${string}`,
  skuHash:keccak256(encodeAbiParameters([{type:'string'},{type:'string'},{type:'string'},{type:'uint32'}],[q.serviceId.toLowerCase(),q.itemId.toLowerCase(),q.region,q.quantity])),
  quantity:q.quantity,unitCostMicro:BigInt(q.unitCostUsdMicro),amountMicro:BigInt(q.saleUsdcMicro),assetKind:b.assetKind,
  validAfter:Math.floor(q.createdAt/1000),deadline:Math.floor(q.expiresAt/1000),nonce:BigInt(b.nonce),signerEpoch:BigInt(b.signerEpoch)
 }};
}
export function checkoutTypedDigest(quote:unknown,binding:unknown){return hashTypedData(checkoutTypedData(quote,binding));}
