import {proxyBackend} from '@/lib/backend-proxy';
export const runtime='nodejs';export const dynamic='force-dynamic';
async function handle(req:Request,ctx:{params:Promise<{path:string[]}>}){return proxyBackend(req,(await ctx.params).path.join('/'))}
export {handle as GET,handle as POST};
