# Mercenta read-only client · 0.1.0
Direct-download preview, not published to an npm registry. Zero runtime dependencies. Requires a modern runtime with fetch and AbortSignal.timeout.

```ts
import { MercentaClient } from '@mercenta/read-only-client';
const catalogue = await new MercentaClient().catalogue();
```

Only the public catalogue is supported. `live` distinguishes live availability from saved data. A catalogue price is not a payment quote. No authenticated account tools, purchases, signing, or webhook endpoints are implemented. Never include private supplier credentials in browser code.

For cross-origin browser embeds, configure same-origin proxying if the selected deployment does not enable CORS. No universal CORS availability is promised.
