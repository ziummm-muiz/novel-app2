import { Geist, Geist_Mono, Inter, Noto_Sans } from "next/font/google"
import { Suspense } from "react"

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
