import {randomUUID,randomBytes,createHash} from 'node:crypto';
import type {DB} from '../db.js';
import type {SupplierPreview} from './supplier-preview.js';
import {initAccount,funds,type AccountOrder} from './account.js';
import {checkBudget} from './workspace.js';
import {postJournal} from './ledger/index.js';
import {encryptCode,decryptCode} from './fulfillment/index.js';
export const TEST_UNIT_PRICE=1_000_000n;
const owner=(a:string)=>{if(!/^wallet:0x[a-f0-9]{40}$/.test(a))throw Error('WALLET_AUTH_REQUIRED');return a};
const fp=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
type QuoteRow={id:string;actor:string;request_id:string;fingerprint:string;snapshot:string;amount_units:string;created_at:number;expires_at:number};
export function initCatalogTestCheckout(db:DB){initAccount(db);db.exec(`
CREATE TABLE IF NOT EXISTS catalog_test_quotes(id TEXT PRIMARY KEY,actor TEXT NOT NULL,request_id TEXT NOT NULL,fingerprint TEXT NOT NULL,snapshot TEXT NOT NULL,amount_units TEXT NOT NULL,created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,UNIQUE(actor,request_id));
CREATE TABLE IF NOT EXISTS catalog_test_deliveries(order_id TEXT PRIMARY KEY,quote_id TEXT UNIQUE NOT NULL REFERENCES catalog_test_quotes(id),actor TEXT NOT NULL,payload TEXT NOT NULL,created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS catalog_test_quotes_actor ON catalog_test_quotes(actor,created_at);
CREATE TRIGGER IF NOT EXISTS test_quote_immutable BEFORE UPDATE ON catalog_test_quotes BEGIN SELECT RAISE(ABORT,'IMMUTABLE_QUOTE'); END;
CREATE TRIGGER IF NOT EXISTS test_delivery_immutable BEFORE UPDATE ON catalog_test_deliveries BEGIN SELECT RAISE(ABORT,'IMMUTABLE_DELIVERY'); END;
CREATE TRIGGER IF NOT EXISTS test_delivery_no_delete BEFORE DELETE ON catalog_test_deliveries BEGIN SELECT RAISE(ABORT,'IMMUTABLE_DELIVERY'); END;
`)}
function publicQuote(q:QuoteRow){return {id:q.id,...JSON.parse(q.snapshot),amountUnits:q.amount_units,currency:'USDC',network:'Arc Testnet',chainId:5042002,mode:'TESTNET_SIMULATED',unitPriceUnits:TEST_UNIT_PRICE.toString(),expiresAt:q.expires_at,createdAt:q.created_at,nonRedeemable:true,realPurchasingEnabled:false}}
export function getTestQuote(db:DB,actor:string,id:string){owner(actor);const q=db.prepare('SELECT * FROM catalog_test_quotes WHERE id=? AND actor=?').get(id,actor) as QuoteRow|undefined;if(!q)throw Error('QUOTE_NOT_FOUND');return publicQuote(q)}
export function createTestQuote(db:DB,actor:string,requestId:string,productId:string,itemId:string,quantity:number,feed:SupplierPreview,now=Date.now()){
 owner(actor);if(!Number.isInteger(quantity)||quantity<1||quantity>10)throw Error('TESTNET_QUANTITY_LIMIT');
 const fingerprint=fp({productId,itemId,quantity});const old=db.prepare('SELECT * FROM catalog_test_quotes WHERE actor=? AND request_id=?').get(actor,requestId) as QuoteRow|undefined;
 if(old){if(old.fingerprint!==fingerprint)throw Error('IDEMPOTENCY_CONFLICT');return publicQuote(old)}
 const count=db.prepare('SELECT count(*) n FROM catalog_test_quotes WHERE actor=? AND created_at>?').get(actor,now-3600000) as {n:number};if(count.n>=100)throw Error('TEST_QUOTE_RATE_LIMIT');
 if(feed.status!=='ready')throw Error('CATALOGUE_UNAVAILABLE');const p=feed.products.find(p=>p.id===productId),item=p?.items.find(i=>i.id===itemId);
 if(!p||!item)throw Error('CATALOGUE_OPTION_NOT_FOUND');const stock=item.stock??item.inStock;if(item.available===false||(stock!==undefined&&stock<quantity))throw Error('CATALOGUE_OPTION_UNAVAILABLE');
 const snapshot={productId,itemId,productName:p.name,optionName:item.name??p.name,region:p.countryCode??'GLOBAL',quantity,sourcePrice:item.price,sourceCurrency:item.currency,sourceFetchedAt:feed.fetchedAt,pricePolicy:'Fixed rehearsal price: 1 test USDC per unit. Not a conversion or real-product price.',delivery:'Non-redeemable test receipt; no stock reserved and no real top-up.'};
 const id=randomUUID();db.prepare('INSERT INTO catalog_test_quotes VALUES(?,?,?,?,?,?,?,?)').run(id,actor,requestId,fingerprint,JSON.stringify(snapshot),(TEST_UNIT_PRICE*BigInt(quantity)).toString(),now,now+300000);
 return getTestQuote(db,actor,id);
}
export function testDelivery(db:DB,actor:string,orderId:string,key:string){owner(actor);const d=db.prepare('SELECT * FROM catalog_test_deliveries WHERE order_id=? AND actor=?').get(orderId,actor) as {payload:string;created_at:number}|undefined;if(!d)throw Error('DELIVERY_NOT_FOUND');return {orderId,mode:'TESTNET_SIMULATED',nonRedeemable:true,supplierCalls:0,createdAt:d.created_at,...JSON.parse(decryptCode(d.payload,key))}}
export function confirmTestQuote(db:DB,actor:string,quoteId:string,requestId:string,acceptedAmountUnits:string,key:string,now=Date.now()){
 owner(actor);if(!/^[a-f0-9]{64}$/i.test(key))throw Error('DELIVERY_NOT_CONFIGURED');
 return db.transaction(()=>{
 const q=db.prepare('SELECT * FROM catalog_test_quotes WHERE id=? AND actor=?').get(quoteId,actor) as QuoteRow|undefined;if(!q)throw Error('QUOTE_NOT_FOUND');
 if(acceptedAmountUnits!==q.amount_units)throw Error('QUOTE_AMOUNT_MISMATCH');const fingerprint=fp({quoteId,acceptedAmountUnits,mode:'TESTNET_SIMULATED'});
 const previous=db.prepare('SELECT * FROM account_orders WHERE actor=? AND request_id=?').get(actor,requestId) as AccountOrder|undefined;
 if(previous){if(previous.fingerprint!==fingerprint)throw Error('IDEMPOTENCY_CONFLICT');return {order:previous,delivery:testDelivery(db,actor,previous.id,key),replayed:true}}
 const used=db.prepare('SELECT order_id FROM catalog_test_deliveries WHERE quote_id=? AND actor=?').get(quoteId,actor) as {order_id:string}|undefined;
 if(used)throw Error('QUOTE_ALREADY_CONFIRMED');if(now>=q.expires_at)throw Error('QUOTE_EXPIRED');
 const s=JSON.parse(q.snapshot),amount=BigInt(q.amount_units);if(amount<=0n||amount>10_000_000n)throw Error('TESTNET_ORDER_LIMIT');checkBudget(db,actor,amount);
 if(BigInt(funds(db,actor).availableUnits)<amount)throw Error('INSUFFICIENT_ACCOUNT_BALANCE');const id=randomUUID(),liability=(b:string)=>'account:usdc:'+actor+':'+b;
 postJournal(db,'account-reserve:'+id,'testnet-order:'+id,[{account:liability('available'),currency:'USDC',direction:'DEBIT',amount},{account:liability('reserved'),currency:'USDC',direction:'CREDIT',amount}]);
 postJournal(db,'account-capture:'+id,'testnet-simulated:'+id,[{account:liability('reserved'),currency:'USDC',direction:'DEBIT',amount},{account:'testnet:simulated-sales',currency:'USDC',direction:'CREDIT',amount}]);
 db.prepare("INSERT INTO account_orders VALUES(?,?,?,?,?,?,?,?,?,?,'SIMULATED_FULFILLED',?,?,?)").run(id,actor,requestId,fingerprint,'catalog-test:'+s.productId,s.productName+' · test delivery',s.region,'Shop',s.quantity,q.amount_units,'Portal','catalog-test:'+quoteId,now);
 const receipt={productName:s.productName,optionName:s.optionName,quantity:s.quantity,amountUnits:q.amount_units,codes:Array.from({length:s.quantity},()=> 'MCT-TEST-'+randomBytes(12).toString('hex').toUpperCase()),notice:'TEST ONLY. These artifacts cannot activate or redeem any product. No provider order, invoice or stock reservation was created.'};
 db.prepare('INSERT INTO catalog_test_deliveries VALUES(?,?,?,?,?)').run(id,quoteId,actor,encryptCode(JSON.stringify(receipt),key),now);
 db.prepare('INSERT INTO account_activity VALUES(?,?,?,?,?,?,?,?,?)').run(randomUUID(),actor,'Shop',(-amount).toString(),funds(db,actor).availableUnits,id,null,'Catalogue test delivery x'+s.quantity,now);
 return {order:db.prepare('SELECT * FROM account_orders WHERE id=? AND actor=?').get(id,actor) as AccountOrder,delivery:testDelivery(db,actor,id,key),replayed:false};
 })()
}
