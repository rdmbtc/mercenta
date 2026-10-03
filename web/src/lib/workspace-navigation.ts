export const primaryDestinations=[
 {id:'home',section:'Dashboard',en:'Home',ru:'Главная'},
 {id:'shop',section:'Shop',en:'Shop',ru:'Магазин'},
 {id:'wallet',section:'Funds',en:'Account',ru:'Счёт'},
 {id:'assistant',section:'Agent Chat',en:'Assistant',ru:'Ассистент'},
] as const;
export type PrimaryGroup=typeof primaryDestinations[number]['id'];
export const workspaceSections=['Dashboard','Getting Started','Shop','Orders','Funds','Transactions','Budget','Agent Chat','Financial Journal','Profit First','Liquidity','API Access','Guided Demo','Support','Settings'] as const;
export type WorkspaceSection=typeof workspaceSections[number];
export function sectionGroup(s:WorkspaceSection):PrimaryGroup{if(s==='Shop'||s==='Orders')return 'shop';if(['Funds','Transactions','Budget','Profit First','Liquidity'].includes(s))return 'wallet';if(s==='Agent Chat'||s==='Financial Journal')return 'assistant';return 'home'}
export function sectionSlug(s:WorkspaceSection){return s.toLowerCase().replace(/\s+/g,'-')}
export function sectionFromSlug(s:string|null):WorkspaceSection|null{return workspaceSections.find(x=>sectionSlug(x)===s)??null}
export function capPreview(monthly:string){if(!/^(0|[1-9]\d*)(\.\d{1,6})?$/.test(monthly)||monthly.length>16)throw new Error('INVALID_AMOUNT');const [w,f='']=monthly.split('.'),units=BigInt(w)*1000000n+BigInt(f.padEnd(6,'0'));if(units<=0n)throw new Error('INVALID_AMOUNT');const spend=units*70n/100n,daily=spend<10000000n?spend:10000000n,order=daily<5000000n?daily:5000000n;if(order<=0n)throw new Error('INVALID_AMOUNT');const format=(n:bigint)=>n/1000000n+'.'+(n%1000000n).toString().padStart(6,'0');return {monthly:format(units),perOrder:format(order),daily:format(daily),spendUnits:spend.toString(),reserveUnits:(units-spend-units*10n/100n).toString(),goalUnits:(units*10n/100n).toString()}}
