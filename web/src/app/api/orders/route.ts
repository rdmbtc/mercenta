import {proxyBackend} from '@/lib/backend-proxy';export const dynamic='force-dynamic';async function handle(req:Request){return proxyBackend(req,'orders')}export {handle as GET,handle as POST};
