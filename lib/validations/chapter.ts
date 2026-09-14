import { z } from 'zod'

export const createChapterSchema = z.object({
  novelId: z.string().uuid('Invalid novel ID'),
  chapterNumber: z.number().int('Chapter number must be an integer').min(1, 'Chapter number must be at least 1'),
  title: z.string().trim().min(1, 'Chapter title is required').max(150, 'Title must be under 150 characters'),
  coinCost: z.number().int('Coin cost must be an integer').min(0, 'Coin cost cannot be negative').default(0),
  status: z.enum(['draft', 'scheduled', 'published']).default('draft'),
})

export const updateChapterSchema = createChapterSchema.partial().omit({ novelId: true })

export type CreateChapterInput = z.infer<typeof createChapterSchema>
export type UpdateChapterInput = z.infer<typeof updateChapterSchema>
