/** Formatting only; safely handles micro-units integers ("830000"), decimals ("0.830000"), and null/undefined without throwing. */
export function accountMoney(units: unknown): string {
  if (units === null || units === undefined) return '0.000000';
  const str = String(units).trim();
  if (!str || str === 'NaN') return '0.000000';

  if (str.includes('.')) {
    const num = parseFloat(str);
    if (!isNaN(num)) {
      const isNeg = num < 0;
      const abs = Math.abs(num);
      const whole = Math.floor(abs).toLocaleString('en-US');
      const frac = Math.round((abs - Math.floor(abs)) * 1_000_000).toString().padStart(6, '0');
      return (isNeg ? '-' : '') + whole + '.' + frac;
    }
  }

  try {
    const n = BigInt(str);
    const abs = n < 0n ? -n : n;
    return (n < 0n ? '-' : '') + (abs / 1_000_000n).toLocaleString('en-US') + '.' + (abs % 1_000_000n).toString().padStart(6, '0');
  } catch {
    const num = parseFloat(str);
    if (!isNaN(num)) return num.toFixed(6);
    return '0.000000';
  }
}
export function accountCsv(headers:string[],rows:Record<string,unknown>[]){const cell=(v:unknown)=>{let s=String(v??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'};return '\uFEFF'+[headers.map(cell).join(','),...rows.map(r=>headers.map(k=>cell(r[k])).join(','))].join('\r\n');}
