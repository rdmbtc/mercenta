import type {Catalog} from './supplier';import {retailPrice,RETAIL_PRICE_POLICY} from './retail-pricing';
/** Legacy saved costs get one retail adjustment. Already tagged retail snapshots never compound. */
export function retailCatalog(c:Catalog):Catalog{if(c.pricingPolicy===RETAIL_PRICE_POLICY)return c;return {...c,pricingPolicy:RETAIL_PRICE_POLICY,products:c.products.map(p=>({...p,minPrice:retailPrice(p.minPrice),maxPrice:retailPrice(p.maxPrice),denominations:p.denominations.map(d=>({...d,price:retailPrice(d.price)}))}))};}
