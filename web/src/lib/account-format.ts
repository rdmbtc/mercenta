/** Formatting only; all amounts stay integer micro-units, never floating point. */
export function accountMoney(units:string){const n=BigInt(units),abs=n<0n?-n:n;return (n<0n?'-':'')+(abs/1_000_000n).toLocaleString('en-US')+'.'+(abs%1_000_000n).toString().padStart(6,'0');}
export function accountCsv(headers:string[],rows:Record<string,unknown>[]){const cell=(v:unknown)=>{let s=String(v??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'};return '\uFEFF'+[headers.map(cell).join(','),...rows.map(r=>headers.map(k=>cell(r[k])).join(','))].join('\r\n');}
