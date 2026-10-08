export type BrowseCatalogue={live:boolean;generatedAt:string;rows:unknown[][];purchasingEnabled:false};
export declare class MercentaClient{constructor(options?:{origin?:string;fetch?:typeof globalThis.fetch;timeoutMs?:number});catalogue():Promise<BrowseCatalogue>;}
