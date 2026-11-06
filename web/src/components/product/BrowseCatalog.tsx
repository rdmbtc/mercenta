 'use client';
import {useEffect,useState} from 'react';import type {BrowseCatalog} from '@/lib/catalog-browse';import {ProductCatalog} from './ProductCatalog';import {refreshPublicCatalog,unpackBrowse} from '@/lib/public-catalog-client';
export function BrowseCatalog({initial}:{initial:BrowseCatalog}){
 const [feed,setFeed]=useState(()=>unpackBrowse(initial));
 const [refreshState,setRefreshState]=useState<'idle'|'refreshing'|'stale'>('idle');
 const refresh=()=>{if(document.visibilityState==='hidden')return;setRefreshState('refreshing');void refreshPublicCatalog().then(c=>{setFeed(unpackBrowse(c));setRefreshState('idle')}).catch(()=>setRefreshState('stale'));};
 useEffect(()=>{let mounted=true;const run=()=>{if(document.visibilityState==='hidden')return;setRefreshState('refreshing');void refreshPublicCatalog().then(c=>{if(mounted){setFeed(unpackBrowse(c));setRefreshState('idle')}}).catch(()=>{if(mounted)setRefreshState('stale')});};run();const timer=setInterval(run,75_000);document.addEventListener('visibilitychange',run);return()=>{mounted=false;clearInterval(timer);document.removeEventListener('visibilitychange',run);};},[]);
 return <ProductCatalog {...feed} refreshState={refreshState} onRefresh={refresh}/>;
}
