import React from 'react'
import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: "Best Sellers",
  description: "Discover the most popular and top-rated serialized novels on NovelApp.",
  alternates: {
    canonical: `${SITE_URL}/best-seller`,
  },
  openGraph: {
    title: "Best Sellers | NovelApp",
    description: "Discover the most popular and top-rated serialized novels on NovelApp.",
    url: `${SITE_URL}/best-seller`,
  },
}

export default function BestSellers() {
  return (
    <div>BestSellers</div>
  )
}
