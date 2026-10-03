 'use client';
import {useState} from 'react';import {illustrationFor,safeProductImage} from '@/lib/product-images';import {brandArtwork} from '@/lib/brand-artwork';
export function ProductImage({name,category,imageUrl,className='',priority=false}:{name:string;category:string;imageUrl?:string;className?:string;priority?:boolean}){
 const [failed,setFailed]=useState<Record<string,boolean>>({});const remote=safeProductImage(imageUrl),artwork=brandArtwork(name);
 const supplied=remote&&!failed[remote]?remote:undefined,brand=!supplied&&artwork&&!failed[artwork]?artwork:undefined;
 const photo=supplied??brand,src=photo??illustrationFor(name,category),kind=supplied?'product':brand?'brand':'illustration';
 return <div className={'product-image '+className} data-image-kind={kind}><img src={src} alt={kind==='brand'?'Platform artwork: '+name:kind==='product'?name:'Illustration: '+name} loading={priority?'eager':'lazy'} fetchPriority={priority?'high':'auto'} decoding="async" referrerPolicy="no-referrer" onError={()=>{if(photo)setFailed(v=>({...v,[photo]:true}))}}/>{kind!=='product'&&<span className="product-image-label">{kind==='brand'?'Platform artwork':'Illustrative cover'}</span>}</div>
}
