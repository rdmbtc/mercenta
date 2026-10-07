import { Geist } from 'next/font/google'
import type { Metadata } from 'next'
import { ThemeProvider } from './providers/theme-provider'
import { siteConfig } from '@/lib/theme-config'
import './globals.css'
import './mercenta-docs.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans', display: 'swap' })

export const metadata: Metadata = {
  icons: { icon: [{url:'/favicon.ico?v=mercenta-2',sizes:'any'}, {url:'/favicon-32.png',type:'image/png',sizes:'32x32'}], apple: [{url:'/apple-touch-icon.png',sizes:'180x180'}] },
  manifest: '/site.webmanifest',
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={geist.variable}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
