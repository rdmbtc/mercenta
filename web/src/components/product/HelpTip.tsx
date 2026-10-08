"use client";
import {useEffect,useId,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {CircleHelp} from 'lucide-react';
export function HelpTip({label,children}:{label:string;children:React.ReactNode}){
 const id=useId(),[open,setOpen]=useState(false),[position,setPosition]=useState<{left:number;top:number;width:number;background:string;color:string;border:string}|null>(null),ref=useRef<HTMLSpanElement>(null),touch=useRef(false);
 useEffect(()=>{if(!open)return;const el=ref.current;if(!el)return;const rect=el.getBoundingClientRect(),width=Math.min(280,window.innerWidth-32),style=getComputedStyle(el);
 setPosition({width,left:Math.max(16,Math.min(rect.left,window.innerWidth-width-16)),top:rect.top>190?rect.top-12:rect.bottom+12,background:style.getPropertyValue('--a-surface').trim()||style.getPropertyValue('--mp-panel').trim()||'#111820',color:style.getPropertyValue('--a-ink').trim()||style.getPropertyValue('--mp-text').trim()||'#f3f6fa',border:style.getPropertyValue('--a-line').trim()||style.getPropertyValue('--mp-line').trim()||'#34414e'});
 const dismiss=()=>setOpen(false),outside=(e:PointerEvent)=>{if(!el.contains(e.target as Node))dismiss();},keys=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();dismiss();}};
 document.addEventListener('pointerdown',outside);document.addEventListener('keydown',keys);window.addEventListener('scroll',dismiss,true);window.addEventListener('resize',dismiss);
 return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',keys);window.removeEventListener('scroll',dismiss,true);window.removeEventListener('resize',dismiss);};
 },[open]);
 return <span ref={ref} className="mc-help" onPointerEnter={e=>{if(e.pointerType==='mouse')setOpen(true)}} onPointerLeave={e=>{if(e.pointerType==='mouse')setOpen(false)}}><button type="button" className="mc-help-trigger" aria-label={label} aria-expanded={open} aria-describedby={open?id:undefined} onFocus={()=>{if(!touch.current)setOpen(true)}} onBlur={()=>setOpen(false)} onPointerDown={e=>{touch.current=e.pointerType==='touch'}} onClick={()=>setOpen(v=>touch.current?!v:true)}><CircleHelp size={16} strokeWidth={1.6} aria-hidden="true"/></button>{open&&position&&createPortal(<span className="pd-tooltip" id={id} role="tooltip" style={{position:'fixed',left:position.left,top:position.top,width:position.width,transform:ref.current&&ref.current.getBoundingClientRect().top>190?'translateY(-100%)':undefined,background:position.background,color:position.color,borderColor:position.border}}>{children}</span>,ref.current?.closest('dialog[open]')??document.body)}</span>;
}
