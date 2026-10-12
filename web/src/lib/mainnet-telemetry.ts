import type {MainnetOrder} from './mainnet-orders';
export function summarizeMainnetOrders(orders:MainnetOrder[]){
 const topUps=orders.filter(o=>o.codes.some(c=>c.startsWith('TOPUP_CREDITED:')) || /telegram|top.?up/i.test(o.name || ''));
 const sum=(rows:MainnetOrder[])=>rows.reduce((n,o)=>/^\d+$/.test(o.amount_units)?n+BigInt(o.amount_units):n,0n).toString();
 const vouchers=orders.filter(o=>!topUps.includes(o));
 return {totalOrders:orders.length,shopOrders:vouchers.length,directTopUpOrders:topUps.length,totalSpentUnits:sum(orders),shopSpentUnits:sum(vouchers),directTopUpSpentUnits:sum(topUps)};
}
