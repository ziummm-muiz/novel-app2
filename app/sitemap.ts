import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { SITE_URL } from '@/lib/constants'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/categories`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blogs`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/best-seller`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ]

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return staticRoutes
  }

  try {
    const supabase = createClient<Database>(supabaseUrl, supabaseKey)

    // 1. Published, non-deleted novels
    const { data: novels } = await supabase
      .from('novels')
      .select('id, created_at, status')
      .is('deleted_at', null)
      .neq('status', 'draft')

    const novelRoutes: MetadataRoute.Sitemap = (novels || []).map((novel) => ({
      url: `${SITE_URL}/novel/${novel.id}`,
      lastModified: novel.created_at ? new Date(novel.created_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    // 2. Published, non-deleted chapters belonging to published novels
    const publishedNovelIds = new Set((novels || []).map((n) => n.id))
    const { data: chapters } = await supabase
      .from('chapters')
      .select('novel_id, chapter_number, created_at, published_at, status')
      .is('deleted_at', null)
      .neq('status', 'draft')

    const chapterRoutes: MetadataRoute.Sitemap = (chapters || [])
      .filter((ch) => publishedNovelIds.has(ch.novel_id))
      .map((ch) => ({
        url: `${SITE_URL}/novel/${ch.novel_id}/chapter/${ch.chapter_number}`,
        lastModified: ch.published_at
          ? new Date(ch.published_at)
          : ch.created_at
          ? new Date(ch.created_at)
          : new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }))

    // 3. Published blogs
    const { data: blogs } = await supabase
      .from('blogs')
      .select('id, created_at')

    const blogRoutes: MetadataRoute.Sitemap = (blogs || []).map((blog) => ({
      url: `${SITE_URL}/blogs/${blog.id}`,
      lastModified: blog.created_at ? new Date(blog.created_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    return [...staticRoutes, ...novelRoutes, ...chapterRoutes, ...blogRoutes]
  } catch (err) {
    console.error('Error generating dynamic sitemap:', err)
    return staticRoutes
  }
}
