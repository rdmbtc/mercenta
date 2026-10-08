import {getCatalog} from '@/lib/supplier';
import {packBrowse} from '@/lib/catalog-browse';
import {browseBootstrap,snapshotProduct} from '@/lib/catalog-bootstrap';
import {gzipSync} from 'node:zlib';
export const runtime='nodejs';
export const dynamic='force-dynamic';
// Public browse data only; never reuse these cache headers for private/financial APIs.
export async function GET(request:Request){
 const params=new URL(request.url).searchParams,id=params.get('id');
 if(id&&id.length>200)return Response.json({error:'PRODUCT_NOT_FOUND'},{status:404,headers:{'Cache-Control':'no-store'}});
 const catalog=await getCatalog();
 const product=id?(catalog.live?catalog.products.find(p=>p.id===id):snapshotProduct(id)):undefined;
 if(id&&!product)return Response.json({error:'PRODUCT_NOT_FOUND'},{status:404,headers:{'Cache-Control':'no-store'}});
 const payload=id?{product,generatedAt:catalog.live?catalog.generatedAt:browseBootstrap.generatedAt,snapshot:!catalog.live,purchasingEnabled:false}:params.get('view')==='browse'?packBrowse(catalog):catalog;
 const json=JSON.stringify(payload),compressed=/\bgzip\b/.test(request.headers.get('accept-encoding')??'');
 const headers:Record<string,string>={'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=30, s-maxage=30, must-revalidate','Vary':'Accept-Encoding'};
 if(compressed)headers['Content-Encoding']='gzip';
 return new Response(compressed?new Uint8Array(gzipSync(json)):json,{headers});
}
