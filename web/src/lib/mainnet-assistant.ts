import {mainnetQuickSelect,type QuickSelectProduct} from './mainnet-quick-select';
export function sourceMainnetProducts(goal:string,budget:string,region:string){
 if(!/^\d+(\.\d{1,6})?$/.test(budget)||Number(budget)<=0)throw Error('Enter a positive budget with up to 6 decimals.');
 const terms=goal.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(t=>t.length>2&&!['find','buy','under','usdc','please','for','the'].includes(t));
 const place=region.trim().toUpperCase();
 return mainnetQuickSelect.filter(p=>!p.outOfStock&&Number(p.price)<=Number(budget)&&(!place||place==='ANY'||p.country===place||p.country==='GLOBAL')&&terms.some(t=>(p.name+' '+p.category).toLowerCase().includes(t))).sort((a,b)=>Number(a.price)-Number(b.price)).slice(0,6);
}
export function mainnetGuidance(question:string,ru=false){
 const q=question.toLowerCase();
 if(/balance|баланс/.test(q))return ru?'Баланс нужно проверять в кошельке на Arc Mainnet (5042). История расходов — не доступный баланс.':'Check your wallet balance on Arc Mainnet (5042). Spending history is not your available balance. We do not substitute a Testnet balance.';
 if(/gas|finality|комисси|финал/.test(q))return ru?'Комиссия показывается в кошельке перед подписью. Здесь нет измерений финализации или гарантии комиссии.':'Your wallet estimates gas before you sign. This view does not measure finality or guarantee a fixed fee. A submitted transaction is not a settled purchase.';
 if(/policy|margin|profit|марж|политик/.test(q))return ru?'Проверьте товар и регион, актуальную цену, бюджет, сеть и кошелёк, затем подтверждение оплаты. Автоматическое списание и Testnet Profit First на Mainnet не включены.':'Review product and region, current quote, budget, network and wallet, then payment verification. These are review steps, not a live 5/5 policy measurement. Delegated spending and Testnet Profit First contracts are not enabled on Mainnet.';
 if(/checkout|pay|buy|оплат|куп/.test(q))return ru?'Выберите товар во вкладке закупок и откройте проверку покупки. Цена каталога предварительная; подтвердите актуальную котировку и оплату отдельно.':'Use Sourcing to find a product, then open purchase review. Catalogue prices are indicative; confirm the current quote and payment separately. Chat never signs or sends funds.';
 return ru?'Я могу помочь с каталогом, проверкой покупки, бюджетом и сетью Arc. Это консультация на основе правил, не ответ подключённой ИИ-модели. Для поиска укажите товар и лимит во вкладке закупок.':'I can guide you through catalogue sourcing, purchase review, budgets and Arc network basics. This is rules-based guidance, not a connected AI model. To find an item, enter its name and a spending limit in Sourcing.';
}
export function checkoutDetail(p:QuickSelectProduct){return {name:p.name,optionName:p.name,price:p.price,quantity:1,category:p.category,kind:p.kind,denominationId:p.denomination_id??p.id};}
