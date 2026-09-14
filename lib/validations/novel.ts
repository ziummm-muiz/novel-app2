import { z } from 'zod'

export const createNovelSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(100, 'Title must be under 100 characters'),
  synopsis: z.string().trim().min(10, 'Synopsis must be at least 10 characters').max(5000, 'Synopsis must be under 5000 characters'),
  genres: z.array(z.string().trim()).min(1, 'Please select at least one genre'),
  tags: z.array(z.string().trim()).optional().default([]),
  maturityRating: z.enum(['everyone', 'teen', 'mature']).optional().default('everyone'),
})

export const updateNovelSchema = createNovelSchema.partial()

export type CreateNovelInput = z.infer<typeof createNovelSchema>
export type UpdateNovelInput = z.infer<typeof updateNovelSchema>
