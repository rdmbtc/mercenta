import {retailResponse,retailWallet,retailKey,retailUpstream} from '@/lib/mainnet-retail';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(req:Request){const wallet=retailWallet(req);if(!wallet)return retailResponse({error:'SIGN_IN_REQUIRED'},401);const selected=new URL(req.url).searchParams.get('wallet');if(selected&&selected.toLowerCase()!==wallet)return retailResponse({error:'WALLET_MISMATCH'},403);const key=retailKey();if(!key)return retailResponse({error:'RETAIL_NOT_CONFIGURED'},503);return retailUpstream('orders?wallet='+encodeURIComponent(wallet),wallet,key);}
