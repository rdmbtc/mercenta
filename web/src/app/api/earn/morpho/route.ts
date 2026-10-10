import {NextResponse} from 'next/server';
import {readMorphoMarket} from '@/lib/morpho-market-server';
export const dynamic='force-dynamic';export const runtime='nodejs';export const maxDuration=30;
export async function GET(req:Request){if(new URL(req.url).search)return NextResponse.json({code:'EARN_QUERY_NOT_SUPPORTED'},{status:400});return NextResponse.json(await readMorphoMarket(),{headers:{'Cache-Control':'no-store','X-Mercenta-Earn-Mode':'external-read-only'}});}
