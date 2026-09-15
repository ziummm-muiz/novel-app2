import { Geist_Mono, Inter, Noto_Sans } from "next/font/google"
import { Suspense } from "react"
import type { Metadata } from "next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner"
import UrlToastHandler from "@/components/web/url-toast-handler"
import { SITE_URL } from "@/lib/constants"

const notoSansHeading = Noto_Sans({subsets:['latin'],variable:'--font-heading'});

const inter = Inter({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const siteUrl = SITE_URL

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Mi Novaria | Discover, read, and share stories',
    template: '%s | Mi Novaria'
  },
  description: 'Discover, read, and share stories on Mi Novaria.',
  keywords: ['novel', 'reading', 'writing', 'books', 'stories', 'fiction', 'community'],
  authors: [{ name: 'Mi Novaria Team' }],
  creator: 'Mi Novaria',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    title: 'Mi Novaria | Discover, read, and share stories',
    description: 'Discover, read, and share stories on Mi Novaria.',
    siteName: 'Mi Novaria',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mi Novaria | Discover, read, and share stories',
    description: 'Discover, read, and share stories on Mi Novaria.',
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
