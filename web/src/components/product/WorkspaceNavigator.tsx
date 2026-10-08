"use client";
import {useEffect,useId,useMemo,useRef,useState} from 'react';
import {Search,X,ArrowUpRight,House,ShoppingBag,Bot,Wallet,SlidersHorizontal,ReceiptText,LifeBuoy,BookOpen,LockKeyhole} from 'lucide-react';
import type {WorkspaceSection} from '@/lib/workspace-navigation';
type Destination={id:string;en:string;ru:string;description:string;descriptionRu:string;Icon:typeof Search;section?:WorkspaceSection|'launch';href?:string};
const COMMON:Destination[]=[
 {id:'home',en:'Home',ru:'Главная',description:'Your next step',descriptionRu:'С чего начать',Icon:House,section:'Dashboard'},
 {id:'catalogue',en:'Catalogue',ru:'Каталог',description:'Products, regions and options',descriptionRu:'Товары, регионы и номиналы',Icon:ShoppingBag,section:'Shop'},
 {id:'agent',en:'Assistant',ru:'Ассистент',description:'Prepare a bounded task',descriptionRu:'Подготовить задачу с лимитами',Icon:Bot,section:'Agent Chat'},
];
const TESTNET:Destination[]=[
 {id:'account',en:'Account',ru:'Счёт',description:'Prepaid account and wallet are separate',descriptionRu:'Предоплаченный счёт отдельно от кошелька',Icon:Wallet,section:'Funds'},
 {id:'budget',en:'Budget',ru:'Бюджет',description:'Plan spending without moving funds',descriptionRu:'План расходов без перевода средств',Icon:SlidersHorizontal,section:'Budget'},
 {id:'orders',en:'Purchases',ru:'Мои покупки',description:'Test orders and saved delivery',descriptionRu:'Тестовые заказы и сохранённая выдача',Icon:ReceiptText,section:'Orders'},
];
const EXTERNAL:Destination[]=[
 {id:'support',en:'Support & refunds',ru:'Поддержка и возвраты',description:'Manual review by Mercenta Support',descriptionRu:'Ручная проверка поддержкой Mercenta',Icon:LifeBuoy,href:'/refund'},
 {id:'docs',en:'API reference',ru:'API документация',description:'Contracts and environment boundaries',descriptionRu:'Контракты API и границы сред',Icon:BookOpen,href:'/api-docs'},
];
export function WorkspaceNavigator({ru=false,network='testnet',disabled=false,onNavigate}:{ru?:boolean;network?:'testnet'|'mainnet';disabled?:boolean;onNavigate:(section:WorkspaceSection|'launch')=>void}){
 const [open,setOpen]=useState(false),[query,setQuery]=useState('');
 const dialog=useRef<HTMLDialogElement>(null),input=useRef<HTMLInputElement>(null),trigger=useRef<HTMLButtonElement>(null);const id=useId();
 const destinations=useMemo<Destination[]>(()=>[...COMMON,...(network==='testnet'?TESTNET:[{id:'launch',en:'Launch status',ru:'Статус запуска',description:'Mainnet payment gates',descriptionRu:'Условия открытия оплаты Mainnet',Icon:LockKeyhole,section:'launch' as const}]),...EXTERNAL],[network]);
 const rows=destinations.filter(d=>(d.en+' '+d.ru+' '+d.description+' '+d.descriptionRu).toLowerCase().includes(query.trim().toLowerCase()));
 useEffect(()=>{const keys=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'&&!e.repeat&&!e.isComposing){if(disabled||document.querySelector('dialog[open], [aria-modal="true"]'))return;e.preventDefault();setQuery('');setOpen(true);}};document.addEventListener('keydown',keys);return()=>document.removeEventListener('keydown',keys);},[disabled]);
 useEffect(()=>{if(!open)return;const d=dialog.current,previous=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow;d?.showModal();document.body.style.overflow='hidden';input.current?.focus();return()=>{d?.close();document.body.style.overflow=overflow;if(previous?.isConnected)previous.focus();};},[open]);
 useEffect(()=>{if(disabled)setOpen(false)},[disabled]);
 const close=()=>{setOpen(false);setQuery('')};
 const pick=(d:typeof destinations[number])=>{close();if(d.section)onNavigate(d.section);};
 return <><button ref={trigger} type="button" className="pd-nav-trigger" disabled={disabled} aria-label={ru?'Быстрая навигация':'Quick navigation'} aria-haspopup="dialog" onClick={()=>{setQuery('');setOpen(true)}}><Search size={17} aria-hidden="true"/><span>{ru?'Найти раздел':'Go to'}</span><kbd>⌘ / Ctrl K</kbd></button>{open&&<dialog ref={dialog} className="pd-navigator" aria-labelledby={id+'-title'} onCancel={e=>{e.preventDefault();close()}} onClick={e=>{if(e.target===e.currentTarget)close()}} onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();close();return;}if(!['ArrowDown','ArrowUp'].includes(e.key))return;const controls=Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[data-nav-result]'));if(!controls.length)return;e.preventDefault();const current=controls.indexOf(document.activeElement as HTMLElement);controls[(current+(e.key==='ArrowDown'?1:controls.length-1)+controls.length)%controls.length].focus();}}>
 <header><div><span className="pd-overline">MERCENTA / {network.toUpperCase()}</span><h2 id={id+'-title'}>{ru?'Куда перейдём?':'Where next?'}</h2></div><button type="button" aria-label={ru?'Закрыть навигацию':'Close navigation'} onClick={close}><X size={19}/></button></header>
 <label className="pd-nav-search"><Search size={18} aria-hidden="true"/><input ref={input} value={query} onChange={e=>setQuery(e.target.value)} placeholder={ru?'Каталог, агент, бюджет…':'Catalogue, assistant, budget…'} aria-label={ru?'Поиск раздела':'Search workspace'}/></label>
 <div className="pd-nav-results">{rows.length?rows.map(d=>{const contents=<><d.Icon size={21} strokeWidth={1.6} aria-hidden="true"/><span><strong>{ru?d.ru:d.en}</strong><small>{ru?d.descriptionRu:d.description}</small></span><ArrowUpRight size={15} aria-hidden="true"/></>;return d.href?<a data-nav-result key={d.id} href={d.href}>{contents}</a>:<button data-nav-result type="button" key={d.id} onClick={()=>pick(d)}>{contents}</button>}):<p role="status">{ru?'Раздел не найден. Попробуйте «каталог» или «агент».':'No section found. Try “catalogue” or “assistant”.'}</p>}</div>
 <footer><span>{ru?'Только переход. Ничего не покупает.':'Navigation only. Never authorizes spending.'}</span><span><kbd>↑ ↓</kbd> <kbd>Esc</kbd></span></footer>
 </dialog>}</>;
}
