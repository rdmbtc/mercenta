"use client";
import {useCallback,useEffect,useRef,useState} from 'react';
import {connectWallet,fetchSession,hasWallet,signInWithWallet,signOut,truncateAddress} from '@/lib/wallet';
type Phase='idle'|'connecting'|'signing'|'authed'|'error';
export function walletError(error:unknown){
 const code=(error as {code?:number})?.code;
 if(code===4001)return 'Request cancelled. Connect again when you are ready.';
 if(code===-32002)return 'A wallet request is already open. Check your wallet extension.';
 const message=(error as Error)?.message??'';
 if(message==='NO_WALLET')return 'Open this site in a wallet-enabled browser with MetaMask, Rabby, or another Ethereum wallet.';
 if(message==='NO_ACCOUNTS')return 'Unlock your wallet and select an account.';
 if(/NONCE_FAILED|VERIFY_FAILED|BACKEND_UNAVAILABLE|UNAUTHORIZED/.test(message))return 'Sign-in could not be verified. No payment was made. Please try again.';
 return 'Could not connect your wallet. Check your extension and try again.';
}
export default function WalletButton(){
 const [phase,setPhase]=useState<Phase>('idle'),[address,setAddress]=useState<string|null>(null),[error,setError]=useState('');
 const locked=useRef(false),version=useRef(0);
 useEffect(()=>{let live=true;const sync=()=>{if(locked.current)return;const v=++version.current;void fetchSession().then(s=>{if(!live||v!==version.current)return;setAddress(s.authenticated?s.address:null);setPhase(s.authenticated&&s.address?'authed':'idle')}).catch(()=>{});};sync();window.addEventListener('mercenta-auth-change',sync);return()=>{live=false;window.removeEventListener('mercenta-auth-change',sync)};},[]);
 const handleClick=useCallback(async()=>{
  if(locked.current)return;locked.current=true;version.current++;setError('');
  try{
   if(phase==='authed'){await signOut();setAddress(null);setPhase('idle');}
   else{if(!hasWallet())throw new Error('NO_WALLET');setPhase('connecting');const addr=await connectWallet();setPhase('signing');await signInWithWallet(addr);setAddress(addr);setPhase('authed');}
   window.dispatchEvent(new Event('mercenta-auth-change'));
  }catch(e){setError(walletError(e));setPhase('error');}finally{locked.current=false;}
 },[phase]);
 useEffect(()=>{if(phase!=='authed')return;const changed=(accounts:unknown)=>{if(Array.isArray(accounts)&&accounts[0]?.toLowerCase()===address?.toLowerCase())return;version.current++;void signOut().catch(()=>{}).finally(()=>{setAddress(null);setPhase('idle');window.dispatchEvent(new Event('mercenta-auth-change'));});};window.ethereum?.on?.('accountsChanged',changed);return()=>window.ethereum?.removeListener?.('accountsChanged',changed);},[phase,address]);
 const busy=phase==='connecting'||phase==='signing';
 return <div className="wallet-control"><button type="button" onClick={()=>void handleClick()} disabled={busy} aria-busy={busy} aria-describedby={error?'wallet-error':undefined} data-wallet-btn data-phase={phase} title={phase==='authed'?'Disconnect '+address:'Connect wallet — sign-in is not a payment'} className="wallet-btn"><span className="wallet-dot" aria-hidden="true"/>{phase==='connecting'?'Connecting…':phase==='signing'?'Confirm sign-in…':phase==='authed'&&address?truncateAddress(address):phase==='error'?'Retry connection':'Connect wallet'}</button>{error&&<div id="wallet-error" className="wallet-error" role="alert"><span>{error}</span><button type="button" aria-label="Dismiss wallet error" onClick={()=>setError('')}>×</button></div>}</div>;
}
