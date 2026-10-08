/* Decorative map of the interactive example, never a live execution indicator. */
export function JourneyIllustration({step}:{step:number}){
 return <svg className="pd-journey-svg" viewBox="0 0 440 64" fill="none" aria-hidden="true" focusable="false">
  <path className="pd-journey-rail" d="M50 32H390" stroke="currentColor" strokeWidth="1"/>
  {[50,163,276,390].map((x,i)=><g key={x} className={step===i?'pd-journey-node active':'pd-journey-node'}><rect x={x-23} y="9" width="46" height="46" rx="12" fill="var(--cl-panel)" stroke="currentColor"/><g transform={'translate('+(x-10)+' 22)'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{i===0?<><circle cx="8" cy="8" r="6"/><path d="m13 13 5 5"/></>:i===1?<><path d="M3 5h14M3 15h14"/><circle cx="7" cy="5" r="2" fill="var(--cl-panel)"/><circle cx="13" cy="15" r="2" fill="var(--cl-panel)"/></>:i===2?<><path d="M5 1h8l3 3v15H4V1h1ZM12 1v4h4M7 10h6M7 14h6"/></>:<><path d="m10 1 8 4v6c0 4-5 7-8 8-3-1-8-4-8-8V5l8-4Z"/><path d="m6 10 3 3 5-5"/></>}</g></g>)}
 </svg>;
}
