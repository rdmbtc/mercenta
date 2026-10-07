// @vitest-environment jsdom
import {it,expect,vi,afterEach} from 'vitest';
import React,{act} from 'react';import {createRoot,type Root} from 'react-dom/client';
import {CatalogFamilyDialog} from '@/components/product/CatalogFamilyDialog';import {groupCatalog} from '@/lib/catalog-families';import type {CatalogProduct} from '@/lib/supplier';
vi.mock('@/components/product/ProductShell',()=>({Modal:({children}:{children:React.ReactNode})=>React.createElement('div',{role:'dialog'},children)}));
vi.mock('@/components/product/ProductImage',()=>({ProductImage:()=>React.createElement('div')}));
const observed=vi.hoisted(()=>({ids:[] as string[],preview:[] as boolean[]}));
vi.mock('@/components/product/CatalogItemDialog',()=>({CatalogItemDialog:({product,regionControl,previewOnly,onLockChange}:{product:CatalogProduct;regionControl:React.ReactNode;previewOnly:boolean;onLockChange:(v:boolean)=>void})=>{observed.ids.push(product.id);observed.preview.push(previewOnly);return React.createElement('div',null,regionControl,React.createElement('button',{onClick:()=>onLockChange(true)},'Lock checkout'))}}));
(globalThis as unknown as {IS_REACT_ACT_ENVIRONMENT:boolean}).IS_REACT_ACT_ENVIRONMENT=true;
const p=(id:string,region:string):CatalogProduct=>({id,name:'Roblox | '+region,brand:'Roblox',category:'gaming',type:'voucher',countryCode:region,denominations:[],optionsDeferred:true,optionCount:2,minPrice:2,maxPrice:5,currency:'USD',inStock:1,totalStock:1});
let root:Root|undefined,el:HTMLDivElement;
afterEach(async()=>{if(root)await act(async()=>root!.unmount());document.body.innerHTML='';observed.ids=[];observed.preview=[];vi.unstubAllGlobals()});
async function render(previewOnly=false){el=document.createElement('div');document.body.append(el);root=createRoot(el);await act(async()=>root!.render(React.createElement(CatalogFamilyDialog,{family:groupCatalog([p('us-sku','US'),p('br-sku','BR')])[0],onClose:vi.fn(),previewOnly})))}
async function select(value:string){await act(async()=>{const s=el.querySelector('select')!;s.value=value;s.dispatchEvent(new Event('change',{bubbles:true}))})}
it('requires an explicit region and passes the exact selected SKU to detail loading',async()=>{const fetch=vi.fn();vi.stubGlobal('fetch',fetch);await render();expect(observed.ids).toEqual([]);expect(el.querySelector('select')!.value).toBe('');expect(fetch).not.toHaveBeenCalled();await select('br-sku');expect(observed.ids.at(-1)).toBe('br-sku');await select('us-sku');expect(observed.ids.at(-1)).toBe('us-sku')});
it('disables region changes while checkout is locked',async()=>{await render();await select('us-sku');await act(async()=>el.querySelector('button')!.click());expect(el.querySelector('select')!.disabled).toBe(true)});
it('preserves preview-only mode on every mainnet region change',async()=>{await render(true);await select('us-sku');await select('br-sku');expect(observed.preview.every(Boolean)).toBe(true)});
