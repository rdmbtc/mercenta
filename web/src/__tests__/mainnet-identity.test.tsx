// @vitest-environment jsdom
import React,{act} from 'react';import {createRoot,type Root} from 'react-dom/client';import {it,expect,vi,afterEach} from 'vitest';
import {MainnetIdentity} from '@/components/product/MainnetIdentity';
(globalThis as unknown as {IS_REACT_ACT_ENVIRONMENT:boolean}).IS_REACT_ACT_ENVIRONMENT=true;
let root:Root|undefined,host:HTMLElement;
afterEach(async()=>{if(root)await act(async()=>root?.unmount());root=undefined;document.body.innerHTML='';vi.unstubAllGlobals();vi.restoreAllMocks();});
const address='0x'+'1'.repeat(40),nonce='a'.repeat(64);
async function mount(options:{available?:boolean;badMessage?:boolean;provider?:boolean}={}){
 const calls:string[]=[],requests:{url:string;init?:RequestInit}[]=[],base=window;
 const provider={request:vi.fn(async({method}:{method:string})=>{calls.push(method);return method==='eth_requestAccounts'?[address]:'0x'+'a'.repeat(130);})};
 vi.stubGlobal('window',new Proxy(base,{get(t,key){if(key==='location')return {origin:'https://mainnet.mercenta.xyz'};if(key==='ethereum')return options.provider===false?undefined:provider;return Reflect.get(t,key);}}));
 vi.stubGlobal('fetch',vi.fn(async(url:string,init?:RequestInit)=>{
  requests.push({url,init});const action=url.split('/').pop();let data:object={authenticated:false,signInAvailable:options.available!==false,chainId:5042,paymentsEnabled:false};
  if(action==='nonce')data={nonce,message:options.badMessage?'Authorize a purchase now':`mainnet.mercenta.xyz wants you to sign in to Mercenta Mainnet.\nWallet: ${address}\nChain ID: 5042\nNonce: ${nonce}\nThis does not authorize purchases.`,chainId:5042};
  if(action==='verify')data={authenticated:true,address,chainId:5042,paymentsEnabled:false};
  return {ok:true,json:async()=>data};
 }));
 host=document.createElement('div');document.body.append(host);root=createRoot(host);await act(async()=>root?.render(<MainnetIdentity ru={false}/>));return {calls,requests,provider};
}
it('availability check uses credentialed cookie transport; unavailable sign-in is disabled',async()=>{const f=await mount({available:false});expect((host.querySelector('button') as HTMLButtonElement).disabled).toBe(true);expect(host.textContent).toContain('Sign-in not available');expect(f.requests[0].init?.credentials).toBe('include');expect(f.calls).toEqual([]);});
it('identity sign-in requests only accounts and personal proof, never a transaction or typed spending grant',async()=>{const f=await mount();await act(async()=>host.querySelector('button')!.click());expect(f.calls).toEqual(['eth_requestAccounts','personal_sign']);expect(host.textContent).toContain('0x1111');expect(f.requests.map(r=>r.url.split('/').pop())).toEqual(['session','nonce','verify']);expect(f.requests.find(r=>r.url.endsWith('verify'))?.init?.body).not.toContain('privateKey');expect(localStorage.length).toBe(0);});
it('unexpected wallet message is not signed',async()=>{const f=await mount({badMessage:true});await act(async()=>host.querySelector('button')!.click());expect(f.calls).toEqual(['eth_requestAccounts']);expect(host.querySelector('[role=status]')?.textContent).toContain('Sign-in was not completed');});
it('missing injected wallet produces a clear non-payment hint',async()=>{await mount({provider:false});await act(async()=>host.querySelector('button')!.click());expect(host.querySelector('[role=status]')?.textContent).toContain('Payments remain closed');});
it('logout calls only identity logout and removes the identity display',async()=>{const f=await mount();await act(async()=>host.querySelector('button')!.click());await act(async()=>host.querySelector('button')!.click());expect(f.requests.at(-1)?.url).toMatch(/logout$/);expect(host.textContent).not.toContain('0x1111');expect(f.calls).toHaveLength(2);});
