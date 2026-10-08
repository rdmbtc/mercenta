/** Public read-only client. No authentication, payments, or account writes. */
export class MercentaClient {
 constructor({origin='https://mercenta.xyz',fetch:transport=globalThis.fetch,timeoutMs=15000}={}) {
  const url=new URL(origin);if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw new Error('Use a bare HTTPS origin');
  if(!Number.isFinite(timeoutMs)||timeoutMs<1||timeoutMs>60000)throw new Error('Invalid timeout');
  if(typeof transport!=='function')throw new Error('Fetch is required');this.origin=url.origin;this.transport=transport.bind(globalThis);this.timeoutMs=timeoutMs;
 }
 async catalogue(){const res=await this.transport(this.origin+'/api/catalog?view=browse',{method:'GET',credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(this.timeoutMs)});if(!res.ok)throw new Error('Catalogue unavailable: '+res.status);const value=await res.json();if(!value||!Array.isArray(value.rows)||typeof value.live!=='boolean'||typeof value.generatedAt!=='string'||value.purchasingEnabled!==false)throw new Error('Invalid catalogue response');return value;}
}
