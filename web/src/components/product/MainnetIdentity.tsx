'use client';
import {useEffect,useState} from 'react';
import {Wallet,ShieldCheck,LogOut,LoaderCircle} from 'lucide-react';
const api='https://api.mercenta.xyz/mainnet-auth/';
type Provider={request:(args:{method:string;params?:unknown[]})=>Promise<unknown>};
type Session={signInAvailable?:boolean;authenticated:boolean;address?:string;chainId?:number;paymentsEnabled?:boolean;expiresAt?:number};
async function identity(action:string,body?:object):Promise<Session&{nonce?:string;message?:string}>{
 const r=await fetch(api+action,{method:body?'POST':'GET',credentials:'include',cache:'no-store',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(10000)});
 if(!r.ok)throw Error('IDENTITY_REQUEST_FAILED');const d=await r.json();if(!d||typeof d!=='object'||d.paymentsEnabled===true||d.chainId!==undefined&&d.chainId!==5042)throw Error('INVALID_IDENTITY_PROFILE');return d;
}
export function MainnetIdentity({ru}:{ru:boolean}){
 const [session,setSession]=useState<Session>({authenticated:false}),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let active=true;if(window.location.origin!=='https://mainnet.mercenta.xyz')return;const refresh=()=>identity('session').then(s=>{if(active)setSession(s);}).catch(()=>{});void refresh();const interval=setInterval(()=>{if(document.visibilityState==='visible')void refresh();},60000);return()=>{active=false;clearInterval(interval);};},[]);
 async function signIn(){
  setError('');const provider=(window as Window&{ethereum?:Provider}).ethereum;
  if(!provider){setError(ru?'Откройте сайт в браузере с кошельком. Оплата остаётся закрытой.':'Open this site in a wallet-enabled browser. Payments remain closed.');return;}
  setBusy(true);
  try{
   const accounts=await provider.request({method:'eth_requestAccounts'});if(!Array.isArray(accounts)||typeof accounts[0]!=='string'||!/^0x[a-fA-F0-9]{40}$/.test(accounts[0]))throw Error();const address=accounts[0];
   const c=await identity('nonce',{address});if(typeof c.nonce!=='string'||typeof c.message!=='string'||!/^mainnet\.mercenta\.xyz wants you to sign in to Mercenta Mainnet\./.test(c.message)||!c.message.includes(address.toLowerCase())||!c.message.includes('Nonce: '+c.nonce)||!c.message.includes('Chain ID: 5042')||!c.message.includes('does not authorize'))throw Error();
   // EIP-191 identity proof only. No chain switch, token approval or transaction request.
   const bytes=new TextEncoder().encode(c.message),message='0x'+Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
   const signature=await provider.request({method:'personal_sign',params:[message,address]});if(typeof signature!=='string')throw Error();
   const verified=await identity('verify',{address,nonce:c.nonce,signature});setSession({...verified,signInAvailable:true});
  }catch{setError(ru?'Вход не завершён. Подпись не разрешает тратить средства; можно повторить.':'Sign-in was not completed. The signature grants no spending permission; you can retry.');}finally{setBusy(false);}
 }
 async function signOut(){setBusy(true);setError('');try{const s=await identity('logout',{});setSession({...s,signInAvailable:true});}catch{setError(ru?'Не удалось завершить сессию. Повторите выход.':'Could not end the session. Retry signing out.');}finally{setBusy(false);}}
 return <div className="mn-identity" aria-label={ru?'Личность Mainnet':'Mainnet identity'}>
  {session.authenticated?<><span title={session.address}><ShieldCheck size={15}/>{session.address?.slice(0,6)}…{session.address?.slice(-4)}</span><button className="ma-icon" onClick={signOut} disabled={busy} aria-label={ru?'Выйти из Mainnet':'Sign out of Mainnet'}>{busy?<LoaderCircle size={16} className="mn-identity-spinner"/>:<LogOut size={16}/>}</button></>:<button className="ma-button secondary" onClick={signIn} disabled={busy||!session.signInAvailable} title={ru?'Только подтверждение личности. Не разрешает покупки или переводы.':'Identity only. Does not authorize purchases or transfers.'}>{busy?<LoaderCircle size={16} className="mn-identity-spinner"/>:<Wallet size={16}/>}<span>{ru?'Войти · без оплаты':'Sign in · no payments'}</span></button>}
  {!session.signInAvailable&&!session.authenticated&&<span className="mn-identity-unavailable">{ru?'Вход пока недоступен':'Sign-in not available yet'}</span>}
  {error&&<p className="mn-identity-error" role="status">{error}</p>}
 </div>;
}
