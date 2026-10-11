import type {BrowseCatalog,BrowseRow} from './catalog-browse';
import {brandArtwork} from './brand-artwork';
import {groupCatalog,isSteamAccountOffer,topProductRank,type ProductFamily} from './catalog-families';
import {unpackBrowse} from './catalog-browse';
/** Editorial entry points from the received catalogue, never invented stock or prices. */
export function homeFeatured(catalog?:BrowseCatalog):BrowseRow[]{
 if(!catalog)return [];
 const valid=catalog.rows.filter(r=>r[4]==='voucher'&&!isSteamAccountOffer({name:r[1],brand:r[2]})&&!/accounts?|auto[ -]?regs|access[ -]?token/i.test(r[1])&&r[10]==='USD'&&Number.isFinite(r[8])&&r[8]>0&&!!brandArtwork(r[1]));
 const sorted=valid.slice().sort((a,b)=>{const rA=topProductRank(a[1]),rB=topProductRank(b[1]);if(rA!==rB)return rA-rB;return a[1].localeCompare(b[1]);});
 const result:BrowseRow[]=[];
 for(const row of sorted){if(!result.some(r=>r[2]===row[2])){result.push(row);if(result.length===6)break;}}
 return result.length>=3?result:sorted.slice(0,6);
}
export function saveHomeGoal(goal:string){const clean=goal.trim().slice(0,140);if(!clean)return false;try{sessionStorage.setItem('mercenta-agent-draft',JSON.stringify({goal:clean,mode:'testnet'}))}catch{}return true}
export function saveCatalogIntent(row:BrowseRow){try{sessionStorage.setItem('mercenta-catalog-intent',JSON.stringify({query:row[1].slice(0,200),region:row[5]||'all'}))}catch{}}

export function homeFeaturedFamilies(catalog?:BrowseCatalog,randomize=false):ProductFamily[]{if(!catalog)return [];const groups=groupCatalog(unpackBrowse(catalog).products,randomize);const featured=groups.filter(g=>topProductRank(g.name)<999);return featured.length>=3?featured.slice(0,8):groups.slice(0,8);}
export function saveFamilyIntent(family:ProductFamily){try{sessionStorage.setItem('mercenta-catalog-intent',JSON.stringify({query:family.name.slice(0,200),region:'all'}))}catch{}}
