// Server-side supplier catalog adapter.
//
// The upstream supplier identity and key never leave the server: this module is
// only imported by server components, reads its config from env, and exposes a
// normalized catalog under Mercenta's institutional categories. With no key
// configured it serves a curated snapshot so the catalog stays renderable.

export type CategoryId = "gaming" | "streaming" | "creator" | "developer" | "cloud";

export interface Category {
  id: CategoryId;
  label: string;
  short: string;
  /** HashiCorp domain token; grades art tiles and card accents. */
  accent: string;
}

export const CATEGORIES: Category[] = [
  { id: "gaming", label: "Gaming Keys & Platform Vouchers", short: "Gaming & Vouchers", accent: "#14c6cb" },
  { id: "streaming", label: "Streaming & Media Subscriptions", short: "Streaming", accent: "#7b42bc" },
  { id: "creator", label: "Creator & Game Micro-Donations", short: "Creator", accent: "#ffcf25" },
  { id: "developer", label: "Developer API & Token Bundles", short: "Developer", accent: "#1868f2" },
  { id: "cloud", label: "Cloud Compute & GPU Vouchers", short: "Compute", accent: "#f24c53" },
];

export type ProductType = "voucher" | "direct_topup" | "esim";

export interface CatalogDenomination {
  id: string;
  name: string;
  price: number;
  currency: string;
  available: boolean;
  stock?: number;
  isLongOrder?: boolean;
}

export interface CatalogProduct {
  id: string;
  name: string;
  /** Brand segment of the product name, e.g. "Steam". */
  brand: string;
  /** Brand mark from a resolver; 404 falls back to a monogram. */
  logoUrl?: string;
  category: CategoryId;
  type: ProductType;
  countryCode?: string;
  denominations: CatalogDenomination[];
  minPrice: number;
  maxPrice: number;
  currency: string;
  inStock: number;
  totalStock: number;
}

export interface Catalog {
  products: CatalogProduct[];
  live: boolean;
  generatedAt: string;
}

const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<CategoryId, Category>;

export function categoryOf(id: CategoryId): Category {
  return CATEGORY_BY_ID[id];
}

/** Upstream categoryName → Mercenta rail. */
const CATEGORY_NAME_MAP: Record<string, CategoryId> = {
  gaming: "gaming",
  games: "gaming",
  "mobile games": "gaming",
  entertainment: "streaming",
  tv: "streaming",
  "streaming services": "streaming",
  "music and entertainment": "streaming",
  social: "creator",
  accounts: "creator",
  software: "developer",
};

const RULES: [CategoryId, RegExp][] = [
  ["creator", /donat|tip|twitch|kick|boosty|patreon|creator|onlyfans/i],
  ["streaming", /netflix|spotify|disney|hbo|hulu|youtube|music|video|tv|prime|apple music|deezer|tidal|shahid|osn|starz|crunchyroll|iptv/i],
  ["developer", /api|token|openai|gpt|claude|gemini|credit|develop|adobe|microsoft|office|windows|software|antivirus|vpn/i],
  ["cloud", /gpu|h100|a100|compute|cloud|cluster/i],
  ["gaming", /./], // default rail: keys, vouchers, top-ups
];

function categorize(categoryName: string | undefined, text: string): CategoryId {
  const mapped = CATEGORY_NAME_MAP[(categoryName ?? "").toLowerCase()];
  if (mapped) return mapped;
  for (const [id, re] of RULES) if (re.test(text)) return id;
  return "gaming";
}

interface RawItem {
  id: string;
  name?: string;
  nominal?: number;
  price: number;
  currency: string;
  inStock?: number;
  available?: boolean;
  stock?: number;
  isLongOrder?: boolean;
}

interface RawProduct {
  id: string;
  name?: string;
  type?: string;
  countryCode?: string;
  categoryName?: string;
  subcategoryName?: string;
  items?: RawItem[];
}

const STOP_WORDS = /(gift\s*card|voucher|digital\s*code|top.?up|recharge|prepaid|e-?sim|code|card|bundle|subscription|sub|wallet)/gi;

function brandOf(name: string): string {
  const head = name.split("|")[0] ?? name;
  const clean = head.replace(STOP_WORDS, "").replace(/[\u2122\u00ae\u00a9]/g, "").trim();
  return clean.replace(/\s{2,}/g, " ") || name.trim();
}

function domainGuess(brand: string): string | undefined {
  const d = brand.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9.]+/g, "");
  if (d.length < 2) return undefined;
  return d.includes(".") ? d : `${d}.com`;
}

function normalize(raw: RawProduct[]): CatalogProduct[] {
  const out: CatalogProduct[] = [];
  for (const p of raw) {
    const denominations: CatalogDenomination[] = (p.items ?? []).map((it) => {
      const stock = it.inStock ?? it.stock;
      return {
        id: it.id,
        name: it.name ?? (it.nominal != null ? String(it.nominal) : "Standard"),
        price: it.price,
        currency: it.currency,
        available: it.available ?? (stock == null ? true : stock > 0),
        stock,
        isLongOrder: it.isLongOrder,
      };
    });
    if (denominations.length === 0) continue;
    const prices = denominations.map((d) => d.price);
    const name = p.name ?? "Unnamed product";
    const brand = brandOf(name);
    const domain = domainGuess(brand);
    const type: ProductType =
      p.type === "direct_topup" || p.type === "esim" ? p.type : "voucher";
    out.push({
      id: p.id,
      name,
      brand,
      logoUrl: domain ? `https://unavatar.io/${domain}?fallback=false` : undefined,
      category: categorize(p.categoryName, `${name} ${p.subcategoryName ?? ""} ${p.type ?? ""}`),
      type,
      countryCode: p.countryCode,
      denominations,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      currency: denominations[0]!.currency,
      inStock: denominations.filter((d) => d.available).length,
      totalStock: denominations.reduce((n, d) => n + (d.stock ?? 0), 0),
    });
  }
  return out;
}

// Interleave brands so regional variants of one brand don't flood the grid.
function diversify(products: CatalogProduct[]): CatalogProduct[] {
  const byBrand = new Map<string, CatalogProduct[]>();
  for (const p of products) {
    const k = p.brand.toLowerCase();
    const q = byBrand.get(k);
    if (q) q.push(p); else byBrand.set(k, [p]);
  }
  const queues = [...byBrand.values()];
  const out: CatalogProduct[] = [];
  let remaining = products.length;
  while (remaining > 0) {
    for (const q of queues) {
      const p = q.shift();
      if (p) { out.push(p); remaining--; }
    }
  }
  return out;
}


export const INSTITUTIONAL_CLOUD_PRODUCTS: CatalogProduct[] = [
  {
    id: "inst-cloud-h100",
    name: "Dedicated 8x H100 SXM5 GPU Cluster",
    brand: "NVIDIA DGX Cloud",
    logoUrl: "https://unavatar.io/nvidia.com?fallback=false",
    category: "cloud",
    type: "voucher",
    countryCode: "US",
    denominations: [
      { id: "h100-24h", name: "24h Cluster Lease", price: 624.0, currency: "USD", available: true, stock: 12 },
      { id: "h100-7d", name: "7d Cluster Lease", price: 3950.0, currency: "USD", available: true, stock: 4, isLongOrder: true },
      { id: "h100-30d", name: "30d Dedicated Pod", price: 14800.0, currency: "USD", available: true, stock: 2, isLongOrder: true },
    ],
    minPrice: 624.0,
    maxPrice: 14800.0,
    currency: "USD",
    inStock: 3,
    totalStock: 18,
  },
  {
    id: "inst-cloud-a100",
    name: "Elastic 4x A100 80GB High-Memory Pod",
    brand: "Lambda Cloud",
    logoUrl: "https://unavatar.io/lambdalabs.com?fallback=false",
    category: "cloud",
    type: "voucher",
    countryCode: "US",
    denominations: [
      { id: "a100-100h", name: "100 Compute Hours", price: 290.0, currency: "USD", available: true, stock: 45 },
      { id: "a100-500h", name: "500 Compute Hours", price: 1350.0, currency: "USD", available: true, stock: 18 },
    ],
    minPrice: 290.0,
    maxPrice: 1350.0,
    currency: "USD",
    inStock: 2,
    totalStock: 63,
  },
  {
    id: "inst-cloud-gh200",
    name: "NVIDIA GH200 Grace Hopper Inference Node",
    brand: "CoreWeave",
    logoUrl: "https://unavatar.io/coreweave.com?fallback=false",
    category: "cloud",
    type: "voucher",
    countryCode: "EU",
    denominations: [
      { id: "gh200-50h", name: "50 Node Hours", price: 195.0, currency: "USD", available: true, stock: 28 },
      { id: "gh200-200h", name: "200 Node Hours", price: 720.0, currency: "USD", available: true, stock: 15 },
    ],
    minPrice: 195.0,
    maxPrice: 720.0,
    currency: "USD",
    inStock: 2,
    totalStock: 43,
  },
  {
    id: "inst-cloud-vllm",
    name: "Autonomous High-Throughput vLLM Endpoint",
    brand: "Together AI",
    logoUrl: "https://unavatar.io/together.ai?fallback=false",
    category: "cloud",
    type: "voucher",
    countryCode: "GLOB",
    denominations: [
      { id: "vllm-100m", name: "100M Token Credit Pool", price: 85.0, currency: "USD", available: true, stock: 120 },
      { id: "vllm-500m", name: "500M Token Credit Pool", price: 380.0, currency: "USD", available: true, stock: 50 },
    ],
    minPrice: 85.0,
    maxPrice: 380.0,
    currency: "USD",
    inStock: 2,
    totalStock: 170,
  },
];

export async function getCatalog(): Promise<Catalog> {
  const key = process.env.SUPPLIER_API_KEY;
  const url = process.env.SUPPLIER_API_URL;
  if (key && url) {
    try {
      const res = await fetch(`${url.replace(/\/$/, "")}/services`, {
        headers: {
          "X-API-Key": key,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(15_000),
        next: { revalidate: 300 },
      });
      if (res.ok) {
        const envelope = (await res.json()) as { data?: { items?: RawProduct[] } };
        const products = normalize(envelope.data?.items ?? []);
        if (products.length > 0) {
          const merged = products.some((p) => p.category === "cloud") ? products : [...INSTITUTIONAL_CLOUD_PRODUCTS, ...products];
          return { products: diversify(merged), live: true, generatedAt: new Date().toISOString() };
        }
      }
    } catch {
      // Fall through to the snapshot; a stale catalog beats an empty one.
    }
  }
  return { products: normalize(FALLBACK), live: false, generatedAt: new Date().toISOString() };
}

// Curated snapshot used until SUPPLIER_API_KEY/SUPPLIER_API_URL are configured
// or when the upstream is unreachable.
const FALLBACK: RawProduct[] = [
  { id: "fb-steam", name: "Steam Wallet Code", type: "voucher", categoryName: "Gaming", countryCode: "GLOB", items: [
    { id: "fb-steam-5", name: "5 USD", price: 5.4, currency: "USD", inStock: 412 },
    { id: "fb-steam-10", name: "10 USD", price: 10.6, currency: "USD", inStock: 356 },
    { id: "fb-steam-20", name: "20 USD", price: 21.0, currency: "USD", inStock: 288 },
    { id: "fb-steam-50", name: "50 USD", price: 52.2, currency: "USD", inStock: 97 },
  ]},
  { id: "fb-psn", name: "PlayStation Store Wallet", type: "voucher", categoryName: "Gaming", countryCode: "AE", items: [
    { id: "fb-psn-10", name: "10 USD", price: 10.8, currency: "USD", inStock: 240 },
    { id: "fb-psn-25", name: "25 USD", price: 26.4, currency: "USD", inStock: 180 },
    { id: "fb-psn-50", name: "50 USD", price: 52.5, currency: "USD", inStock: 76 },
  ]},
  { id: "fb-xbox", name: "Xbox Gift Card", type: "voucher", categoryName: "Gaming", countryCode: "US", items: [
    { id: "fb-xbox-15", name: "15 USD", price: 15.9, currency: "USD", inStock: 203 },
    { id: "fb-xbox-25", name: "25 USD", price: 26.1, currency: "USD", inStock: 154 },
  ]},
  { id: "fb-riot", name: "Riot Points Card", type: "voucher", categoryName: "Gaming", countryCode: "EU", items: [
    { id: "fb-riot-10", name: "1380 RP", price: 10.5, currency: "USD", inStock: 322 },
    { id: "fb-riot-25", name: "3500 RP", price: 25.9, currency: "USD", inStock: 141 },
  ]},
  { id: "fb-netflix", name: "Streaming Video Plan Voucher", type: "voucher", categoryName: "Entertainment", countryCode: "GLOB", items: [
    { id: "fb-netflix-1m", name: "1 Month Standard", price: 15.2, currency: "USD", inStock: 88 },
    { id: "fb-netflix-3m", name: "3 Months Standard", price: 43.9, currency: "USD", inStock: 41 },
  ]},
  { id: "fb-music", name: "Music Streaming Subscription", type: "voucher", categoryName: "Music And Entertainment", countryCode: "GLOB", items: [
    { id: "fb-music-1m", name: "1 Month Premium", price: 10.4, currency: "USD", inStock: 190 },
    { id: "fb-music-12m", name: "12 Months Premium", price: 99.0, currency: "USD", inStock: 22, isLongOrder: true },
  ]},
  { id: "fb-twitch", name: "Stream Micro-Donation Credit", type: "voucher", categoryName: "Social", countryCode: "GLOB", items: [
    { id: "fb-twitch-5", name: "500 Bits Bundle", price: 7.1, currency: "USD", inStock: 500 },
    { id: "fb-twitch-25", name: "Sub Gift Pack x5", price: 24.8, currency: "USD", inStock: 96 },
  ]},
  { id: "fb-ai", name: "AI Model API Credit Pool", type: "voucher", categoryName: "Software", countryCode: "GLOB", items: [
    { id: "fb-ai-50", name: "50 USD Credit", price: 50.0, currency: "USD", inStock: 64 },
    { id: "fb-ai-200", name: "200 USD Credit", price: 196.0, currency: "USD", inStock: 31 },
    { id: "fb-ai-1000", name: "1000 USD Credit", price: 960.0, currency: "USD", inStock: 8, isLongOrder: true },
  ]},
  { id: "fb-esim", name: "Global eSIM Data Pack", type: "esim", categoryName: "eSIM", countryCode: "GLOB", items: [
    { id: "fb-esim-1", name: "1 GB / 7 days", price: 4.5, currency: "USD", inStock: 900 },
    { id: "fb-esim-10", name: "10 GB / 30 days", price: 19.9, currency: "USD", inStock: 640 },
  ]},
  { id: "fb-mobile", name: "Mobile Balance Top-Up", type: "direct_topup", categoryName: "Mobile", countryCode: "CIS", items: [
    { id: "fb-mobile-5", name: "5 USD", price: 5.1, currency: "USD", inStock: 999 },
    { id: "fb-mobile-20", name: "20 USD", price: 19.8, currency: "USD", inStock: 999 },
  ]},
];
