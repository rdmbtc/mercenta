'use client';
import {useState} from 'react';
import {Globe,ShieldCheck} from 'lucide-react';
import type {ProductFamily} from '@/lib/catalog-families';
import {regionCode,regionLabel} from '@/lib/catalog-families';
import type {CatalogProduct,CatalogDenomination} from '@/lib/supplier';
import type {Language} from '@/lib/workspace-plan';
import {CatalogItemDialog} from './CatalogItemDialog';
import {Modal} from './ProductShell';
import {ProductImage} from './ProductImage';

type Selection={product:CatalogProduct;denom:CatalogDenomination;quantity:number};
export function CatalogFamilyDialog({family,initialProductId,lang='en',wallet=null,readOnly=false,previewOnly=false,isMainnet=false,onConnect,onClose,onDraft}:{family:ProductFamily;initialProductId?:string;lang?:Language;wallet?:string|null;readOnly?:boolean;previewOnly?:boolean;isMainnet?:boolean;onConnect?:(p:CatalogProduct)=>void;onClose:()=>void;onDraft?:(s:Selection)=>void}){
 const ru=lang==='ru';const [id,setId]=useState(initialProductId&&family.products.some(p=>p.id===initialProductId)?initialProductId:family.products.length===1?family.products[0].id:''),[locked,setLocked]=useState(false);const product=family.products.find(p=>p.id===id);
 const control=<section className="cf-region-choice"><div className="cf-field-heading"><Globe size={18}/><label htmlFor="family-region">{ru?'Где будете активировать товар?':'Where will you redeem it?'}</label><span>{family.regions.length} {ru?'регионов':'regions'}</span></div><select id="family-region" value={id} disabled={locked} onChange={e=>{if(!locked)setId(e.target.value)}}><option value="" disabled>{ru?'Выберите регион':'Choose your region'}</option>{family.products.map((p,i)=><option key={p.id} value={p.id}>{regionLabel(regionCode(p),ru)}{family.products.filter(x=>regionCode(x)===regionCode(p)).length>1?` · ${p.name} · ${i+1}`:''}</option>)}</select><p>{ru?'Регион должен совпадать с аккаунтом или правилами активации. Показываем только варианты из каталога.':'Match your account region and activation rules. Only received catalogue variants are shown.'}</p></section>;
 if(!product)return <Modal title={family.name} onClose={onClose}><div className="cf-region-start"><ProductImage name={family.name} category={family.category} imageUrl={family.products[0].imageSource==='supplier'?family.products[0].imageUrl:undefined}/>{control}<div className="cf-selection-hint"><ShieldCheck size={18}/><p>{ru?'Сначала регион, затем номинал и итоговая цена. Выбор ничего не списывает.':'Region first. Then see options and the exact catalogue total. Selecting a region never charges funds.'}</p></div></div></Modal>;
 return <CatalogItemDialog key={product.id} product={product} titleOverride={family.name} regionControl={control} previewOnly={previewOnly} isMainnet={isMainnet} onLockChange={setLocked} lang={lang} wallet={wallet} readOnly={readOnly} onConnect={onConnect?()=>onConnect(product):undefined} onClose={onClose} onDraft={onDraft}/>;
}
