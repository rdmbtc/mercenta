import {POLICY,type SupplierState,type PolicyCheck,type PolicyResult} from './policy';
export type WorkspacePolicy={availableToSpend:number;reserved:number;grossMarginFloor:number;autoApprovalLimit:number};
export const defaultWorkspacePolicy:WorkspacePolicy={...POLICY};
export function checkIntent(amount:number,cost:number,supplier:SupplierState,p:WorkspacePolicy=defaultWorkspacePolicy):PolicyResult{
 const valid=Number.isFinite(amount)&&Number.isFinite(cost)&&amount>0&&cost>=0;
 const margin=valid?(amount-cost)/amount:0;
 const checks:PolicyCheck[]=[
 {id:'balance',label:'Spend balance',state:valid&&amount<=p.availableToSpend?'pass':'fail',note:valid?`${amount.toLocaleString('en-US')} against ${p.availableToSpend.toLocaleString('en-US')} USDC`:'Enter a positive amount and a non-negative supplier cost'},
 {id:'reserved',label:'Free after reserves',state:valid&&cost<=p.availableToSpend-p.reserved?'pass':'fail',note:`${Math.max(0,p.availableToSpend-p.reserved).toLocaleString('en-US')} USDC available after reserves`},
 {id:'margin',label:'Margin floor',state:valid&&margin>=p.grossMarginFloor?'pass':'fail',note:`${(margin*100).toFixed(1)}% projected · ${(p.grossMarginFloor*100).toFixed(1)}% minimum`},
 {id:'supplier',label:'Supplier verification',state:supplier==='verified'?'pass':'fail',note:supplier==='verified'?'Verified in this simulation':'Unknown supplier in this simulation'},
 {id:'limit',label:'Approval limit',state:valid&&amount<=p.autoApprovalLimit?'pass':'hold',note:`${p.autoApprovalLimit.toLocaleString('en-US')} USDC auto-approval threshold`}];
 return {margin,checks,decision:checks.some(c=>c.state==='fail')?'Policy blocked':checks.some(c=>c.state==='hold')?'Human approval required':'Cleared'};
}
