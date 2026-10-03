 'use client';
import {useEffect,useState} from 'react';
import {ProductCatalog} from './ProductCatalog';
import type {BrowseCatalog} from '@/lib/catalog-browse';
import {refreshPublicCatalog,unpackBrowse} from '@/lib/public-catalog-client';
export function BrowseCatalog({initial}:{initial:BrowseCatalog}){
 const [feed,setFeed]=useState(()=>unpackBrowse(initial));
 useEffect(()=>{let mounted=true;refreshPublicCatalog().then(c=>{if(mounted)setFeed(unpackBrowse(c))}).catch(()=>{/* Keep dated snapshot; never invent current stock. */});return()=>{mounted=false}},[]);
 return <ProductCatalog {...feed}/>;
}
