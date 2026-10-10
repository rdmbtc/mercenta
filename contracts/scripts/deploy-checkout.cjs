const fs = require('fs');
const path = require('path');
const { createPublicClient, createWalletClient, http, defineChain } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

const arcMainnet = defineChain({
  id: 5042,
  name: 'Arc Mainnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.mainnet.arc.io'] },
    public: { http: ['https://rpc.mainnet.arc.io'] }
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://arcscan.app' }
  }
});

async function main() {
  const unsignedPath = path.join(__dirname, '../mainnet-checkout.unsigned.json');
  if (!fs.existsSync(unsignedPath)) {
    throw new Error('mainnet-checkout.unsigned.json not found. Run prepare-checkout-deployment.cjs first.');
  }

  const unsigned = JSON.parse(fs.readFileSync(unsignedPath, 'utf8'));
  const req = unsigned.request;

  const privKey = process.env.DEPLOYER_KEY || process.env.PRIVATE_KEY;
  if (!privKey) {
    console.error('\n[ERROR] DEPLOYER_KEY environment variable is required.');
    console.error('Usage:');
    console.error('  $env:DEPLOYER_KEY="0x..." ; node scripts/deploy-checkout.cjs\n');
    process.exit(1);
  }

  const account = privateKeyToAccount(privKey.startsWith('0x') ? privKey : `0x${privKey}`);
  if (account.address.toLowerCase() !== req.from.toLowerCase()) {
    throw new Error(`Key address mismatch: key corresponds to ${account.address}, expected deployer ${req.from}`);
  }

  const publicClient = createPublicClient({ chain: arcMainnet, transport: http() });
  const walletClient = createWalletClient({ account, chain: arcMainnet, transport: http() });

  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`\nDeployer: ${account.address}`);
  console.log(`Native balance: ${Number(balance) / 1e18} USDC`);

  if (balance < 50000000000000000n) { // 0.05 USDC
    throw new Error('Insufficient balance for gas. At least 0.05 USDC is required.');
  }

  console.log('Broadcasting MercentaCheckout deployment transaction to Arc Mainnet...');
  const hash = await walletClient.sendTransaction({
    data: req.data,
    value: 0n
  });
  console.log(`Transaction sent! Tx Hash: ${hash}`);
  console.log('Waiting for confirmation on Arc Mainnet...');

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== 'success') {
    throw new Error(`Deployment transaction reverted: ${hash}`);
  }

  const contractAddress = receipt.contractAddress;
  console.log('\n======================================================');
  console.log(' SUCCESS: MercentaCheckout deployed on Arc Mainnet!');
  console.log(` Contract Address : ${contractAddress}`);
  console.log(` Transaction Hash : ${hash}`);
  console.log(` Block Number     : ${receipt.blockNumber}`);
  console.log(` Gas Used         : ${receipt.gasUsed.toString()}`);
  console.log('======================================================\n');

  const record = {
    address: contractAddress,
    chainId: 5042,
    network: 'Arc Mainnet',
    deployer: account.address,
    deployTx: hash,
    deployedAt: new Date().toISOString(),
    sourceSha256: unsigned.sourceSha256,
    explorer: `https://arcscan.app/address/${contractAddress}`,
    limits: {
      maxOrderMicro: '5000000000',
      dailyVolumeCapMicro: '100000000000'
    },
    startsPaused: true,
    salesUnpaused: false
  };

  const outPath = path.join(__dirname, '../deployment.arc-mainnet.json');
  fs.writeFileSync(outPath, JSON.stringify(record, null, 2) + '\n');
  console.log(`Saved deployment manifest to: ${outPath}`);
}

main().catch(err => {
  console.error('\nDeployment failed:', err.message);
  process.exit(1);
});
