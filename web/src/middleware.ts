import {NextResponse,type NextRequest} from 'next/server';
import {networkFromHost,allowedMainnetApi,MAINNET_CLOSED} from '@/lib/network-profile';
export function middleware(req:NextRequest){
 const network=networkFromHost(req.nextUrl.hostname),headers=new Headers(req.headers);headers.set('x-mercenta-network',network);
 if(network==='testnet'&&req.nextUrl.hostname==='testnet.mercenta.xyz'&&req.nextUrl.pathname==='/'){const url=req.nextUrl.clone();url.pathname='/app';url.search='';return NextResponse.rewrite(url,{request:{headers}})}
 if(network==='mainnet'){
  if(req.nextUrl.pathname.startsWith('/api/')&&!allowedMainnetApi(req.nextUrl.pathname,req.method))return NextResponse.json(MAINNET_CLOSED,{status:503,headers:{'Cache-Control':'no-store','X-Mercenta-Network':'mainnet'}});
  if(!req.nextUrl.pathname.startsWith('/api/')&&!req.nextUrl.pathname.startsWith('/api-docs')&&req.nextUrl.pathname!=='/app'){
   const url=req.nextUrl.clone();const view=req.nextUrl.pathname.startsWith('/catalog')?'shop':req.nextUrl.pathname.startsWith('/agent')?'agent-chat':req.nextUrl.pathname.startsWith('/status')?'launch':'dashboard';url.pathname='/app';url.search='';url.searchParams.set('section',view);return NextResponse.rewrite(url,{request:{headers}});
  }
 }
 return NextResponse.next({request:{headers}});
}
export const config={matcher:['/','/app/:path*','/agent/:path*','/catalog/:path*','/demo/:path*','/status/:path*','/api/:path*','/api-docs/:path*']};
