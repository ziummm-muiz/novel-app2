import React from 'react'
import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: "Best Sellers",
  description: "Discover the most popular and top-rated stories on Mi Novaria.",
  alternates: {
    canonical: `${SITE_URL}/best-seller`,
  },
  openGraph: {
    title: "Best Sellers | Mi Novaria",
    description: "Discover the most popular and top-rated stories on Mi Novaria.",
    url: `${SITE_URL}/best-seller`,
  },
}

export default function BestSellers() {
  return (
    <div>BestSellers</div>
  )
}
