import 'server-only';
import snapshot from '@/lib/catalog-public-snapshot.json';
import {artworkFirst,diversify,type Catalog} from './supplier';
import {packBrowse} from './catalog-browse';
// Public browse data only. Never a quote, account balance or purchase authority.
const catalog={...snapshot,products:artworkFirst(diversify((snapshot as Catalog).products)),live:false,snapshot:true,purchasingEnabled:false} as Catalog;
export const browseBootstrap=packBrowse(catalog);
export function snapshotProduct(id:string){return catalog.products.find(p=>p.id===id)}
