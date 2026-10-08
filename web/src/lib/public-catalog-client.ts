import {packBrowse,unpackBrowse,type BrowseCatalog} from './catalog-browse';
import type {Catalog,CatalogProduct} from './supplier';
const TTL=60_000;
let cached:{value:BrowseCatalog;at:number}|undefined,pending:Promise<BrowseCatalog>|undefined;
// Shared public catalogue cache only. No wallet/auth/private account state.
export function refreshPublicCatalog():Promise<BrowseCatalog>{
 if(cached&&Date.now()-cached.at<TTL)return Promise.resolve(cached.value);
 if(pending)return pending;
 pending=fetch('/api/catalog?view=browse',{credentials:'omit',signal:AbortSignal.timeout(10_000)}).then(async r=>{if(!r.ok)throw Error('CATALOG_UNAVAILABLE');const v=await r.json();const data:BrowseCatalog=v.version===1?v:packBrowse(v as Catalog);if(!Array.isArray(data.rows))throw Error('INVALID_CATALOG');if(!data.live)throw Error('CATALOG_NOT_CURRENT');details.clear();cached={value:data,at:Date.now()};return data}).finally(()=>{pending=undefined});
 return pending;
}
const details=new Map<string,{at:number;value:CatalogProduct}>(),detailRequests=new Map<string,Promise<CatalogProduct>>();
export function loadPublicProduct(id:string):Promise<CatalogProduct>{
 const hit=details.get(id);if(hit&&Date.now()-hit.at<TTL)return Promise.resolve(hit.value);
 const request=detailRequests.get(id);if(request)return request;
 const promise=fetch('/api/catalog?id='+encodeURIComponent(id),{credentials:'omit',signal:AbortSignal.timeout(10_000)}).then(async r=>{if(!r.ok)throw Error('DETAIL_UNAVAILABLE');const v=await r.json();if(v.product?.id!==id||!Array.isArray(v.product?.denominations))throw Error('INVALID_DETAIL');details.set(id,{at:Date.now(),value:v.product});if(details.size>100)details.delete(details.keys().next().value!);return v.product as CatalogProduct}).finally(()=>detailRequests.delete(id));
 detailRequests.set(id,promise);return promise;
}
export {unpackBrowse};
