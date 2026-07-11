"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function addReview(novelId: string, rating: number, reviewText: string) {
  const supabase = await createClient()

  // 1. Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("You must be logged in to leave a review.")

  // 2. Check restrictions
  const { data: profile } = await supabase.from('profiles').select('is_restricted').eq('id', user.id).single()
  if (profile?.is_restricted) throw new Error("Your account is restricted from posting reviews.")

  // 3. Validate input
  if (rating < 1 || rating > 5) throw new Error("Rating must be between 1 and 5.")
  if (!reviewText || !reviewText.trim()) throw new Error("Review text is required.")

  // 4. Insert Review (Supabase unique constraint or upsert logic)
  // We'll try to insert. If user already reviewed, we can either error or update.
  // For now, let's just insert.
  const { error: insertError } = await supabase
    .from('reviews')
    .insert({
      novel_id: novelId,
      user_id: user.id,
      rating,
      review_text: reviewText
    })

  if (insertError) {
    console.error("Error inserting review:", insertError)
    // Checking for unique constraint violation (code '23505')
    if (insertError.code === '23505') {
      throw new Error("You have already reviewed this novel.")
    }
    throw new Error("Failed to post review.")
  }

  // Notify novel author
  const { data: novel } = await supabase.from('novels').select('author_id, title').eq('id', novelId).single()
  if (novel && novel.author_id !== user.id) {
    await supabase.from('notifications').insert({
      user_id: novel.author_id,
      title: 'New Review',
      content: `Someone left a ${rating}-star review on your novel "${novel.title}".`,
      link: `/novel/${novelId}`
    })
  }

  revalidatePath(`/novel/${novelId}`)
}

export async function addComment(targetId: string, commentText: string, parentId?: string | null) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("You must be logged in to comment.")

  const { data: profile } = await supabase.from('profiles').select('is_restricted').eq('id', user.id).single()
  if (profile?.is_restricted) throw new Error("Your account is restricted from commenting.")

  if (!commentText || !commentText.trim()) throw new Error("Comment text cannot be empty.")

  const { error } = await supabase
    .from('comments')
    .insert({
      target_id: targetId,
      user_id: user.id,
      comment_text: commentText,
      parent_id: parentId || null
    })

  if (error) {
    console.error("Error posting comment:", error)
    throw new Error("Failed to post comment.")
  }

  // Notify parent comment author if it's a reply
  if (parentId) {
    const { data: parentComment } = await supabase.from('comments').select('user_id').eq('id', parentId).single()
    if (parentComment && parentComment.user_id !== user.id) {
      await supabase.from('notifications').insert({
        user_id: parentComment.user_id,
        title: 'New Reply',
        content: `Someone replied to your comment.`,
        link: `/novel/${targetId}` // We don't have the exact path, but we assume targetId is mostly novelId for top level
      })
    }
  }

  return { success: true }
}

export async function toggleCommentLike(commentId: string, isCurrentlyLiked: boolean) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("You must be logged in to like comments.")

  if (isCurrentlyLiked) {
    // Unlike
    const { error } = await supabase
      .from('comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', user.id)

    if (error) throw new Error("Failed to unlike comment.")
  } else {
    // Like
    const { error } = await supabase
      .from('comment_likes')
      .insert({
        comment_id: commentId,
        user_id: user.id
      })

    if (error && error.code !== '23505') { // ignore duplicate key
      throw new Error("Failed to like comment.")
    }

    // Notify comment author
    const { data: comment } = await supabase.from('comments').select('user_id').eq('id', commentId).single()
    if (comment && comment.user_id !== user.id) {
      await supabase.from('notifications').insert({
        user_id: comment.user_id,
        title: 'New Like',
        content: `Someone liked your comment.`
      })
    }
  }

  return { success: true }
}
