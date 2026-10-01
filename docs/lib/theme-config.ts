/**
 * Unmint Theme Configuration
 *
 * Customize your documentation's look and feel by modifying this file.
 * All colors, branding, and styling can be adjusted here.
 */

export const siteConfig = {
  // Site metadata
  name: 'Mercenta Docs',
  description: 'Wallet identity, verified Arc Testnet deposits, account history and scoped API access.',
  url: 'https://docs.mercenta.xyz',

  // Logo configuration
  logo: {
    src: '/logo.svg',
    alt: 'Mercenta',
    width: 36,
    height: 36,
  },

  // Navigation links
  links: {
    github: '',
    discord: '',
    twitter: 'https://x.com/mercenta',
    support: '',
  },

  // Footer configuration
  footer: {
    copyright: '© 2026 Mercenta Labs. Built for Arc & Circle Tameion Agents Hackathon.',
    links: [
      { label: 'Portal', href: 'https://mercenta.xyz' },
      { label: 'Console', href: 'https://app.mercenta.xyz' },
      { label: 'Catalog', href: 'https://catalog.mercenta.xyz' },
      { label: 'Arc Explorer', href: 'https://testnet.arcscan.app' },
    ],
  },
}

export const themeConfig = {
  // Primary accent color - Arc Cyan & Deep Digital Indigo
  colors: {
    // Light mode
    light: {
      accent: '#0891b2',        // Arc cyan deep
      accentForeground: '#ffffff',
      accentMuted: 'rgba(8, 145, 178, 0.1)',
    },
    // Dark mode
    dark: {
      accent: '#14c6cb',        // Arc Cyan Electric
      accentForeground: '#020617',
      accentMuted: 'rgba(20, 198, 203, 0.14)',
    },
  },

  // Code block styling
  codeBlock: {
    light: {
      background: '#f8fafc',
      titleBar: '#f1f5f9',
    },
    dark: {
      background: '#0a0d14',
      titleBar: '#111622',
    },
  },

  // OG Image generation settings
  ogImage: {
    gradient: 'linear-gradient(135deg, #030712 0%, #083344 50%, #14c6cb 100%)',
    titleColor: '#ffffff',
    sectionColor: '#14c6cb',
    logoUrl: 'https://mercenta.xyz/logo.png',
  },
}

// Export CSS variable values for use in Tailwind
export function getCSSVariables(mode: 'light' | 'dark') {
  const colors = themeConfig.colors[mode]
  return {
    '--accent': colors.accent,
    '--accent-foreground': colors.accentForeground,
    '--accent-muted': colors.accentMuted,
  }
}

/**
 * Get the site URL dynamically
 * Priority: NEXT_PUBLIC_SITE_URL > VERCEL_PROJECT_PRODUCTION_URL > VERCEL_URL > siteConfig.url
 * This allows OG images to work automatically on Vercel without configuration
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  // Use production URL if available (custom domain)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  // Fallback to deployment URL for preview deployments
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return siteConfig.url
}
