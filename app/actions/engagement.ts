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

  // We revalidate the current layout path if we knew it exactly, 
  // but it's simpler to ask the client component to useRouter().refresh() 
  // or we can just try to revalidate some common paths.
  // Actually, we don't know if targetId is a novelId or chapterId easily from here, 
  // so the client might need to refresh or we can return success.
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
  }

  return { success: true }
}
