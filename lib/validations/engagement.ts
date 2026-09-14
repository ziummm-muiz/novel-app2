import { z } from 'zod'

export const addReviewSchema = z.object({
  novelId: z.string().uuid('Invalid novel ID'),
  rating: z.number().int('Rating must be an integer').min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
  reviewText: z.string().trim().min(1, 'Review text is required').max(2000, 'Review text must be under 2000 characters'),
})

export const addCommentSchema = z.object({
  targetId: z.string().uuid('Invalid target ID'),
  commentText: z.string().trim().min(1, 'Comment text cannot be empty').max(1000, 'Comment text must be under 1000 characters'),
  parentId: z.string().uuid('Invalid parent comment ID').nullable().optional(),
})

export const toggleCommentLikeSchema = z.object({
  commentId: z.string().uuid('Invalid comment ID'),
  isCurrentlyLiked: z.boolean(),
})

export type AddReviewInput = z.infer<typeof addReviewSchema>
export type AddCommentInput = z.infer<typeof addCommentSchema>
export type ToggleCommentLikeInput = z.infer<typeof toggleCommentLikeSchema>
