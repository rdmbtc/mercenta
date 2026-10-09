/** Closed localhost-only service. Deliberately imports neither Testnet config nor any signer. */
import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import {MainnetStagingStore} from './services/mainnet-staging-store.js';
import {pathToFileURL} from 'node:url';
import {z} from 'zod';

export async function createMainnetStagingServer(path:string,testnetPath:string) {
  const store = new MainnetStagingStore(path,testnetPath);
  const app = Fastify({logger:false,bodyLimit:4096,trustProxy:false});
  await app.register(helmet);
  await app.register(rateLimit,{max:60,timeWindow:'1 minute'});
  app.addHook('onClose',async()=>store.close());
  app.get('/api/health',async(_req,reply)=>{const s=store.snapshot();return reply.code(s.integrity==='ok'?200:503).send({ok:s.integrity==='ok',service:'mercenta-mainnet-staging',...s});});
  app.get('/api/readiness',async()=>({phase:'closed',chainId:5042,purchasesEnabled:false,depositsEnabled:false,refundMode:'support-owner-manual',capabilities:{stagingDatabase:true,publicWriteRoutes:false,signer:false,supplyAdapter:false,paymentRoutes:false,deliveryRoutes:false},remaining:['PRODUCTION_OWNER_SESSION','VERIFIED_CUSTODY','SUPPLY_AND_PAYMENT_INTEGRATION','LIABILITY_JOURNAL_AND_RECONCILIATION','ENCRYPTED_DELIVERY','MANUAL_REFUND_RECEIPT','RESTORE_AND_ALERT_DRILLS','FRESH_OWNER_CANARY_APPROVAL']}));
  app.setNotFoundHandler((_req,reply)=>reply.code(503).send({code:'MAINNET_PAYMENTS_CLOSED',purchasesEnabled:false,message:'Payments are closed. Do not send funds. Contact support@mercenta.xyz for existing orders.'}));
  return app;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  // No .env auto-load and no operational credentials; accidental enable flags are rejected.
  for(const key of ['ENABLE_FULFILLMENT','MAINNET_PAYMENTS_ENABLED','ENABLE_DEPOSITS'])if(process.env[key] && process.env[key]!=='false')throw Error('CLOSED_STAGING_ONLY');
  const path=z.string().min(1).parse(process.env.MAINNET_STAGING_DATABASE);
  const testnet=z.string().min(1).parse(process.env.TESTNET_DATABASE_GUARD);
  const port=z.coerce.number().int().min(1024).max(65535).parse(process.env.MAINNET_STAGING_PORT??'3014');
  const app=await createMainnetStagingServer(path,testnet);
  await app.listen({host:'127.0.0.1',port});
  for(const signal of ['SIGINT','SIGTERM'] as const)process.on(signal,()=>{void app.close().then(()=>process.exit(0));});
}
