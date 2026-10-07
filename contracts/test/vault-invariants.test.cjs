const { test } = require('node:test');
const assert = require('node:assert/strict');
const ganache = require('ganache');
const { createPublicClient, createWalletClient, custom, keccak256, toHex } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const V = require('../artifacts/MercentaProfitVault.json');
const T = require('../artifacts/MockUSDC.json');

const TOKEN = '0x3600000000000000000000000000000000000000';
const CHAIN_ID = 5042002;

test('AGENT-06: Vault Invariants - Isolation, boundaries, conservation and design limits', async () => {
  const provider = ganache.provider({
    chain: { chainId: CHAIN_ID },
    logging: { quiet: true }
  });

  try {
    const p = createPublicClient({ transport: custom(provider) });
    const accounts = await provider.request({ method: 'eth_accounts', params: [] });
    const chain = {
      id: CHAIN_ID,
      name: 'Arc Testnet Local',
      nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
      rpcUrls: { default: { http: [] } }
    };

    const wallets = accounts.slice(0, 3).map(a =>
      createWalletClient({
        account: privateKeyToAccount(provider.getInitialAccounts()[a].secretKey),
        chain,
        transport: custom(provider)
      })
    );

    await provider.request({ method: 'evm_setAccountCode', params: [TOKEN, T.deployedBytecode] });

    const r = await p.waitForTransactionReceipt({
      hash: await wallets[0].deployContract({ abi: V.abi, bytecode: V.bytecode })
    });
    const vault = r.contractAddress;

    const tx = async (address, abi, fn, args = [], index = 0) => {
      const receipt = await p.waitForTransactionReceipt({
        hash: await wallets[index].writeContract({ address, abi, functionName: fn, args })
      });
      assert.equal(receipt.status, 'success');
      return receipt;
    };

    const read = (fn, args = []) => p.readContract({ address: vault, abi: V.abi, functionName: fn, args });
    const reject = (fn, args, index = 0) =>
      assert.rejects(p.simulateContract({ account: accounts[index], address: vault, abi: V.abi, functionName: fn, args }));

    for (let i = 0; i < 3; i++) {
      await tx(TOKEN, T.abi, 'mint', [accounts[i], 1000000000n]);
    }

    const defaultTaps = [1000, 2500, 2500, 4000];
    const createSale = (label, gross = 100000n) => [
      keccak256(toHex(label)),
      gross,
      70000n,
      1000n,
      1000n,
      defaultTaps,
      500
    ];

    // 1. Isolation & Cross-owner withdrawal rejection
    await tx(TOKEN, T.abi, 'approve', [vault, 1000000n], 0);
    await tx(vault, V.abi, 'settleSale', createSale('seller0-sale'), 0);

    await tx(TOKEN, T.abi, 'approve', [vault, 1000000n], 1);
    await tx(vault, V.abi, 'settleSale', createSale('seller1-sale'), 1);

    await reject('withdrawBucket', [0, 70000n], 2);
    const s0Restock = await read('buckets', [accounts[0], 0]);
    assert.equal(s0Restock, 70000n);
    await reject('claimProfit', [1], 2);

    // 2. Arithmetic boundaries
    await reject('settleSale', [
      keccak256(toHex('too-big')),
      10000001n, // > MAX_SALE
      7000000n,
      100000n,
      100000n,
      defaultTaps,
      500
    ], 0);

    await reject('settleSale', [
      '0x' + '0'.repeat(64),
      100000n,
      70000n,
      1000n,
      1000n,
      defaultTaps,
      500
    ], 0);

    // 3. Balance and liability conservation
    const vaultTokenBal = await p.readContract({
      address: TOKEN,
      abi: T.abi,
      functionName: 'balanceOf',
      args: [vault]
    });

    let sumLiabilities = (await read('profitTotal', [accounts[0]])) + (await read('profitTotal', [accounts[1]]));
    for (let b = 0; b < 6; b++) {
      sumLiabilities += (await read('buckets', [accounts[0], b])) + (await read('buckets', [accounts[1], b]));
    }
    assert.equal(vaultTokenBal, 200000n);
    assert.equal(sumLiabilities, 200000n);

    // 4. Confirm absent pause/unpause API
    const hasPause = V.abi.some(item => item.name === 'pause' || item.name === 'unpause');
    assert.equal(hasPause, false, 'Profit vault is intentionally non-upgradeable and unpaused');
  } finally {
    await provider.disconnect();
  }
});
