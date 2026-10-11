import type {Metadata} from "next";
import "../product.css";
import {browseBootstrap} from "@/lib/catalog-bootstrap";
import {BrowseCatalog} from "@/components/product/BrowseCatalog";

export const metadata: Metadata = {
  title:
    "Catalog - Steam, PSN, Xbox, Riot, Roblox Gift Cards for USDC | Mercenta",
  description:
    "Steam wallet code crypto, PSN card crypto payment, Xbox Game Pass code crypto on Base/Solana. Pay with USDC, verified availability and clear pricing.",
  keywords: [
    "buy steam gift card with usdc",
    "steam wallet code crypto",
    "steam gift card base network",
    "playstation gift card usdc",
    "psn card crypto payment",
    "psn top up solana",
    "xbox gift card usdc",
    "xbox game pass code crypto",
    "apple gift access via usdc",
    "riot points card usdc",
    "roblox gift card crypto",
    "blizzard battle.net balance usdc",
    "razer gold pin crypto",
    "epic games gift card usdc",
    "buy gift cards with stablecoin",
    "gift card wholesale api",
    "digital goods supplier usdc",
  ],
  alternates: {canonical: "/catalog"},
  openGraph: {
    title:
      "Catalog - Steam, PSN, Xbox, Riot, Roblox Gift Cards for USDC | Mercenta",
    description:
      "Steam wallet code crypto, PSN card crypto payment, Xbox Game Pass code crypto on Base/Solana. Pay with USDC, verified availability and clear pricing.",
    url: "/catalog",
    type: "website",
  },
};

const SITE = "https://mercenta.xyz";

type ProductEntry = {
  name: string;
  slug: string;
  description: string;
};

const catalogEntries: ProductEntry[] = [
  {
    name: "Steam Wallet Gift Card",
    slug: "steam",
    description:
      "Buy a Steam gift card with USDC on Base or Solana. Wallet top-up code redeemable on Steam.",
  },
  {
    name: "PlayStation Network (PSN) Gift Card",
    slug: "playstation",
    description:
      "PSN card with crypto payment in USDC on Base or Solana. Wallet top-up code redeemable on PlayStation Network.",
  },
  {
    name: "Xbox / Game Pass Gift Card",
    slug: "xbox",
    description:
      "Xbox gift card with USDC on Base or Solana. Balance or Game Pass code redeemable on Xbox.",
  },
  {
    name: "Riot Points Gift Card",
    slug: "riot",
    description:
      "Riot Points card in USDC on Base or Solana. Code redeemable on Riot Games titles.",
  },
  {
    name: "Roblox Gift Card",
    slug: "roblox",
    description:
      "Roblox gift card with crypto payment in USDC. Code redeemable on Roblox.",
  },
  {
    name: "Blizzard Battle.net Gift Card",
    slug: "blizzard",
    description:
      "Battle.net balance in USDC on Base or Solana. Code redeemable on Blizzard Battle.net.",
  },
  {
    name: "Razer Gold PIN",
    slug: "razer",
    description:
      "Razer Gold PIN with crypto payment in USDC. PIN redeemable on Razer Gold supported titles.",
  },
  {
    name: "Epic Games Gift Card",
    slug: "epic",
    description:
      "Epic Games gift card in USDC on Base or Solana. Code redeemable on Epic Games Store.",
  },
  {
    name: "Apple Gift Access via USDC",
    slug: "apple",
    description:
      "Apple gift access via USDC where supported by applicable terms; availability limited and region-dependent.",
  },
];

function jsonLdForCatalog() {
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Mercenta digital goods catalog",
    itemListElement: catalogEntries.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: entry.name,
        description: entry.description,
        category: "Gift Cards & Platform Vouchers",
        brand: {"@type": "Brand", name: "Mercenta"},
        url: `${SITE}/catalog#${entry.slug}`,
      },
    })),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${SITE}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Catalog",
        item: `${SITE}/catalog`,
      },
    ],
  };

  return {itemList, breadcrumb};
}

export default function CatalogPage() {
  const {itemList, breadcrumb} = jsonLdForCatalog();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(itemList)}}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(breadcrumb)}}
      />
      <BrowseCatalog initial={browseBootstrap} />
    </>
  );
}
