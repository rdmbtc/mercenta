import {timingSafeEqual} from 'node:crypto';
import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';

const PORT = 3016;
const DB_PATH = '/var/lib/mercenta/mainnet_fulfillment.sqlite';
const ARC_RPC = 'https://rpc.mainnet.arc.io';
const SETTLEMENT_VAULT = '0x58863e4a739da0e62c2eba258b7783e95d5c48ce';
const SUPPLIER_API_URL = process.env.SUPPLIER_API_URL || 'https://api.settlement-provider.internal/v1';
const SUPPLIER_API_KEY = readFileSync('/etc/mercenta/retail-supplier-key','utf8').trim();
const PROXY_KEY = readFileSync('/etc/mercenta/retail-proxy-key','utf8').trim();
if(PROXY_KEY.length < 32) throw new Error('RETAIL_PROXY_NOT_CONFIGURED');

if (!existsSync('/var/lib/mercenta')) {
  mkdirSync('/var/lib/mercenta', { recursive: true });
}

const db = new DatabaseSync(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS fulfilled_orders (
    tx_hash TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    reference_id TEXT NOT NULL,
    wallet TEXT NOT NULL,
    product_name TEXT,
    option_name TEXT,
    denomination_id TEXT NOT NULL,
    amount_usdc TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    codes_json TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_wallet ON fulfilled_orders(wallet);
`);

// Existing historical rows are retained; never embed or reseed redeemable codes.
db.exec('CREATE TABLE IF NOT EXISTS retail_claims (tx_hash TEXT PRIMARY KEY, wallet TEXT NOT NULL, claimed_at INTEGER NOT NULL)');

async function verifyArcTransaction(txHash) {
  const receiptRes = await fetch(ARC_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getTransactionReceipt',
      params: [txHash]
    })
  });
  const receiptData = await receiptRes.json();
  const receipt = receiptData?.result;
  if (!receipt || receipt.status !== '0x1') {
    throw new Error('TRANSACTION_NOT_CONFIRMED_ON_CHAIN');
  }

  const txRes = await fetch(ARC_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'eth_getTransactionByHash',
      params: [txHash]
    })
  });
  const txData = await txRes.json();
  const tx = txData?.result;
  if (!tx || tx.to?.toLowerCase() !== SETTLEMENT_VAULT.toLowerCase()) {
    throw new Error('TRANSACTION_RECIPIENT_MISMATCH');
  }

  return { from: tx.from?.toLowerCase(), value: tx.value };
}

async function supplierRequest(path, method = 'GET', body = null) {
  const url = `${SUPPLIER_API_URL}${path}`;
  const headers = {
    'X-API-Key': SUPPLIER_API_KEY,
    'Accept': 'application/json',
    'User-Agent': 'Mercenta-Settlement-Node/1.0'
  };
  let bodyStr = null;
  if (body) {
    headers['Content-Type'] = 'application/json';
    bodyStr = JSON.stringify(body);
  }
  const r = await fetch(url, { method, headers, body: bodyStr });
  if (!r.ok) {
    const errorBody = await r.text().catch(() => '');
    console.error(`Supplier error [${r.status}]:`, errorBody);
    throw new Error(`SUPPLIER_HTTP_${r.status}`);
  }
  return r.json();
}

async function executeProcurement(referenceId, denominationId, quantity = 1, productType = 'voucher', accountReference = '', productName = '') {
  const isDtu = productType === 'direct_topup'
    || Boolean(accountReference)
    || (productName && productName.toLowerCase().includes('telegram'))
    || denominationId === '7295df4e-6fb0-4dfb-b962-ded3d073bc03'
    || denominationId === '03b360c1-02e0-495b-ba2a-146e5116aa74';

  const fields = [];
  let cleanRef = '';
  if (isDtu && accountReference) {
    cleanRef = accountReference.replace(/^https?:\/\/t\.me\//, '').replace(/^@/, '').trim();
    const isTelegramOrCustom = (productName && productName.toLowerCase().includes('telegram'))
      || denominationId === '7295df4e-6fb0-4dfb-b962-ded3d073bc03'
      || denominationId === '03b360c1-02e0-495b-ba2a-146e5116aa74'
      || (productName && productName.toLowerCase().includes('custom'));

    const fieldKey = isTelegramOrCustom ? 'account_reference' : 'account_number';
    fields.push({ key: fieldKey, value: cleanRef });
    if (isTelegramOrCustom && (denominationId === '7295df4e-6fb0-4dfb-b962-ded3d073bc03' || (productName && productName.toLowerCase().includes('custom')))) {
      fields.push({ key: 'amount', value: '50' });
    }
  }

  const orderPayload = {
    ordersType: isDtu ? 'dtu' : 'shop',
    referenceId,
    orders: [
      {
        denominationId,
        quantity,
        isLongOrder: false,
        fields
      }
    ]
  };

  // Do not log recipient identifiers or provider payloads.
  const createRes = await supplierRequest('/orders', 'POST', orderPayload);
  let orderId = createRes?.data?.orderId || createRes?.data?.id;

  // Poll for status
  for (let attempt = 0; attempt < 10; attempt++) {
    await new Promise(r => setTimeout(r, 2000));
    const statusRes = await supplierRequest(`/orders?referenceId=${referenceId}&unhide=true`);
    const items = statusRes?.data?.page?.items || [];
    if (items.length > 0) {
      const order = items[0];
      orderId = orderId || order.orderId;
      if (order.status === 'SUCCESS') {
        if (isDtu) {
          return { orderId, codes: [`TOPUP_CREDITED:@${cleanRef || 'account'}`] };
        }
        if (Array.isArray(order.vouchers) && order.vouchers.length > 0) {
          const codes = order.vouchers.map(v => v.pin).filter(Boolean);
          if (codes.length > 0) {
            return { orderId, codes };
          }
        }
      }
      if (order.status === 'CANCELLED') {
        throw new Error('SUPPLIER_ORDER_CANCELLED');
      }
    }
  }

  throw new Error('SUPPLIER_ORDER_TIMEOUT');
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  res.setHeader('Cache-Control','no-store');
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let authenticatedWallet=null;
  if(url.pathname === '/orders' || url.pathname === '/fulfill'){
    const given=Buffer.from(String(req.headers['x-mercenta-retail-proxy']||''));
    const expected=Buffer.from(PROXY_KEY);
    authenticatedWallet=String(req.headers['x-mercenta-wallet']||'').toLowerCase();
    if(given.length!==expected.length || !timingSafeEqual(given,expected) || !/^0x[a-f0-9]{40}$/.test(authenticatedWallet)){
      res.writeHead(401,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'SIGN_IN_REQUIRED'}));return;
    }
  }

  if (url.pathname === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, service: 'mercenta-mainnet-fulfillment', time: Date.now() }));
    return;
  }

  if (url.pathname === '/orders' && req.method === 'GET') {
    const wallet = authenticatedWallet;
    const selected=url.searchParams.get('wallet');
    if(selected && selected.toLowerCase()!==wallet){res.writeHead(403);res.end();return;}
    const rows = db.prepare('SELECT * FROM fulfilled_orders WHERE LOWER(wallet) = ? ORDER BY created_at DESC LIMIT 100').all(wallet);
    const formatted = rows.map(r => ({
      ...r,
      codes: JSON.parse(r.codes_json || '[]')
    }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ orders: formatted }));
    return;
  }

  if (url.pathname === '/fulfill' && req.method === 'POST') {
    let body = '';
    let bodySize=0;
    req.on('data', chunk => {bodySize+=chunk.length;if(bodySize<=8192)body+=chunk;});
    req.on('end', async () => {
      try {
        if(bodySize>8192){res.writeHead(413);res.end();return;}
        const data = JSON.parse(body);
        const {
          txHash,
          wallet,
          denominationId,
          quantity = 1,
          productName = 'Digital Goods Voucher',
          optionName = 'Standard',
          productType = 'voucher',
          accountReference = '',
          expectedAmountUnits
        } = data;

        if (!txHash || !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'INVALID_TX_HASH' }));
          return;
        }

        if(wallet?.toLowerCase()!==authenticatedWallet || !Number.isSafeInteger(quantity) || quantity<1 || quantity>100 || typeof denominationId!=='string' || denominationId.length<1 || denominationId.length>200 || typeof expectedAmountUnits!=='string' || !/^\d{1,20}$/.test(expectedAmountUnits) || BigInt(expectedAmountUnits)<=0n){res.writeHead(400);res.end();return;}
        // Check DB for existing delivery
        const row = db.prepare('SELECT * FROM fulfilled_orders WHERE LOWER(tx_hash) = LOWER(?)').get(txHash);
        if (row) {
          if(row.wallet.toLowerCase()!==authenticatedWallet){res.writeHead(403);res.end();return;}
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            orderId: row.order_id,
            codes: JSON.parse(row.codes_json || '[]'),
            status: row.status,
            alreadyDelivered: true
          }));
          return;
        }

        // Verify on Arc Mainnet
        const { from, value } = await verifyArcTransaction(txHash);

        if(from!==authenticatedWallet){res.writeHead(403);res.end();return;}
        const paid=BigInt(value);
        if(paid < BigInt(expectedAmountUnits)*1_000_000_000_000n){res.writeHead(409);res.end(JSON.stringify({error:'INSUFFICIENT_PAYMENT'}));return;}
        // Durable fail-closed claim before supplier side effects. Timeout does not unlock it.
        const claimed=db.prepare('INSERT OR IGNORE INTO retail_claims(tx_hash,wallet,claimed_at) VALUES(?,?,?)').run(txHash.toLowerCase(),authenticatedWallet,Date.now());
        if(claimed.changes!==1){res.writeHead(409);res.end(JSON.stringify({error:'DELIVERY_REQUIRES_RECONCILIATION'}));return;}
        // Procurement reference
        const ref = 'mct_' + txHash.slice(2, 34);
        const denom = denominationId;

        // Execute supplier procurement
        const { orderId, codes } = await executeProcurement(ref, denom, quantity, productType, accountReference, productName);

        const units=BigInt(value)/1_000_000_000_000n;
        const usdcAmount=(units/1_000_000n).toString()+'.'+(units%1_000_000n).toString().padStart(6,'0');

        // Save order to SQLite
        db.prepare(`
          INSERT INTO fulfilled_orders (
            tx_hash, order_id, reference_id, wallet, product_name, option_name,
            denomination_id, amount_usdc, quantity, codes_json, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          txHash,
          orderId,
          ref,
          wallet?.toLowerCase() || from,
          productName,
          optionName,
          denom,
          usdcAmount,
          quantity,
          JSON.stringify(codes),
          'DELIVERED',
          Date.now()
        );

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          orderId,
          codes,
          status: 'DELIVERED'
        }));
      } catch (err) {
        console.error('Fulfillment requires reconciliation');
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'FULFILLMENT_REQUIRES_RECONCILIATION' }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'NOT_FOUND' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Mainnet fulfillment service running on 127.0.0.1:${PORT}`);
});
