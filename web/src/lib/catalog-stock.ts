export type StockSignal={available?:boolean;inStock?:number;stock?:number};
/** Conflicting stock signals fail closed. Unknown stock is not a reservation. */
export function availableQuantity(item:StockSignal):number {
 if(item.available===false)return 0;
 const counts=[item.inStock,item.stock].filter((v):v is number=>v!==undefined);
 if(counts.some(v=>!Number.isSafeInteger(v)||v<0))return 0;
 if(counts.length)return Math.min(...counts);
 return item.available===true?1:0;
}
export function hasStock(item:StockSignal,quantity=1):boolean {
 return Number.isSafeInteger(quantity)&&quantity>0&&availableQuantity(item)>=quantity;
}
