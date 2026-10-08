// @vitest-environment jsdom
import {it,expect,vi,afterEach} from 'vitest';import React,{act,useRef} from 'react';import {createRoot,type Root} from 'react-dom/client';import {useSurfaceMotion} from '@/lib/surface-motion';
(globalThis as unknown as {IS_REACT_ACT_ENVIRONMENT:boolean}).IS_REACT_ACT_ENVIRONMENT=true;
let root:Root|undefined;
function Surface({state}:{state:string}){const ref=useRef<HTMLDivElement>(null);useSurfaceMotion(ref,state);return <div ref={ref}>Always visible content</div>}
afterEach(async()=>{if(root)await act(async()=>root!.unmount());root=undefined;document.body.innerHTML='';vi.unstubAllGlobals();vi.restoreAllMocks();});
async function render(state:string){if(!root){const el=document.createElement('div');document.body.append(el);root=createRoot(el);}await act(async()=>root!.render(<Surface state={state}/>));}
it('reduced motion creates no animation and leaves content visible',async()=>{const animate=vi.fn();vi.stubGlobal('matchMedia',()=>({matches:true}));Object.defineProperty(HTMLElement.prototype,'animate',{configurable:true,value:animate});await render('home');expect(animate).not.toHaveBeenCalled();expect(document.body.textContent).toContain('Always visible');});
it('screen change cancels stale animation and restarts only a bounded transition',async()=>{const cancel=vi.fn(),add=vi.fn(),remove=vi.fn(),animate=vi.fn(()=>({cancel}));Object.defineProperty(HTMLElement.prototype,'animate',{configurable:true,value:animate});vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:add,removeEventListener:remove}));await render('home');await render('shop');expect(cancel).toHaveBeenCalledTimes(1);expect(animate).toHaveBeenCalledTimes(2);expect(animate.mock.calls[0]?.length).toBe(2);});
