import { createClient } from '@/lib/supabase/server'
import type { ReviewWithAuthor, CommentWithMeta } from '@/types/engagement'

/**
 * Data Access Layer: Engagement (Reviews & Comments)
 * Centralizes reusable domain-level queries for reviews and comments.
 */

export async function getNovelReviews(novelId: string): Promise<ReviewWithAuthor[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      profiles (
        id,
        username,
        avatar_url
      )
    `)
    .eq('novel_id', novelId)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data as unknown as ReviewWithAuthor[]
}

export async function getTargetComments(targetId: string): Promise<CommentWithMeta[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      profiles (
        id,
        username,
        avatar_url
      ),
      comment_likes (
        user_id
      )
    `)
    .eq('target_id', targetId)
    .order('created_at', { ascending: true })

  if (error || !data) return []
  return data as unknown as CommentWithMeta[]
}
