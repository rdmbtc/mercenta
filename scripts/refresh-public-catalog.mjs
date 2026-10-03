// Operator utility: read public browse data only. No keys, orders or invoices.
import {writeFileSync,renameSync} from 'node:fs';
const url=process.argv[2]??'https://app.mercenta.xyz/api/catalog';
const parsed=new URL(url);
if(parsed.protocol!=='https:'||!['app.mercenta.xyz'].includes(parsed.hostname))throw Error('Use the public Mercenta catalogue endpoint');
const response=await fetch(url,{credentials:'omit',signal:AbortSignal.timeout(15000)});
if(!response.ok)throw Error('Catalogue request failed');
const catalog=await response.json();
if(!catalog.live||!Array.isArray(catalog.products)||!catalog.products.length||!Number.isFinite(Date.parse(catalog.generatedAt)))throw Error('Refuse to publish unverified/examples-only data');
const productKeys=['id','name','brand','imageUrl','imageSource','category','type','countryCode','denominations','minPrice','maxPrice','currency','inStock','totalStock'];
const optionKeys=['id','name','price','currency','available','stock','isLongOrder'];
const select=(value,keys)=>Object.fromEntries(keys.filter(k=>value[k]!==undefined).map(k=>[k,value[k]]));
const products=catalog.products.map(p=>{if(typeof p.id!=='string'||typeof p.name!=='string'||!Array.isArray(p.denominations))throw Error('Invalid public product');return {...select(p,productKeys),denominations:p.denominations.map(d=>select(d,optionKeys))}});
const snapshot={products,live:false,snapshot:true,generatedAt:catalog.generatedAt,sourceStatus:'verified-browse-snapshot',coverage:catalog.coverage,purchasingEnabled:false};
const json=JSON.stringify(snapshot);
if(/X-API-Key|Authorization|privateKey|sessionToken|approute|letskeys/i.test(json))throw Error('Refuse unexpected secret/supplier labels in public artifact');
const destination=new URL('../web/src/lib/catalog-public-snapshot.json',import.meta.url),temp=new URL('../web/src/lib/catalog-public-snapshot.json.tmp',import.meta.url);
writeFileSync(temp,json);renameSync(temp,destination);
console.log(`Refreshed ${products.length} public listings captured ${catalog.generatedAt}. Review diff, run tests and redeploy; this is not payment authority.`);
