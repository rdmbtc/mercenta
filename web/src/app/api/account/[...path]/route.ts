import {proxyBackend} from '@/lib/backend-proxy';
export const dynamic='force-dynamic';
type Context={params:Promise<{path:string[]}>};
async function handle(req:Request,ctx:Context){const {path}=await ctx.params;return proxyBackend(req,'account/'+path.join('/'));}
export {handle as GET,handle as POST};
