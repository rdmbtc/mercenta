 'use client';
import {useEffect,useState} from 'react';
import {ProductCatalog} from './ProductCatalog';
import type {BrowseCatalog} from '@/lib/catalog-browse';
import {refreshPublicCatalog,unpackBrowse} from '@/lib/public-catalog-client';
export function BrowseCatalog({initial}:{initial:BrowseCatalog}){
 const [feed,setFeed]=useState(()=>unpackBrowse(initial));
 useEffect(()=>{let mounted=true;const refresh=()=>{if(document.visibilityState==='hidden')return;void refreshPublicCatalog().then(c=>{if(mounted)setFeed(unpackBrowse(c))}).catch(()=>{/* Keep dated snapshot; never invent current stock. */});};refresh();const timer=setInterval(refresh,75_000);document.addEventListener('visibilitychange',refresh);return()=>{mounted=false;clearInterval(timer);document.removeEventListener('visibilitychange',refresh);}},[]);
 return <ProductCatalog {...feed}/>;
}
