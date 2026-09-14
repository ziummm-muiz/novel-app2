import { createClient } from '@/lib/supabase/server'
import type { NovelWithAuthor } from '@/types/novel'
import type { NovelRow } from '@/types/database.types'

/**
 * Data Access Layer: Novels
 * Centralizes reusable domain-level queries for novels.
 */

export async function getNovelById(id: string): Promise<NovelWithAuthor | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('novels')
    .select(`
      *,
      profiles (
        id,
        username,
        avatar_url
      )
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error || !data) return null
  return data as unknown as NovelWithAuthor
}

export async function getPublishedNovels(limit = 20): Promise<NovelRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('novels')
    .select('*')
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []
  return data
}

export async function getFeaturedNovels(limit = 5): Promise<NovelRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('novels')
    .select('*')
    .eq('is_featured', true)
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []
  return data
}

export async function getNovelsByAuthor(authorId: string): Promise<NovelRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('novels')
    .select('*')
    .eq('author_id', authorId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data
}
