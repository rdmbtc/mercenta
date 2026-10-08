import type {Config} from '../config.js';
import {cachedSupplierPreview} from './supplier-preview.js';
/** Coalesced 60s cache: at most one catalogue request/minute per configuration. */
export function startCatalogStockMonitor(c:Config){
 if(c.NODE_ENV==='test'||!c.SUPPLIER_API_URL||!c.SUPPLIER_API_KEY)return ()=>{};
 const refresh=()=>{void cachedSupplierPreview(c).catch(()=>{});};
 refresh();const timer=setInterval(refresh,65_000);timer.unref();return()=>clearInterval(timer);
}
