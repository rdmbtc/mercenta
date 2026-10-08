// @vitest-environment jsdom
import {readFileSync} from 'node:fs';
import {it,expect,vi,afterEach} from 'vitest';import React,{act} from 'react';import {createRoot,type Root} from 'react-dom/client';import CommerceLanding from '@/components/landing/CommerceLanding';
vi.mock('next/image',()=>({default:(props:Record<string,unknown>)=>React.createElement('img',props)}));
(globalThis as unknown as {IS_REACT_ACT_ENVIRONMENT:boolean}).IS_REACT_ACT_ENVIRONMENT=true;
let root:Root|undefined,el:HTMLDivElement;
async function render(){vi.stubGlobal('matchMedia',()=>({matches:true,addEventListener:vi.fn(),removeEventListener:vi.fn()}));el=document.createElement('div');document.body.append(el);root=createRoot(el);await act(async()=>root!.render(React.createElement(CommerceLanding)));}
afterEach(async()=>{if(root)await act(async()=>root!.unmount());root=undefined;document.body.replaceChildren();vi.unstubAllGlobals();});
it('states actual Testnet versus closed Mainnet, never an APY promise',async()=>{await render();expect(el.textContent).toContain('Pre-launch · payments closed');expect(el.textContent).toContain('non-redeemable delivery');expect(el.textContent).not.toMatch(/5\.4%|5%\+|instant redemption/i);expect(el.querySelector('a[href="/refund"]')).toBeTruthy();});
it('interactive journey is clearly an example and never calls financial API',async()=>{const f=vi.fn();vi.stubGlobal('fetch',f);await render();const buttons=el.querySelectorAll('.cl-step-tabs button');await act(async()=>(buttons[2] as HTMLButtonElement).click());expect(el.textContent).toContain('An option. An exact quote.');expect(el.textContent).toContain('does not call the agent');expect(buttons[2].getAttribute('aria-pressed')).toBe('true');expect(f).not.toHaveBeenCalled();});
it('motion is independently pausable',async()=>{await render();const b=el.querySelector('.cl-motion') as HTMLButtonElement;await act(async()=>b.click());expect(el.querySelector('.cl')?.getAttribute('data-motion')).toBe('off');expect(b.getAttribute('aria-pressed')).toBe('true');});

it('links recorded technical evidence without claiming a pilot',async()=>{await render();const link=el.querySelector('.cl-recorded-proof a') as HTMLAnchorElement;expect(link).toBeTruthy();const hash=new URL(link.href).pathname.split('/').at(-1)!;expect(readFileSync('public/circle/testnet-x402-acceptance.json','utf8')).toContain(hash);expect(el.textContent).toContain('not a customer pilot');expect(link.rel).toContain('noopener');});
