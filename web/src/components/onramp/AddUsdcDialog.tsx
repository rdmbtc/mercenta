'use client';
import {useEffect,useRef} from 'react';
import {Plus,X} from 'lucide-react';
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
 return <dialog ref={dialog} className="workspace-funding-dialog" data-theme={theme} aria-labelledby="add-usdc-title" aria-describedby="add-usdc-description" onCancel={event=>{event.preventDefault();onClose();}}>
  <header className="workspace-funding-heading"><div><span className="workspace-funding-kicker"><Plus size={14}/> WALLET FUNDING</span><h2 id="add-usdc-title">Add USDC</h2><p id="add-usdc-description">Fund your wallet. Stay in your workspace.</p></div><button type="button" className="workspace-funding-dismiss" aria-label="Close Add USDC" onClick={onClose}><X size={20}/></button></header>
  <div className="workspace-funding-body"><ArcOnrampKit compact/><p className="workspace-funding-reminder">Bank transfers are not instant. Closing this window does not cancel a submitted transfer. Check your provider reference and wallet before sending again.</p></div>
 </dialog>;
}
