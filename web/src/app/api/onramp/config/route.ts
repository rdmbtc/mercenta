import {NextResponse} from 'next/server';
import {publicOnrampConfig} from '@/lib/onramp-config';
export const dynamic='force-dynamic';
export function GET(req:Request){return NextResponse.json(publicOnrampConfig(new URL(req.url).origin),{headers:{'Cache-Control':'no-store'}});}
