# 🚀 Mercenta Turnkey Telegram Shop Template

> Launch your own fully automated digital goods Telegram store in **2 minutes** with **zero inventory risk** and **guaranteed profit margin**.

Powered by **Mercenta Wholesale Settlement Infrastructure (Arc Network)**.

---

## 💡 How It Works

1. **Zero Pre-Funded Inventory:** You don't need to pre-buy 500 gift cards or freeze working capital.
2. **Instant Customer Delivery:** When a customer buys in your bot, the bot procures the item just-in-time via Mercenta API and delivers the decrypted code directly to the customer's chat.
3. **You Set Your Markup:** Set your profit margin (e.g. `+15%`). If Mercenta's wholesale cost is **$10.00**, your store sells it for **$11.50** — you pocket the **$1.50 net profit** instantly.
4. **No Blockchain Required for Your Buyers:** Your customers pay with standard **Telegram Stars** or crypto direct transfer.

---

## ⚡ 1-Click Quickstart

### Step 1: Create a Telegram Bot
1. Open [@BotFather](https://t.me/BotFather) in Telegram.
2. Send `/newbot`, choose a name and username (e.g. `MyGameShop_bot`).
3. Copy your `HTTP API Token`.

### Step 2: Get your Mercenta API Key
1. Open the official Mercenta Bot or visit [mercenta.xyz](https://mercenta.xyz).
2. Go to **Settings / Policy** and click **Generate API Key** (e.g. `mct_live_...`).

### Step 3: Run Interactive Setup
Clone this repo and run:

```bash
npm install
npm run setup
```

The interactive wizard will ask for:
- Your Store Name & Tagline
- Your desired profit markup % (e.g., `15`)
- Your Mercenta API Key
- Your Bot Token from @BotFather

### Step 4: Launch!

```bash
npm start
```

Your store is now live! Open your bot in Telegram and send `/start`.

---

## 🛠️ Configuration & Customization

All store settings live in `shop.config.json`:

```json
{
  "shop": {
    "name": "Apex Digital Store",
    "tagline": "Instant Gaming Keys & Subscriptions",
    "markupPercentage": 15.0,
    "supportContact": "@ApexStoreSupport"
  },
  "mercenta": {
    "apiUrl": "https://mercenta.xyz/api",
    "apiKey": "mct_live_...",
    "marginProtectionFloor": 2.5
  },
  "payments": {
    "enableTelegramStars": true,
    "enableCryptoDirect": true
  }
}
```

### Changing Markup on the Fly
As the bot admin, you can change your profit margin directly from Telegram chat:
```text
/setmarkup 20
```
This instantly updates all store prices to `+20%` profit margin without needing a restart!

---

## 🚢 1-Click Cloud Deployment

### Railway / Render / VPS
This template includes automatic process management. To deploy on any Docker or cloud host:
1. Connect this repo to [Railway.app](https://railway.app) or [Render.com](https://render.com).
2. Add environment variables: `TELEGRAM_BOT_TOKEN` and `MERCENTA_API_KEY`.
3. Set start command to `npm start`.

---

## 📜 License
MIT © Mercenta. Built for the autonomous agent and digital merchant economy.
