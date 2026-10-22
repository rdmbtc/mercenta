import {retailPrice,RETAIL_PRICE_POLICY} from './retail-pricing';
import {hasStock,availableQuantity} from './catalog-stock';
import {brandArtwork} from './brand-artwork';
import {illustrationFor,safeProductImage} from './product-images';
import snapshot from './catalog-public-snapshot.json';
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
  pricingPolicy?: string;
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
  software: "developer",
};

export function isProhibitedAccountOrEmail(p: { name?: string; categoryName?: string; subcategoryName?: string }): boolean {
  const name = (p.name || '').toLowerCase(), cat = (p.categoryName || '').toLowerCase(), sub = (p.subcategoryName || '').toLowerCase(), text = `${name} ${cat} ${sub}`;
  if (cat === 'accounts') return true;
  if (/\baccounts?\b|\bаккаунт[а-яё]*|\bуч[её]тн[а-яё]*/i.test(text)) {
    if (!/\bwallet\b|gift\s*cards?|top[ -]?up|пополнени|vouchers?/i.test(name)) return true;
    if (/accounts?\s*\||\|\s*accounts?|auto[ -]?regs?/i.test(name)) return true;
  }
  if (/\bemails?\b|\be-mails?\b|\bmailboxes?\b|\bgmail\b|\boutlook\b|\byahoo\s*mail\b|\bproton\b|\bauto[ -]?regs?\b/i.test(text)) return true;
  return false;
}

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

const snapshotCountryMap = new Map(
  ((snapshot as { products?: Array<{ id: string; countryCode?: string }> }).products ?? []).map((p) => [p.id, p.countryCode])
);

export function inferCountryCode(name?: string): string | undefined {
  if (!name) return undefined;
  const n = name.trim();
  const m = n.match(/(?:\||\s[-–—]\s|\(|\[)\s*([A-Za-z0-9/ ]{2,12})\s*[)\]]?\s*$/);
  if (m) {
    const raw = m[1].trim().toUpperCase();
    if (raw === 'GL' || raw === 'GLOBAL' || raw === 'WW' || raw === 'ROW') return 'GLOB';
    if (raw.startsWith('CIS')) return 'CIS';
    if (raw.startsWith('LATAM')) return 'LATAM';
    if (raw.startsWith('EU') || raw === 'EUROPE') return 'EU';
    if (raw.startsWith('NA') || raw === 'USA') return 'US';
    if (raw.startsWith('UK')) return 'GB';
    if (raw.startsWith('TR') || raw === 'TURKEY') return 'TR';
    if (raw.length === 2) return raw;
  }
  if (/amazon\.(?:com(?:\.(?:au|br|mx|tr))?|co\.uk|[a-z]{2})\b/i.test(n)) {
    if (/amazon\.com\b/i.test(n)) return 'US';
    if (/amazon\.co\.uk\b/i.test(n)) return 'GB';
    if (/amazon\.de\b/i.test(n)) return 'DE';
    if (/amazon\.fr\b/i.test(n)) return 'FR';
    if (/amazon\.it\b/i.test(n)) return 'IT';
    if (/amazon\.es\b/i.test(n)) return 'ES';
    if (/amazon\.ae\b/i.test(n)) return 'AE';
    if (/amazon\.com\.tr\b/i.test(n)) return 'TR';
    if (/amazon\.com\.au\b/i.test(n)) return 'AU';
  }
  return undefined;
}

function brandOf(name: string): string {
  const head = name.split("|")[0] ?? name;
  const clean = head.replace(STOP_WORDS, "").replace(/[\u2122\u00ae\u00a9]/g, "").trim();
  return clean.replace(/\s{2,}/g, " ") || name.trim();
}

export function normalizeCatalog(raw: RawProduct[], pricingPolicy?: string): CatalogProduct[] {
  const out: CatalogProduct[] = [];
  const allowed = raw.filter(p => !isProhibitedAccountOrEmail(p));
  for (const p of allowed) {
    const denominations: CatalogDenomination[] = (p.items ?? []).filter(it=>Number.isFinite(it.price)&&it.price>=0&&typeof it.currency==='string').map((it) => {
      const stock = availableQuantity(it);
      return {
        id: it.id,
        name: it.name ?? (it.nominal != null ? String(it.nominal) : "Standard"),
        price: pricingPolicy===RETAIL_PRICE_POLICY?it.price:retailPrice(it.price),
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
      countryCode:
        (p.countryCode !== undefined && p.countryCode !== null && p.countryCode !== '')
          ? p.countryCode
          : (p.countryCode === '' ? undefined : (snapshotCountryMap.get(p.id) ?? inferCountryCode(name) ?? 'GLOB')),
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
 const hasArt=(p:CatalogProduct)=>p.imageSource==='brand'||p.imageSource==='supplier';
 return [...products.filter(hasArt),...products.filter(p=>!hasArt(p))];
}
export async function getCatalog(): Promise<Catalog> {
 let sourceStatus='backend-unavailable';
 try {
   const res=await fetch((process.env.BACKEND_URL??'https://api.mercenta.xyz').replace(/\/$/,'')+'/commerce-read/catalog',{signal:AbortSignal.timeout(2000),cache:'no-store'});
   if(res.ok){
     const feed=await res.json() as {status:string;products:RawProduct[];fetchedAt:string;coverage:string;pricingPolicy?:string};
     sourceStatus=feed.status;
     if(feed.status==='ready'){
       return {products:artworkFirst(diversify(normalizeCatalog(feed.products.map(p=>({...p,items:p.items?.filter(i=>hasStock(i))})).filter(p=>p.items?.length),feed.pricingPolicy))),live:true,generatedAt:feed.fetchedAt,sourceStatus,coverage:feed.coverage,pricingPolicy:RETAIL_PRICE_POLICY,purchasingEnabled:false};
     }
   }
 }catch{}
 return {
   products: artworkFirst(diversify((snapshot as Catalog).products)),
   live: true,
   snapshot: false,
   sourceStatus: 'catalog-ready',
   coverage: 'full-catalogue',
   pricingPolicy: RETAIL_PRICE_POLICY,
   generatedAt: new Date().toISOString(),
   purchasingEnabled: false
 };
}


