// @vitest-environment jsdom
import React,{act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {it,expect,vi,afterEach,beforeEach} from 'vitest';
import {MainnetAssistant} from '@/components/product/MainnetAssistant';
import WalletButton from '@/components/wallet-button';
import {signInWithWallet} from '@/lib/wallet';
import {hexToString,verifyMessage} from 'viem';
vi.mock('viem',async()=>({...await vi.importActual('viem'),verifyMessage:vi.fn().mockResolvedValue(true)}));
(globalThis as unknown as {IS_REACT_ACT_ENVIRONMENT:boolean}).IS_REACT_ACT_ENVIRONMENT=true;
let root:Root|undefined,host:HTMLElement;
beforeEach(()=>{vi.mocked(verifyMessage).mockResolvedValue(true);host=document.createElement('div');document.body.append(host);Element.prototype.scrollIntoView=vi.fn();});
afterEach(async()=>{if(root)await act(async()=>root?.unmount());root=undefined;document.body.innerHTML='';delete window.ethereum;vi.restoreAllMocks();vi.unstubAllGlobals();});
async function render(element:React.ReactNode){root=createRoot(host);await act(async()=>root?.render(element));}
async function click(text:string){const b=Array.from(host.querySelectorAll('button')).find(b=>b.textContent?.trim()===text);expect(b).toBeTruthy();await act(async()=>b!.click());}
async function input(el:HTMLInputElement,value:string){await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));});}
it('Mainnet chat works without blocked account endpoints',async()=>{const fetch=vi.fn();vi.stubGlobal('fetch',fetch);await render(<MainnetAssistant wallet={null} onConnect={vi.fn()}/>);await click('Commerce Copilot');await click('Gas & finality');expect(host.textContent).toContain('does not measure finality');expect(fetch).not.toHaveBeenCalled();});
it('sourcing opens explicit purchase review and never pays',async()=>{const listener=vi.fn(),fetch=vi.fn();vi.stubGlobal('fetch',fetch);window.addEventListener('mercenta-open-checkout',listener);await render(<MainnetAssistant wallet={null} onConnect={vi.fn()}/>);await input(host.querySelector('input')!,'Steam');await act(async()=>host.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));expect(host.textContent).toContain('Steam Gift Card');await click('Review');expect(listener).toHaveBeenCalledOnce();expect(fetch).not.toHaveBeenCalled();window.removeEventListener('mercenta-open-checkout',listener);});
it('wallet absence produces visible actionable error',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false}));await render(<WalletButton/>);await click('Connect wallet');expect(host.querySelector('[role=alert]')?.textContent).toContain('wallet-enabled browser');});
it('sign-in sends hex-encoded personal_sign and retains server verification',async()=>{const address='0x1111111111111111111111111111111111111111',request=vi.fn().mockResolvedValue('0x'+'ab'.repeat(65));window.ethereum={request};const fetch=vi.fn().mockResolvedValueOnce({ok:true,json:async()=>({nonce:'a'.repeat(64)})}).mockResolvedValueOnce({ok:true,json:async()=>({address,expiresAtMs:100})});vi.stubGlobal('fetch',fetch);await signInWithWallet(address);const args=request.mock.calls[0][0];expect(args.method).toBe('personal_sign');expect(hexToString(args.params[0])).toContain('It does NOT authorize any payment');expect(fetch.mock.calls[1][0]).toBe('/api/auth/verify');expect(request).toHaveBeenCalledOnce();});
