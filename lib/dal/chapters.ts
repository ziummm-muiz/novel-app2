import { createClient } from '@/lib/supabase/server'
import type { ChapterRow } from '@/types/database.types'

/**
 * Data Access Layer: Chapters
 * Centralizes reusable domain-level queries for chapters.
 */

export async function getChaptersByNovelId(novelId: string, publishedOnly = true): Promise<ChapterRow[]> {
  const supabase = await createClient()
  let query = supabase
    .from('chapters')
    .select('*')
    .eq('novel_id', novelId)
    .is('deleted_at', null)
    .order('chapter_number', { ascending: true })

  if (publishedOnly) {
    query = query.eq('status', 'published')
  }

  const { data, error } = await query
  if (error || !data) return []
  return data
}

export async function getChapterById(chapterId: string): Promise<ChapterRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('id', chapterId)
    .is('deleted_at', null)
    .single()

  if (error || !data) return null
  return data
}

export async function getChapterByNumber(novelId: string, chapterNumber: number): Promise<ChapterRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('novel_id', novelId)
    .eq('chapter_number', chapterNumber)
    .is('deleted_at', null)
    .single()

  if (error || !data) return null
  return data
}
