import {NextResponse} from 'next/server';import {networkFromHost} from '@/lib/network-profile';import {MAINNET_PREPARATION} from '@/lib/mainnet-preparation';
export const dynamic='force-dynamic';
export function GET(req:Request){if(networkFromHost(new URL(req.url).hostname)!=='mainnet')return NextResponse.json({code:'MAINNET_HOST_REQUIRED'},{status:404,headers:{'Cache-Control':'no-store'}});return NextResponse.json(MAINNET_PREPARATION,{headers:{'Cache-Control':'no-store','X-Mercenta-Network':'mainnet'}});}
