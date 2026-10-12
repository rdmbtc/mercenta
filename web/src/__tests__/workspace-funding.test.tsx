// @vitest-environment jsdom
import React,{act,useState} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {readFileSync} from 'node:fs';
vi.mock('@/components/onramp/ArcOnrampKit',()=>({ArcOnrampKit:({compact}:{compact?:boolean})=><div data-compact={String(compact)}>Provider funding view</div>}));
import {AddUsdcDialog} from '@/components/onramp/AddUsdcDialog';
(globalThis as unknown as {IS_REACT_ACT_ENVIRONMENT:boolean}).IS_REACT_ACT_ENVIRONMENT=true;
let root:Root,host:HTMLDivElement;
const show=vi.fn(function(this:HTMLDialogElement){this.setAttribute('open','');}),close=vi.fn(function(this:HTMLDialogElement){this.removeAttribute('open');});
beforeEach(()=>{vi.clearAllMocks();Object.defineProperty(HTMLDialogElement.prototype,'showModal',{configurable:true,value:show});Object.defineProperty(HTMLDialogElement.prototype,'close',{configurable:true,value:close});host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();document.body.style.overflow='';});
function Demo({theme='dark'}:{theme?:'dark'|'light'}){const [open,setOpen]=useState(false);return <><button onClick={()=>setOpen(true)}>Add USDC</button>{open&&<AddUsdcDialog theme={theme} onClose={()=>setOpen(false)}/>}</>;}
async function open(theme:'dark'|'light'='dark'){await act(async()=>root.render(<Demo theme={theme}/>));const trigger=host.querySelector('button')!;trigger.focus();await act(async()=>trigger.click());return trigger;}
it('opens compact funding in a native modal without navigation',async()=>{const href=window.location.href;await open();expect(show).toHaveBeenCalledTimes(1);expect(host.querySelector('dialog')?.getAttribute('aria-labelledby')).toBe('add-usdc-title');expect(host.querySelector('[data-compact=true]')).not.toBeNull();expect(window.location.href).toBe(href);expect(document.body.style.overflow).toBe('hidden');expect(host.textContent).toContain('does not cancel a submitted transfer');});
it('close restores scrolling, focus, and removes funding content',async()=>{document.body.style.overflow='auto';const trigger=await open();await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label="Close Add USDC"]')!.click());expect(host.querySelector('dialog')).toBeNull();expect(close).toHaveBeenCalled();expect(document.body.style.overflow).toBe('auto');expect(document.activeElement).toBe(trigger);});
it('Escape dismisses via cancel and leaves no hidden widget',async()=>{await open();await act(async()=>host.querySelector('dialog')!.dispatchEvent(new Event('cancel',{cancelable:true})));expect(host.querySelector('dialog')).toBeNull();});
it('inherits the selected workspace light theme',async()=>{await open('light');expect(host.querySelector('dialog')?.getAttribute('data-theme')).toBe('light');});
it('mainnet funding opens a dialog, never redirects to a separate page',()=>{const s=readFileSync('src/components/product/AccountConsole.tsx','utf8');expect(s).toContain('if(isMainnet){setFundingOpen(true);return;}');expect(s).toContain('workspace-add-usdc');expect(s).not.toContain("window.location.assign('/onramp')");expect(s).toContain('isMainnet&&fundingOpen&&<AddUsdcDialog');});
it('compact variant removes marketing and return links, preserving the same secured flow',()=>{const s=readFileSync('src/components/onramp/ArcOnrampKit.tsx','utf8');expect(s).toContain('compact=false');expect(s).toContain('{!compact&&<div className="onramp-intro"');expect(s).toContain('{!compact&&<aside className="onramp-how"');expect(s).toContain("fetch('/api/onramp/sessions'");});

it('homepage funding uses the same dialog action and does not advertise unavailable payment methods',()=>{const s=readFileSync('src/components/product/WorkspaceHome.tsx','utf8');expect(s).not.toContain('href="/onramp"');expect(s).not.toContain('Debit cards, Apple Pay & Circle CCTP bridge.');expect(s).toContain('onClick={p.onFund}');expect(s).toContain('USD or EUR bank transfer. Fund your wallet right here.');});
