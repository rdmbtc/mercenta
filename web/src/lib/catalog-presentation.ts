import {familyPrice,type ProductFamily} from './catalog-families';
export type CatalogueSort='recommended'|'name'|'price';
export function sortFamilies(rows:ProductFamily[],sort:CatalogueSort,region:string,ru:boolean){
 if(sort==='recommended')return rows;
 return rows.slice().sort((a,b)=>{if(sort==='name')return a.name.localeCompare(b.name,ru?'ru':'en',{numeric:true});if(a.currency!==b.currency)return a.currency.localeCompare(b.currency);const x=familyPrice(a,region),y=familyPrice(b,region);return x===null?(y===null?0:1):y===null?-1:x-y;});
}
export function productCount(n:number,ru:boolean){if(!ru)return n+' '+(n===1?'product':'products');const end=n%10,hundred=n%100;return n+' '+(end===1&&hundred!==11?'товар':end>=2&&end<=4&&(hundred<12||hundred>14)?'товара':'товаров');}
