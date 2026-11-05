# @mercenta/aomi-skill

> Official Aomi App & Agent Skill for Mercenta Commerce and Autonomous Treasury Management on Arc Network (Chain 5042).

Enables AI agents in Aomi, Claude Code, Cursor, and Hermes to browse wholesale digital inventory, validate orders against the 5-Gate Policy Engine, settle on Arc Mainnet, sweep idle treasury into yield vaults, and execute multi-chain liquidity top-ups.

## Installation

```bash
npm install @mercenta/aomi-skill
# or install via skills CLI:
npx skills add rdmbtc/mercenta
```

## Quick Start

```typescript
import { MercentaAomiClient } from '@mercenta/aomi-skill';

const client = new MercentaAomiClient();

// 1. Search wholesale digital goods
const catalog = await client.getCatalog({ category: 'gaming', query: 'steam' });

// 2. Simulate order through the 5-Gate Policy Engine
const quote = await client.getQuote(catalog[0].id, 50.0);

if (quote.decision === 'CLEARED') {
  // 3. Settle atomically on Arc Mainnet
  const order = await client.checkout(quote.quoteId);
  console.log('Delivered on Arc:', order.txHash);
}
```

## License
MIT
