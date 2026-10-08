import {hasStock,availableQuantity} from './catalog-stock';
import {brandArtwork} from './brand-artwork';
import {illustrationFor,safeProductImage} from './product-images';
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
  imageUrl?: string;
  imageSource?: "supplier" | "brand" | "illustration";
  category: CategoryId;
  type: ProductType;
  countryCode?: string;
  denominations: CatalogDenomination[];
  optionCount?: number;
  searchText?: string;
  optionsDeferred?: boolean;
  minPrice: number;
  maxPrice: number;
  currency: string;
  inStock: number;
  totalStock: number;
}

export interface Catalog {
  products: CatalogProduct[];
  live: boolean;
  snapshot?: boolean;
  generatedAt: string;
  sourceStatus?: string;
  coverage?: string;
  purchasingEnabled?: false;
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
  imageUrl?: string;
  image?: string;
}

const STOP_WORDS = /(gift\s*card|voucher|digital\s*code|top.?up|recharge|prepaid|e-?sim|code|card|bundle|subscription|sub|wallet)/gi;

function brandOf(name: string): string {
  const head = name.split("|")[0] ?? name;
  const clean = head.replace(STOP_WORDS, "").replace(/[\u2122\u00ae\u00a9]/g, "").trim();
  return clean.replace(/\s{2,}/g, " ") || name.trim();
}

export function normalizeCatalog(raw: RawProduct[]): CatalogProduct[] {
  const out: CatalogProduct[] = [];
  for (const p of raw) {
    const denominations: CatalogDenomination[] = (p.items ?? []).filter(it=>Number.isFinite(it.price)&&it.price>=0&&typeof it.currency==='string').map((it) => {
      const stock = availableQuantity(it);
      return {
        id: it.id,
        name: it.name ?? (it.nominal != null ? String(it.nominal) : "Standard"),
        price: it.price,
        currency: it.currency,
        available: hasStock(it),
        stock,
        isLongOrder: it.isLongOrder,
      };
    });
    const prices = denominations.map((d) => d.price);
    const name = p.name ?? "Unnamed product";
    const brand = brandOf(name);
    const supplied=safeProductImage(p.imageUrl??p.image);
    // The authorized feed uses flagcdn for country flags, not product covers.
    const image=supplied&&new URL(supplied).hostname!=="flagcdn.com"?supplied:undefined;
    const type: ProductType =
      p.type === "direct_topup" || p.type === "esim" ? p.type : "voucher";
    out.push({
      id: p.id,
      name,
      brand,
      imageUrl:image??brandArtwork(name)??illustrationFor(name,categorize(p.categoryName,name)),
      imageSource:image?"supplier":brandArtwork(name)?"brand":"illustration",
      category: categorize(p.categoryName, `${name} ${p.subcategoryName ?? ""} ${p.type ?? ""}`),
      type,
      countryCode: p.countryCode,
      denominations,
      minPrice: prices.length?Math.min(...prices):0,
      maxPrice: prices.length?Math.max(...prices):0,
      currency: denominations[0]?.currency??"",
      inStock: denominations.filter((d) => d.available).length,
      totalStock: denominations.reduce((n, d) => n + (d.stock ?? 0), 0),
    });
  }
  return out;
}

// Interleave brands so regional variants of one brand don't flood the grid.
export function diversify(products: CatalogProduct[]): CatalogProduct[] {
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


/** Genuine photos/platform artwork first, stable within each partition. */
export function artworkFirst(products:CatalogProduct[]):CatalogProduct[]{
 const hasArt=(p:CatalogProduct)=>p.imageSource==='supplier'&&!!safeProductImage(p.imageUrl)||!!brandArtwork(p.name);
 return [...products.filter(hasArt),...products.filter(p=>!hasArt(p))];
}
export async function getCatalog(): Promise<Catalog> {
 let sourceStatus='backend-unavailable';
 try {const res=await fetch((process.env.BACKEND_URL??'https://api.mercenta.xyz').replace(/\/$/,'')+'/api/account/supplier-catalog',{signal:AbortSignal.timeout(10000),cache:'no-store'});if(res.ok){const feed=await res.json() as {status:string;products:RawProduct[];fetchedAt:string;coverage:string};sourceStatus=feed.status;if(feed.status==='ready'){return {products:artworkFirst(diversify(normalizeCatalog(feed.products.map(p=>({...p,items:p.items?.filter(i=>hasStock(i))})).filter(p=>p.items?.length)))),live:true,generatedAt:feed.fetchedAt,sourceStatus,coverage:feed.coverage,purchasingEnabled:false}}}}catch{/* Never label examples as a successful supplier import. */}
 const examples=FALLBACK.map(p=>({...p,items:p.items?.map(i=>({...i,inStock:0,stock:0,available:false}))}));
 return {products:normalizeCatalog(examples),live:false,sourceStatus,coverage:'examples-only',generatedAt:new Date().toISOString()};
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
