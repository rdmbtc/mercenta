import {isIP} from 'node:net';
/** Server-only pinned origin; credentials are never sent to a caller-controlled host. */
export function supplierEndpoint(base?:string,allowedOrigin?:string):URL {
 if(!base||!allowedOrigin)throw Error('SUPPLIER_ENDPOINT_UNCONFIGURED');
 let u:URL,pin:URL;try{u=new URL(base);pin=new URL(allowedOrigin)}catch{throw Error('SUPPLIER_ENDPOINT_INVALID')}
 if(pin.href!==pin.origin+'/'||u.origin!==pin.origin||u.protocol!=='https:'||u.port&&u.port!=='443'||u.username||u.password||u.search||u.hash||u.pathname.replace(/\/$/,'')!=='/api/v1'||isIP(u.hostname)||!u.hostname.includes('.')||/\.(local|internal|localhost)$/i.test(u.hostname))throw Error('SUPPLIER_ENDPOINT_INVALID');
 return u;
}
export function redactSupplierIdentity(text:string,settings:{SUPPLIER_API_URL?:string;PRIVATE_SUPPLY_IDENTITY?:string}):string {
 const labels=[settings.PRIVATE_SUPPLY_IDENTITY];try{const host=new URL(settings.SUPPLIER_API_URL??'').hostname;labels.push(host,host.split('.')[0])}catch{}
 let output=text;for(const label of labels.filter((x):x is string=>!!x&&x.length>2)){output=output.replace(new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'),'Mercenta catalogue')}
 return output;
}
