import { z } from 'zod'

export const updateProfileSchema = z.object({
  username: z.string().trim().min(3, 'Username must be at least 3 characters').max(30, 'Username must be under 30 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores').optional(),
  fullName: z.string().trim().max(100, 'Full name must be under 100 characters').optional().nullable(),
  bio: z.string().trim().max(500, 'Bio must be under 500 characters').optional().nullable(),
  avatarUrl: z.string().url('Invalid avatar URL').optional().nullable().or(z.literal('')),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
