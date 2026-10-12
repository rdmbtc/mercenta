'use client';
import {useEffect,useRef} from 'react';
import {X} from 'lucide-react';
import {ArcOnrampKit} from './ArcOnrampKit';
import './workspace-funding.css';

export function AddUsdcDialog({theme='dark',onClose}:{theme?:'dark'|'light';onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{
  const element=dialog.current;if(!element)return;
  const previous=document.activeElement as HTMLElement|null;
  const overflow=document.body.style.overflow;
  element.showModal();document.body.style.overflow='hidden';
  return()=>{element.close();document.body.style.overflow=overflow;if(previous?.isConnected)previous.focus();};
 },[]);
 return <dialog ref={dialog} className="workspace-funding-dialog" data-theme={theme} aria-labelledby="add-usdc-title" onCancel={event=>{event.preventDefault();onClose();}}>
  <header className="workspace-funding-heading"><h2 id="add-usdc-title">Add USDC</h2><button type="button" className="workspace-funding-dismiss" aria-label="Close Add USDC" onClick={onClose}><X size={20}/></button></header>
  <div className="workspace-funding-body"><ArcOnrampKit widgetOnly/><p className="workspace-funding-reminder">Closing this window does not cancel a submitted transfer.</p></div>
 </dialog>;
}
