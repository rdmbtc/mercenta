import {NextResponse} from 'next/server';
import {NETWORKS,networkFromHost} from '@/lib/network-profile';
import {mainnetRuntimeStatus} from '@/lib/mainnet-status';
export const dynamic='force-dynamic';
export async function GET(req:Request){
 const mode=networkFromHost(new URL(req.url).hostname);
 if(mode==='mainnet'){
  const status=await mainnetRuntimeStatus();
  return NextResponse.json({...NETWORKS.mainnet,mode,realPurchasesEnabled:status.realPurchasesEnabled,accountRuntime:'wallet-direct',checkoutEnabled:status.realPurchasesEnabled,retail:status,walletSigningEnabled:status.realPurchasesEnabled,walletSignInEnabled:true,assistantMode:'live-catalogue-and-rules-guidance',agentExecutionEnabled:false,testnetRehearsalSupported:false,fulfillment:'provider-confirmation-required',balancesSharedAcrossNetworks:false},{headers:{'Cache-Control':'no-store'}});
 }
 return NextResponse.json({...NETWORKS.testnet,mode,accountRuntime:'testnet',checkoutEnabled:false,testnetRehearsalSupported:true,readiness:'Check account service status before execution',fulfillment:'simulated-only',walletSigningEnabled:true,walletSignInEnabled:true,assistantMode:'testnet-agent',balancesSharedAcrossNetworks:false},{headers:{'Cache-Control':'no-store'}});
}
