import {mainnetRuntimeStatus} from '@/lib/mainnet-status';
export const dynamic='force-dynamic';
export async function GET(){return Response.json(await mainnetRuntimeStatus(),{headers:{'Cache-Control':'no-store'}});}
