import {z} from 'zod';
export const refundInput=z.object({
 requestId:z.string().uuid(),email:z.email().max(254).transform(v=>v.toLowerCase()),
 orderReference:z.string().trim().min(3).max(100).regex(/^[A-Za-z0-9_.:/-]+$/),
 network:z.enum(['testnet','mainnet']),reason:z.enum(['NOT_DELIVERED','WRONG_ITEM','PAYMENT_ISSUE','OTHER']),
 details:z.string().trim().min(10).max(2000),transactionHash:z.string().regex(/^(0x[a-fA-F0-9]{64})?$/),
 manualReviewAcknowledged:z.literal(true),website:z.literal('')
}).strict();
export type RefundInput=z.infer<typeof refundInput>;
export function containsSupportSecret(text:string){
 return /-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:sk-|sk_live_|sk_test_)[a-zA-Z0-9_-]{12,}|\b(?:seed phrase|mnemonic|private key|api[_ -]?key|access[_ -]?token|password|пароль|сид фраза|приватный ключ)\s*[:=]\s*\S{6,}/i.test(text);
}
