import type {BrowseCatalog,BrowseRow} from './catalog-browse';
import {brandArtwork} from './brand-artwork';
/** Editorial entry points from the received catalogue, never invented stock or prices. */
export function homeFeatured(catalog?:BrowseCatalog):BrowseRow[]{
 if(!catalog)return [];
 const valid=catalog.rows.filter(r=>r[4]==='voucher'&&r[10]==='USD'&&Number.isFinite(r[8])&&r[8]>0&&!!brandArtwork(r[1]));
 const rank=(r:BrowseRow)=>/^(GLOB|GLOBAL|ANY)$/i.test(r[5])?0:r[5]==='US'?1:2;
 const result:BrowseRow[]=[];
 for(const brand of ['Steam','Roblox','Spotify']){const row=valid.filter(r=>(r[2]+' '+r[1]).toLowerCase().includes(brand.toLowerCase())).sort((a,b)=>rank(a)-rank(b)||a[1].localeCompare(b[1]))[0];if(row)result.push(row)}
 for(const row of valid){if(result.length===3)break;if(!result.some(r=>r[2]===row[2]))result.push(row)}
 return result;
}
export function saveHomeGoal(goal:string){const clean=goal.trim().slice(0,140);if(!clean)return false;try{sessionStorage.setItem('mercenta-agent-draft',JSON.stringify({goal:clean,mode:'testnet'}))}catch{}return true}
export function saveCatalogIntent(row:BrowseRow){try{sessionStorage.setItem('mercenta-catalog-intent',JSON.stringify({query:row[1].slice(0,200),region:row[5]||'all'}))}catch{}}
