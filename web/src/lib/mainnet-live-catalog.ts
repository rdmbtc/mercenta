import {refreshPublicCatalog,unpackBrowse,loadPublicProduct} from './public-catalog-client';
import {mainnetAmountUnits,mainnetAmountDisplay,type MainnetOrder} from './mainnet-orders';
import type {QuickSelectProduct} from './mainnet-quick-select';
export const normalizedRegion=(r:string)=>['GLOB','GLOBAL','WW'].includes(r.toUpperCase())?'GLOBAL':r.toUpperCase();
/** Public read-only sourcing. Never substitutes demonstration SKUs for missing live data. */
export async function sourceLiveMainnetProducts(goal:string,budget:string,region:string):Promise<QuickSelectProduct[]>{
 const cap=BigInt(mainnetAmountUnits(budget));
 const terms=goal.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(t=>t.length>2&&!['find','buy','under','usdc','please','for','the','gift','card','cards','code','codes','voucher','vouchers','region','найди','найти','купить','для','региона','регион','подарочная','карта','мне'].includes(t));
 if(!terms.length)throw Error('ENTER_PRODUCT');
 const catalog=unpackBrowse(await refreshPublicCatalog());
 const age=Date.now()-Date.parse(catalog.generatedAt);
 if(!catalog.live||catalog.snapshot||!Number.isFinite(age)||age>300000||age< -60000)throw Error('CATALOG_NOT_CURRENT');
 const place=region.toUpperCase();
 const candidates=catalog.products.filter(p=>p.inStock>0&&p.currency==='USD'&&(!place||place==='ANY'||normalizedRegion(p.countryCode??'')===place||normalizedRegion(p.countryCode??'')==='GLOBAL')&&terms.some(t=>[p.name,p.brand,p.searchText].join(' ').toLowerCase().split(/[^\p{L}\p{N}]+/u).includes(t))).sort((a,b)=>a.minPrice-b.minPrice||a.name.localeCompare(b.name)).slice(0,8);
 let successes=0;
 const details=await Promise.all(candidates.map(async p=>{try{const product=await loadPublicProduct(p.id);successes++;return product;}catch{return null;}}));
 if(candidates.length&&!successes)throw Error('DETAIL_UNAVAILABLE');
 const rows:QuickSelectProduct[]=[];
 for(const p of details){if(!p)continue;for(const d of p.denominations){
  if(!d.available||d.isLongOrder||d.currency!=='USD'||(d.stock!==undefined&&d.stock<1)||!/^[-a-zA-Z0-9]{1,200}$/.test(d.id)||d.id.startsWith('mainnet:'))continue;
  try{const units=mainnetAmountUnits(String(d.price));if(BigInt(units)>cap)continue;rows.push({id:d.id,denomination_id:d.id,name:d.id==='7295df4e-6fb0-4dfb-b962-ded3d073bc03'?p.name+' · 50 Stars':p.name.includes(d.name)?p.name:p.name+' · '+d.name,category:p.category,country:normalizedRegion(p.countryCode??'GLOBAL'),price:mainnetAmountDisplay(units),kind:p.type==='direct_topup'?'Direct Top-Up':'Shop'});}catch{/* invalid price is not purchasable */}
 }}
 return rows.sort((a,b)=>{const x=BigInt(mainnetAmountUnits(a.price)),y=BigInt(mainnetAmountUnits(b.price));return x<y?-1:x>y?1:a.name.localeCompare(b.name);}).slice(0,6);
}
export function filterMainnetHistory(orders:MainnetOrder[],filters:{period:string;from?:string;to?:string;status?:string;product?:string;country?:string;initiator?:string},now=Date.now()){
 let since=0,until=now;
 const days:Record<string,number>={'24h':1,'7d':7,'30d':30,'90d':90};
 if(filters.period in days)since=now-days[filters.period]*86400000;
 else if(filters.period==='custom'){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(filters.from??'')||!/^\d{4}-\d{2}-\d{2}$/.test(filters.to??''))return [];
  since=Date.parse(filters.from+'T00:00:00Z');until=Date.parse(filters.to+'T00:00:00Z')+86400000-1;
  if(!Number.isFinite(since)||!Number.isFinite(until)||since>until)return [];
 }
 return orders.filter(o=>o.created_at>=since&&o.created_at<=until&&(!filters.status||o.status===filters.status)&&(!filters.product||[o.product_id,o.name].join(' ').toLowerCase().includes(filters.product.toLowerCase()))&&(!filters.country||normalizedRegion(o.country)===normalizedRegion(filters.country))&&(!filters.initiator||[o.initiator,o.initiator_address].join(' ').toLowerCase().includes(filters.initiator.toLowerCase())));
}
