import { Geist, Geist_Mono, Inter, Noto_Sans } from "next/font/google"
import { Suspense } from "react"
import type { Metadata } from "next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner"
import UrlToastHandler from "@/components/web/url-toast-handler"

const notoSansHeading = Noto_Sans({subsets:['latin'],variable:'--font-heading'});

const inter = Inter({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://novel-app2.vercel.app/'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'NovelApp | Discover & Write Amazing Novels',
    template: '%s | NovelApp'
  },
  description: 'A premium platform to discover, read, and write amazing novels. Join our community of readers and writers today.',
  keywords: ['novel', 'reading', 'writing', 'books', 'stories', 'fiction', 'community'],
  authors: [{ name: 'NovelApp Team' }],
  creator: 'NovelApp',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    title: 'NovelApp | Discover & Write Amazing Novels',
    description: 'A premium platform to discover, read, and write amazing novels.',
    siteName: 'NovelApp',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NovelApp | Discover & Write Amazing Novels',
    description: 'A premium platform to discover, read, and write amazing novels.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable, notoSansHeading.variable)}
    >
      <body>
        <ThemeProvider>
          {children}
          <Suspense fallback={null}>
            <UrlToastHandler />
          </Suspense>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
