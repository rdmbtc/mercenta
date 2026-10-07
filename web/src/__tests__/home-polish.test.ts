// @vitest-environment jsdom
import {it,expect,vi,afterEach} from 'vitest';
import React,{act} from 'react';import {createRoot,type Root} from 'react-dom/client';
import {WorkspaceHome} from '@/components/product/WorkspaceHome';
import {homeFeatured} from '@/lib/home-featured';
import type {BrowseCatalog,BrowseRow} from '@/lib/catalog-browse';
vi.mock('@/components/product/ProductImage',()=>({ProductImage:({name}:{name:string})=>React.createElement('div',null,name)}));
vi.mock('@/components/product/StartJourney',()=>({StartJourney:()=>React.createElement('button',null,'Help me get started')}));
(globalThis as unknown as {IS_REACT_ACT_ENVIRONMENT:boolean}).IS_REACT_ACT_ENVIRONMENT=true;
const row=(id:string,name:string,region='GLOB',currency='USD'):BrowseRow=>[id,name,name,'gaming','voucher',region,'','brand',2.5,5,currency,3,3,2,''];
const catalog:BrowseCatalog={version:1,rows:[row('tr','Steam Wallet','TR'),row('global','Steam Wallet'),row('r','Roblox'),row('s','Spotify')],live:false,snapshot:true,generatedAt:'2026-01-01',purchasingEnabled:false};
let root:Root|undefined,el:HTMLDivElement;
const props={catalog,lang:'en' as const,wallet:null,available:null,reserved:null,orders:null,spent:null,recent:[],products:[],onReview:vi.fn(),onNavigate:vi.fn(),onSetup:vi.fn(),onFund:vi.fn(),canFund:false,loading:false,readOnly:false};
async function render(extra:object={}){el=document.createElement('div');document.body.append(el);root=createRoot(el);await act(async()=>root!.render(React.createElement(WorkspaceHome,{...props,...extra})))}
afterEach(async()=>{if(root)await act(async()=>root!.unmount());root=undefined;document.body.innerHTML='';sessionStorage.clear();vi.unstubAllGlobals();vi.clearAllMocks()});
it('featured entry points prefer global and never invent catalogue rows',()=>{expect(homeFeatured(catalog).map(r=>r[0])).toEqual(['global','r','s']);expect(homeFeatured()).toEqual([])});
it('excludes non-USD, non-positive, non-finite and non-voucher previews',()=>{const rows=[row('eur','Steam','GLOB','EUR'),row('zero','Roblox'),row('bad','Spotify'),row('top','Steam')];rows[1][8]=0;rows[2][8]=NaN;rows[3][4]='direct_topup';expect(homeFeatured({...catalog,rows})).toEqual([])});
it('preparing an agent goal only writes a draft and navigates',async()=>{const fetch=vi.fn();vi.stubGlobal('fetch',fetch);await render();await act(async()=>[...el.querySelectorAll('button')].find(b=>b.textContent==='Roblox')!.click());await act(async()=>el.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));expect(JSON.parse(sessionStorage.getItem('mercenta-agent-draft')!)).toEqual({goal:'Find Roblox for my region',mode:'testnet'});expect(props.onNavigate).toHaveBeenCalledWith('Agent Chat');expect(props.onReview).not.toHaveBeenCalled();expect(fetch).not.toHaveBeenCalled()});
it('empty draft cannot submit and exposes no invented private balances',async()=>{await render();expect((el.querySelector('button[type=submit]') as HTMLButtonElement).disabled).toBe(true);expect(el.querySelector('.rf-account')).toBeNull()});
it('featured product only passes one-shot search intent, never executes a purchase',async()=>{await render();await act(async()=>el.querySelector<HTMLButtonElement>('.hf-product')!.click());expect(JSON.parse(sessionStorage.getItem('mercenta-catalog-intent')!)).toEqual({query:'Steam Wallet',region:'GLOB'});expect(props.onNavigate).toHaveBeenCalledWith('Shop');expect(props.onReview).not.toHaveBeenCalled();expect(props.onFund).not.toHaveBeenCalled()});
it('signed-in actual balance is shown rather than a mocked zero',async()=>{await render({wallet:'0xabc',available:'12500000'});expect(el.querySelector('.rf-account')?.textContent).toContain('12.50');expect(el.textContent).toContain('Your prepaid account')});
it('Russian home offers the same safe workflow',async()=>{await render({lang:'ru'});expect(el.textContent).toContain('Найдите нужное');expect(el.textContent).toContain('Это не разрешение на покупку')});

it('editorial homepage excludes account resale and auto-registration listings',()=>{expect(homeFeatured({...catalog,rows:[row('account','Auto-regs | Steam Accounts'),row('wallet','Steam Wallet')]}).map(r=>r[0])).toEqual(['wallet'])});
