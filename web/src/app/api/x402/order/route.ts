import { NextResponse } from 'next/server';
import { createHash, randomBytes } from 'node:crypto';
import { createPublicClient, http, type Hash } from 'viem';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

const ARC_MAINNET_ROUTER = '0x06b67adf8d63c8c35a6beda42a3bb93d485af3ed' as const;
const ARC_MAINNET_USDC = '0x3600000000000000000000000000000000000000' as const;
const ARC_MAINNET_RPC = 'https://rpc.arc.io';

const arcClient = createPublicClient({
  transport: http(ARC_MAINNET_RPC, { timeout: 8000, retryCount: 1 })
});

const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const topicAddress = (topic: string) => ('0x' + topic.slice(26)).toLowerCase();

interface OrderPayload {
  productId?: string;
  orderId?: string;
  txHash?: string;
  recipient?: string;
  quantity?: number;
}

export async function POST(req: Request) {
  try {
    const headerTx = req.headers.get('x-payment-tx');
    const headerOrderId = req.headers.get('x-payment-orderid');

    let body: OrderPayload = {};
    const raw = await req.text();
    if (raw.length > 8192)
      return NextResponse.json({ error: 'BODY_TOO_LARGE' }, { status: 413 });
    try {
      const parsed: unknown = raw ? JSON.parse(raw) : {};
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) body = parsed as OrderPayload;
    } catch {
      // Payment fields may arrive entirely in headers.
    }

    const txHash = (headerTx || body.txHash || '').trim();
    const orderId = (headerOrderId || body.orderId || ('0x' + randomBytes(32).toString('hex'))).toLowerCase();
    const productId = (body.productId || 'gaming-steam-voucher').toLowerCase();
    const quantity = Math.max(1, Math.min(10, Math.trunc(Number(body.quantity) || 1)));

    // Pricing calculation (in 6-decimal USDC)
    const basePrices: Record<string, bigint | undefined> = {
      'gaming-steam-voucher': 5_000000n, // 5.00 USDC
      'telegram-stars-100': 1_990000n,    // 1.99 USDC
      'roblox-voucher': 4_990000n,        // 4.99 USDC
      'spotify-subscription': 4_500000n,  // 4.50 USDC
      'developer-api-tokens': 6_000000n   // 6.00 USDC
    };

    const unitPriceUnits = basePrices[productId];
    if (unitPriceUnits === undefined)
      return NextResponse.json({ error: 'UNKNOWN_PRODUCT' }, { status: 400 });
    const totalAmountUnits = unitPriceUnits * BigInt(quantity);
    const amountUsdcFormatted = (Number(totalAmountUnits) / 1e6).toFixed(6);

    // CASE 1: No payment proof provided -> Return HTTP 402 Payment Required
    if (!txHash) {
      const challengeNonce = randomBytes(16).toString('hex');
      const expiresAt = new Date(Date.now() + 600000).toISOString();

      const challenge = {
        error: 'Payment Required',
        protocol: 'x402',
        challenge: {
          orderId,
          productId,
          productReference: `Mercenta:${productId}:q${quantity}`,
          amountUnits: totalAmountUnits.toString(),
          amountUsdc: amountUsdcFormatted,
          currency: 'USDC',
          chainId: 5042,
          chainName: 'Arc Mainnet',
          recipient: ARC_MAINNET_ROUTER,
          tokenAddress: ARC_MAINNET_USDC,
          challengeNonce,
          expiresAt,
          instructions: `Transfer exactly ${amountUsdcFormatted} USDC to ${ARC_MAINNET_ROUTER} on Arc Mainnet, then repeat POST with header 'X-Payment-Tx: <txHash>' and 'X-Payment-OrderId: ${orderId}'.`
        }
      };

      return NextResponse.json(challenge, {
        status: 402,
        headers: {
          'WWW-Authenticate': `X402 realm="Mercenta on Arc Mainnet", token="${ARC_MAINNET_USDC}", amount="${totalAmountUnits}", recipient="${ARC_MAINNET_ROUTER}"`,
          'X-Payment-Protocol': 'x402',
          'X-Payment-Recipient': ARC_MAINNET_ROUTER,
          'X-Payment-Chain': '5042',
          'X-Payment-Token': ARC_MAINNET_USDC,
          'X-Payment-Amount': totalAmountUnits.toString()
        }
      });
    }

    // CASE 2: Payment proof provided -> verify on-chain before any delivery.
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return NextResponse.json({ error: 'INVALID_TX_HASH', message: 'Transaction hash format is invalid.' }, { status: 400 });
    }

    let receipt;
    try {
      receipt = await arcClient.getTransactionReceipt({ hash: txHash as Hash });
    } catch {
      // Pending or unknown hash: never deliver against an unconfirmed payment.
      return NextResponse.json({ error: 'PAYMENT_PENDING', message: 'Transaction is not mined yet; retry later.' }, { status: 202 });
    }

    if (receipt.status !== 'success') {
      return NextResponse.json({ error: 'TRANSACTION_REVERTED', message: 'On-chain transaction execution failed.' }, { status: 402 });
    }

    const txTarget = (receipt.to ?? '').toLowerCase();
    // An ERC-20 transfer targets the token; a router-mediated payment targets the router.
    if (txTarget !== ARC_MAINNET_USDC && txTarget !== ARC_MAINNET_ROUTER) {
      return NextResponse.json({ error: 'PAYMENT_RECIPIENT_MISMATCH' }, { status: 402 });
    }

    // Settle only on the exact USDC transfer this challenge priced, addressed to the router.
    const transfer = receipt.logs.find((log) => {
      if (log.address.toLowerCase() !== ARC_MAINNET_USDC) return false;
      if (log.topics[0] !== TRANSFER_TOPIC || !log.topics[1] || !log.topics[2]) return false;
      if (topicAddress(log.topics[2]) !== ARC_MAINNET_ROUTER) return false;
      return log.data.length === 66 && BigInt(log.data) === totalAmountUnits;
    });

    if (!transfer) {
      return NextResponse.json({ error: 'PAYMENT_AMOUNT_MISMATCH', expectedUnits: totalAmountUnits.toString() }, { status: 402 });
    }

    const payer = topicAddress(transfer.topics[1]!);
    const codeDigest = createHash('sha256').update(orderId + ':' + txHash.toLowerCase()).digest('hex');
    const voucherCode = 'MCT-ARC-' + codeDigest.slice(0, 4).toUpperCase() + '-' + codeDigest.slice(4, 8).toUpperCase() + '-' + codeDigest.slice(8, 12).toUpperCase();
    const receiptId = 'RCPT-' + createHash('sha256').update(orderId + txHash.toLowerCase()).digest('hex').slice(0, 16);

    // Durable single-use claim on the payment hash (orders.payment_tx_hash is UNIQUE).
    const now = Date.now();
    try {
      getDb().prepare(
        'INSERT INTO orders (id, product_id, customer_wallet, sale_amount_usdc_units, status, payment_tx_hash, delivery_status, expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(orderId, productId, payer, Number(totalAmountUnits), 'FULFILLED', txHash.toLowerCase(), 'DELIVERED', now + 3600000, now, now);
    } catch (claimErr) {
      const msg = (claimErr as Error).message;
      if (msg.includes('payment_tx_hash'))
        return NextResponse.json({ error: 'PAYMENT_ALREADY_SETTLED' }, { status: 409 });
      if (msg.includes('orders.id'))
        return NextResponse.json({ error: 'ORDER_ID_CONFLICT' }, { status: 409 });
      throw claimErr;
    }

    return NextResponse.json({
      status: 'fulfilled',
      protocol: 'x402',
      orderId,
      txHash,
      receiptId,
      product: productId,
      payer,
      amountUsdc: amountUsdcFormatted,
      settlement: {
        network: 'Arc Mainnet',
        chainId: 5042,
        currency: 'USDC',
        blockNumber: Number(receipt.blockNumber),
        recipient: ARC_MAINNET_ROUTER,
        verifiedTransfer: true
      },
      itemCode: voucherCode,
      delivery: {
        type: 'local_reference_code',
        payload: voucherCode,
        instructions: 'Locally derived reference for this verified on-chain payment. Not a supplier-issued voucher.'
      },
      confirmedAt: new Date().toISOString()
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Payment verification failed.' },
      { status: 500 }
    );
  }
}
