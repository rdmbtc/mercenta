import type {FastifyInstance} from 'fastify';
import {z} from 'zod';
import type {DB} from '../db.js';import type {Config} from '../config.js';
import {accountActor} from './account.js';
import {cachedSupplierPreview} from '../services/supplier-preview.js';
import {initCatalogTestCheckout,createTestQuote,getTestQuote,confirmTestQuote,testDelivery} from '../services/catalog-test-checkout.js';
export function registerCatalogTestCheckout(app:FastifyInstance,db:DB,c:Config){initCatalogTestCheckout(db);
 app.post('/api/account/catalog-checkout/quote',async req=>{const actor=accountActor(req,c);const b=z.object({requestId:z.string().uuid(),productId:z.string().min(1).max(100),itemId:z.string().min(1).max(100),quantity:z.number().int().min(1).max(10)}).strict().parse(req.body);if(!c.DELIVERY_ENCRYPTION_KEY)throw Error('DELIVERY_NOT_CONFIGURED');return createTestQuote(db,actor,b.requestId,b.productId,b.itemId,b.quantity,await cachedSupplierPreview(c))});
 app.get('/api/account/catalog-checkout/quotes/:id',req=>getTestQuote(db,accountActor(req,c),z.object({id:z.string().uuid()}).parse(req.params).id));
 app.post('/api/account/catalog-checkout/confirm',req=>{const actor=accountActor(req,c),b=z.object({quoteId:z.string().uuid(),requestId:z.string().uuid(),acceptedAmountUnits:z.string().regex(/^[1-9][0-9]{0,7}$/),mode:z.literal('TESTNET_SIMULATED'),confirmNonRedeemable:z.literal(true)}).strict().parse(req.body);return confirmTestQuote(db,actor,b.quoteId,b.requestId,b.acceptedAmountUnits,c.DELIVERY_ENCRYPTION_KEY??'')});
 app.get('/api/account/orders/:id/delivery',req=>testDelivery(db,accountActor(req,c),z.object({id:z.string().uuid()}).parse(req.params).id,c.DELIVERY_ENCRYPTION_KEY??''));
}
