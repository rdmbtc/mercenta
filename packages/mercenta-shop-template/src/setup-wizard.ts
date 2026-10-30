import * as readline from 'node:readline';
import * as fs from 'node:fs';
import * as path from 'node:path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string, defaultValue: string = ''): Promise<string> {
  return new Promise((resolve) => {
    const prompt = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;
    rl.question(prompt, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

async function runWizard() {
  console.log('\n======================================================');
  console.log('   🚀 MERCENTA TURNKEY TELEGRAM SHOP BUILDER');
  console.log('   Launch your automated digital store in 2 minutes');
  console.log('======================================================\n');

  const configPath = path.join(__dirname, '../shop.config.json');
  let currentConfig: Record<string, any> = {};
  try {
    currentConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {}

  const shopName = await ask('1. Store Name', currentConfig.shop?.name || 'My Cyber Store');
  const tagline = await ask('2. Store Tagline', currentConfig.shop?.tagline || 'Instant Gaming & Subscription Keys');
  const markupStr = await ask('3. Your Profit Markup (%) over wholesale', String(currentConfig.shop?.markupPercentage || '15'));
  const apiKey = await ask('4. Your Mercenta API Key (from Mercenta Bot/Console)', currentConfig.mercenta?.apiKey || 'mct_live_demo');
  const supportContact = await ask('5. Support Contact (@username)', currentConfig.shop?.supportContact || '@Support');
  const botToken = await ask('6. Telegram Bot Token (from @BotFather)', process.env.TELEGRAM_BOT_TOKEN || '');
  const cryptoAddr = await ask('7. Your Crypto Deposit Address (USDT/USDC)', currentConfig.payments?.merchantCryptoAddress || '0xYourWalletAddress');

  const markup = parseFloat(markupStr) || 15.0;

  const newConfig = {
    shop: {
      name: shopName,
      tagline: tagline,
      welcomeBannerUrl: 'https://mercenta.xyz/og-cover.png',
      currencySymbol: '$',
      markupPercentage: markup,
      supportContact: supportContact,
    },
    mercenta: {
      apiUrl: 'https://mercenta.xyz/api',
      apiKey: apiKey,
      marginProtectionFloor: 2.5,
    },
    payments: {
      enableTelegramStars: true,
      enableCryptoDirect: true,
      starsToUsdRate: 0.02,
      merchantCryptoAddress: cryptoAddr,
    },
    customProducts: currentConfig.customProducts || [],
  };

  fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf8');

  // Also write .env
  const envPath = path.join(__dirname, '../.env');
  const envContent = `TELEGRAM_BOT_TOKEN=${botToken}\nMERCENTA_API_KEY=${apiKey}\nPORT=3000\n`;
  fs.writeFileSync(envPath, envContent, 'utf8');

  console.log('\n✅ Store configuration saved successfully to shop.config.json & .env!');
  console.log(`\n🎉 Your Profit Model: All Mercenta wholesale items will sell with +${markup}% margin.`);
  console.log('   Example: $10.00 wholesale cost -> Sells to your customer at $' + (10 * (1 + markup / 100)).toFixed(2) + ' (You pocket $' + (10 * markup / 100).toFixed(2) + ' profit per sale!)');
  console.log('\nRun "npm start" to launch your shop bot now!\n');

  rl.close();
}

runWizard().catch(console.error);
