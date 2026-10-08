"use client";
import {useEffect,type RefObject} from 'react';
/** Animate content only. Nothing is hidden before JS; financial state is never inferred. */
export function useSurfaceMotion(ref:RefObject<HTMLElement|null>,key:string){
 useEffect(()=>{const el=ref.current;if(!el||typeof matchMedia!=='function'||typeof el.animate!=='function')return;const media=matchMedia('(prefers-reduced-motion: reduce)');if(media.matches)return;
 const animation=el.animate([{opacity:.72,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:240,easing:'cubic-bezier(.22,1,.36,1)'});
 const stop=()=>animation.cancel();media.addEventListener('change',stop);return()=>{stop();media.removeEventListener('change',stop);};
 },[key,ref]);
}
export function useRevealMotion(ref:RefObject<HTMLElement|null>){
 useEffect(()=>{const el=ref.current;if(!el||typeof matchMedia!=='function'||typeof IntersectionObserver==='undefined')return;const media=matchMedia('(prefers-reduced-motion: reduce)');if(media.matches)return;const animations:Animation[]=[];
 const observer=new IntersectionObserver(entries=>{for(const e of entries){if(!e.isIntersecting)continue;observer.unobserve(e.target);if(typeof e.target.animate==='function')animations.push(e.target.animate([{opacity:.7,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:420,easing:'cubic-bezier(.22,1,.36,1)'}));}}, {threshold:.1});
 el.querySelectorAll('[data-surface-reveal]').forEach(e=>observer.observe(e));const stop=()=>{observer.disconnect();animations.forEach(a=>a.cancel());};media.addEventListener('change',stop);return()=>{stop();media.removeEventListener('change',stop);};
 },[ref]);
}
