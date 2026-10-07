import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { openDb } from '../src/db.js';
import {
  CircleDemoSeller,
  DEMO_SERVICE_ID,
  DEMO_SERVICE_URL,
  DEMO_AMOUNT,
  AUTH_TYPES,
  sellerRequirements,
  type SellerPorts
} from '../src/services/circle-demo-seller.js';
import { CHAIN, NETWORK, type AgentConfig } from '../src/services/circle-policy.js';

const recipient = ('0x' + '3'.repeat(40)) as `0x${string}`;
const testAccount = privateKeyToAccount(generatePrivateKey());
const wallet = testAccount.address.toLowerCase();

const baseConfig: AgentConfig = {
  provider: 'local-eoa',
  walletAddress: wallet,
  ownerWallet: wallet,
  privateKeyPath: 'unused-test-only',
  enabled: true,
  services: [
    {
      id: DEMO_SERVICE_ID,
      url: DEMO_SERVICE_URL,
      payTo: recipient,
      maxAmountUnits: DEMO_AMOUNT
    }
  ]
};

async function createSignedHeader(
  customAuth: Partial<{
    from: string;
    to: string;
    value: string;
    validAfter: string;
    validBefore: string;
    nonce: string;
  }> = {},
  domainOverride?: {
    name?: string;
    version?: string;
    chainId?: number;
    verifyingContract?: `0x${string}`;
  },
  tamperSignature = false,
  networkOverride = NETWORK
) {
  const nowSec = Math.floor(Date.now() / 1000);
  const auth = {
    from: wallet,
    to: recipient,
    value: DEMO_AMOUNT,
    validAfter: '0',
    validBefore: String(nowSec + 604900), // Standard seller window
    nonce: ('0x' + 'a'.repeat(64)) as `0x${string}`,
    ...customAuth
  };

  const domain = {
    name: domainOverride?.name ?? 'GatewayWalletBatched',
    version: domainOverride?.version ?? '1',
    chainId: domainOverride?.chainId ?? 5042002,
    verifyingContract: domainOverride?.verifyingContract ?? (CHAIN.gatewayWallet as `0x${string}`)
  };

  let signed = await testAccount.signTypedData({
    domain,
    types: AUTH_TYPES,
    primaryType: 'TransferWithAuthorization',
    message: {
      from: auth.from as `0x${string}`,
      to: auth.to as `0x${string}`,
      value: BigInt(auth.value),
      validAfter: BigInt(auth.validAfter),
      validBefore: BigInt(auth.validBefore),
      nonce: auth.nonce as `0x${string}`
    }
  });

  if (tamperSignature) {
    signed = ('0x' + '9'.repeat(130)) as `0x${string}`;
  }

  const req = sellerRequirements(recipient);
  req.network = networkOverride;

  const envelope = {
    x402Version: 2,
    accepted: req,
    resource: { url: DEMO_SERVICE_URL },
    payload: {
      signature: signed,
      authorization: auth
    }
  };

  return Buffer.from(JSON.stringify(envelope)).toString('base64');
}

function makeFixture() {
  const db = openDb(':memory:');
  let settlements = 0;
  let lookups = 0;

  const ports: SellerPorts = {
    writable: () => true,
    settle: async () => {
      settlements++;
      return {
        success: true,
        network: NETWORK,
        payer: wallet,
        transaction: randomUUID()
      };
    },
    lookup: async () => {
      lookups++;
      return [];
    }
  };

  const seller = new CircleDemoSeller(db, recipient, () => baseConfig, ports);
  return {
    db,
    ports,
    seller,
    counts: () => ({ settlements, lookups })
  };
}

test('AGENT-02: Cryptographic Protocol Security - Valid control accepted exactly once', async () => {
  const f = makeFixture();
  const header = await createSignedHeader();

  const res1 = await f.seller.handle(header);
  assert.equal(res1.status, 200);
  assert.equal(f.counts().settlements, 1);

  // Subsequent call with exact same header uses cached receipt, does NOT settle again
  const res2 = await f.seller.handle(header);
  assert.equal(res2.status, 200);
  assert.equal(f.counts().settlements, 1);

  f.db.close();
});

test('AGENT-02: Rejects expired authorization (validBefore in past)', async () => {
  const f = makeFixture();
  const pastSec = Math.floor(Date.now() / 1000) - 300;
  const header = await createSignedHeader({
    validBefore: String(pastSec),
    nonce: ('0x' + 'b'.repeat(64)) as `0x${string}`
  });

  const res = await f.seller.handle(header);
  assert.equal(res.status, 400);
  assert.equal(f.counts().settlements, 0);

  f.db.close();
});

test('AGENT-02: Rejects not-yet-valid authorization (validAfter in future)', async () => {
  const f = makeFixture();
  const futureSec = Math.floor(Date.now() / 1000) + 3600;
  const header = await createSignedHeader({
    validAfter: String(futureSec),
    nonce: ('0x' + 'c'.repeat(64)) as `0x${string}`
  });

  const res = await f.seller.handle(header);
  assert.equal(res.status, 400);
  assert.equal(f.counts().settlements, 0);

  f.db.close();
});

test('AGENT-02: Rejects TTL policy overflow (validBefore exceeds max allowed span)', async () => {
  const f = makeFixture();
  const wayFutureSec = Math.floor(Date.now() / 1000) + 900000;
  const header = await createSignedHeader({
    validBefore: String(wayFutureSec),
    nonce: ('0x' + 'd'.repeat(64)) as `0x${string}`
  });

  const res = await f.seller.handle(header);
  assert.equal(res.status, 400);
  assert.equal(f.counts().settlements, 0);

  f.db.close();
});

test('AGENT-02: Rejects altered payment amount or recipient address', async () => {
  const f = makeFixture();

  // Tampered value (asking for more or less than DEMO_AMOUNT)
  const headerWrongValue = await createSignedHeader({
    value: '2000',
    nonce: ('0x' + 'e'.repeat(64)) as `0x${string}`
  });
  const resVal = await f.seller.handle(headerWrongValue);
  assert.equal(resVal.status, 400);
  assert.equal(f.counts().settlements, 0);

  // Wrong recipient address
  const attackerAddr = '0x' + '4'.repeat(40);
  const headerWrongRecipient = await createSignedHeader({
    to: attackerAddr,
    nonce: ('0x' + 'f'.repeat(64)) as `0x${string}`
  });
  const resTo = await f.seller.handle(headerWrongRecipient);
  assert.equal(resTo.status, 400);
  assert.equal(f.counts().settlements, 0);

  f.db.close();
});

test('AGENT-02: Rejects domain/chain mismatch (wrong chain ID)', async () => {
  const f = makeFixture();
  const headerWrongChain = await createSignedHeader(
    { nonce: ('0x' + '1'.repeat(64)) as `0x${string}` },
    { chainId: 1 } // Ethereum Mainnet instead of Arc Testnet 5042002
  );

  const res = await f.seller.handle(headerWrongChain);
  assert.equal(res.status, 400);
  assert.equal(f.counts().settlements, 0);

  f.db.close();
});

test('AGENT-02: Rejects tampered cryptographic signature', async () => {
  const f = makeFixture();
  const headerTampered = await createSignedHeader(
    { nonce: ('0x' + '2'.repeat(64)) as `0x${string}` },
    undefined,
    true
  );

  const res = await f.seller.handle(headerTampered);
  assert.equal(res.status, 400);
  assert.equal(f.counts().settlements, 0);

  f.db.close();
});

test('AGENT-02: Nonce replay with modified payload is rejected without settlement', async () => {
  const f = makeFixture();
  const replayNonce = ('0x' + '7'.repeat(64)) as `0x${string}`;

  // First valid execution
  const header1 = await createSignedHeader({ nonce: replayNonce });
  const res1 = await f.seller.handle(header1);
  assert.equal(res1.status, 200);
  assert.equal(f.counts().settlements, 1);

  // Second execution with SAME nonce but different amount
  const header2 = await createSignedHeader({
    nonce: replayNonce,
    value: '5000'
  });
  const res2 = await f.seller.handle(header2);
  assert.ok(res2.status === 400 || res2.status === 409);
  // Crucially: settlement count MUST remain exactly 1!
  assert.equal(f.counts().settlements, 1);

  f.db.close();
});
