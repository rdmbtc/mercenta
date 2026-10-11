export type NetworkMode='testnet'|'mainnet';
export const NETWORKS={testnet:{id:'testnet',name:'Arc Testnet',chainId:5042002,origin:'https://testnet.mercenta.xyz',nativeDecimals:18,tokenDecimals:6,asset:'test USDC',realPurchasesEnabled:false},mainnet:{id:'mainnet',name:'Arc Mainnet',chainId:5042,origin:'https://mainnet.mercenta.xyz',nativeDecimals:18,tokenDecimals:6,asset:'USDC',realPurchasesEnabled:true}} as const;
export function networkFromHost(host:string):NetworkMode {const h=host.toLowerCase().split(':')[0].replace(/\.$/,'');return h==='mainnet.mercenta.xyz'?'mainnet':'testnet'}
export function networkDestination(mode:NetworkMode,section='dashboard'){const allowed=['dashboard','shop','orders','funds','budget','agent-chat','financial-journal','support','api-access','launch'];const u=new URL('/app',NETWORKS[mode].origin);if(allowed.includes(section)&&section!=='dashboard')u.searchParams.set('section',section);return u.toString()}
export function allowedMainnetApi(path:string,method:string){
 if(
  path.startsWith('/api/account/') ||
  path.startsWith('/api/auth/') ||
  path.startsWith('/api/me') ||
  path.startsWith('/api/agent/') ||
  path.startsWith('/api/catalog') ||
  path.startsWith('/api/mainnet') ||
  path.startsWith('/api/network') ||
  path.startsWith('/api/openapi') ||
  path.startsWith('/api/mainnet-readiness') ||
  path.startsWith('/api/earn/') ||
  path.startsWith('/api/v1/') ||
  path.startsWith('/api/health') ||
  path.startsWith('/api/status') ||
  path.startsWith('/api/orders') ||
  (path === '/api/support/refund' && method === 'POST')
 ) return true;
 return false;
}
export const MAINNET_CLOSED={code:'MAINNET_CHECKOUT_NOT_ENABLED',network:'mainnet',chainId:5042,realPurchasesEnabled:true,message:'Mainnet operation not supported. Use direct Arc Mainnet checkout.'} as const;
