"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import {
  addReviewSchema,
  addCommentSchema,
  toggleCommentLikeSchema,
} from "@/lib/validations/engagement"
import {
  isAccountRestricted,
  isUniqueConstraintViolation,
} from "@/lib/auth-helpers"

export async function addReview(novelId: string, rating: number, reviewText: string) {
  // 1. Validate untrusted inputs at the boundary
  const parsed = addReviewSchema.safeParse({ novelId, rating, reviewText })
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid review inputs.")
  }

  const supabase = await createClient()

  // 2. Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("You must be logged in to leave a review.")

  // 3. Check restrictions
  const { data: profile } = await supabase.from('profiles').select('is_restricted').eq('id', user.id).single()
  if (isAccountRestricted(profile)) {
    throw new Error("Your account is restricted from posting reviews.")
  }

  // 4. Insert Review (Supabase unique constraint enforces at DB level)
  const { error: insertError } = await supabase
    .from('reviews')
    .insert({
      novel_id: parsed.data.novelId,
      user_id: user.id,
      rating: parsed.data.rating,
      review_text: parsed.data.reviewText
    })

  if (insertError) {
    console.error("Error inserting review:", insertError)
    if (isUniqueConstraintViolation(insertError)) {
      throw new Error("You have already reviewed this novel.")
    }
    throw new Error("Failed to post review.")
  }

  revalidatePath(`/novel/${novelId}`)
  return { success: true }
}

export async function addComment(targetId: string, commentText: string, parentId?: string | null) {
  // 1. Validate inputs
  const parsed = addCommentSchema.safeParse({ targetId, commentText, parentId })
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid comment inputs.")
  }

  const supabase = await createClient()

  // 2. Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("You must be logged in to comment.")

  // 3. Check restrictions
  const { data: profile } = await supabase.from('profiles').select('is_restricted').eq('id', user.id).single()
  if (isAccountRestricted(profile)) {
    throw new Error("Your account is restricted from commenting.")
  }

  // 4. Insert comment
  const { error } = await supabase
    .from('comments')
    .insert({
      target_id: parsed.data.targetId,
      user_id: user.id,
      comment_text: parsed.data.commentText,
      parent_id: parsed.data.parentId || null
    })

  if (error) {
    console.error("Error posting comment:", error)
    throw new Error("Failed to post comment.")
  }

  return { success: true }
}

export async function toggleCommentLike(commentId: string, isCurrentlyLiked: boolean) {
  const parsed = toggleCommentLikeSchema.safeParse({ commentId, isCurrentlyLiked })
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid like request.")
  }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("You must be logged in to like comments.")

  if (parsed.data.isCurrentlyLiked) {
    // Unlike
    const { error } = await supabase
      .from('comment_likes')
      .delete()
      .eq('comment_id', parsed.data.commentId)
      .eq('user_id', user.id)

    if (error) throw new Error("Failed to unlike comment.")
  } else {
    // Like
    const { error } = await supabase
      .from('comment_likes')
      .insert({
        comment_id: parsed.data.commentId,
        user_id: user.id
      })

    if (error && !isUniqueConstraintViolation(error)) {
      throw new Error("Failed to like comment.")
    }
  }

  return { success: true }
}
