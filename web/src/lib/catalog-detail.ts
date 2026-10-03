import {parseMoney,formatMoney} from './liquidity-math';
import type {CatalogDenomination} from './supplier';
export function catalogueTotal(option:CatalogDenomination|undefined,quantity:number){if(!option||!Number.isInteger(quantity)||quantity<1||quantity>99)return null;return {amount:formatMoney(parseMoney(String(option.price))*BigInt(quantity)),currency:option.currency,checkoutQuote:false as const,purchasingEnabled:false as const}}
export function catalogueQuantityLimit(option:CatalogDenomination|undefined){return option?.stock!=null&&option.stock>0?Math.min(option.stock,99):99}
