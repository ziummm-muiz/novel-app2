import { describe, it, expect } from 'vitest'
import { addReviewSchema, addCommentSchema } from '../validations/engagement'
import { createNovelSchema } from '../validations/novel'
import { createChapterSchema } from '../validations/chapter'

describe('Validation Schemas', () => {
  describe('addReviewSchema', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000'

    it('validates a correct review', () => {
      const result = addReviewSchema.safeParse({
        novelId: validUuid,
        rating: 5,
        reviewText: 'Outstanding storyline and character arcs!',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid ratings (< 1, > 5, or non-integer)', () => {
      expect(addReviewSchema.safeParse({ novelId: validUuid, rating: 0, reviewText: 'Ok' }).success).toBe(false)
      expect(addReviewSchema.safeParse({ novelId: validUuid, rating: 6, reviewText: 'Ok' }).success).toBe(false)
      expect(addReviewSchema.safeParse({ novelId: validUuid, rating: 3.5, reviewText: 'Ok' }).success).toBe(false)
    })

    it('rejects empty or whitespace-only review text', () => {
      expect(addReviewSchema.safeParse({ novelId: validUuid, rating: 4, reviewText: '' }).success).toBe(false)
      expect(addReviewSchema.safeParse({ novelId: validUuid, rating: 4, reviewText: '   ' }).success).toBe(false)
    })

    it('rejects non-uuid novelId', () => {
      expect(addReviewSchema.safeParse({ novelId: 'not-a-uuid', rating: 5, reviewText: 'Good' }).success).toBe(false)
    })
  })

  describe('addCommentSchema', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000'

    it('validates a valid comment with or without parentId', () => {
      const rootResult = addCommentSchema.safeParse({
        targetId: validUuid,
        commentText: 'Great chapter!',
      })
      expect(rootResult.success).toBe(true)

      const replyResult = addCommentSchema.safeParse({
        targetId: validUuid,
        commentText: 'I agree with your point.',
        parentId: validUuid,
      })
      expect(replyResult.success).toBe(true)
    })

    it('rejects empty comment text', () => {
      expect(addCommentSchema.safeParse({ targetId: validUuid, commentText: '   ' }).success).toBe(false)
    })
  })

  describe('createNovelSchema', () => {
    it('validates a well-formed novel', () => {
      const result = createNovelSchema.safeParse({
        title: 'The Wandering Blade',
        synopsis: 'A lone swordsman embarks on a quest across the divided realm.',
        genres: ['Fantasy', 'Action'],
      })
      expect(result.success).toBe(true)
    })

    it('rejects synopsis under 10 characters or empty genres', () => {
      expect(createNovelSchema.safeParse({
        title: 'Valid Title',
        synopsis: 'Too short',
        genres: ['Fantasy'],
      }).success).toBe(false)

      expect(createNovelSchema.safeParse({
        title: 'Valid Title',
        synopsis: 'A valid synopsis long enough for validation purposes.',
        genres: [],
      }).success).toBe(false)
    })
  })

  describe('createChapterSchema', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000'

    it('validates a correct chapter', () => {
      const result = createChapterSchema.safeParse({
        novelId: validUuid,
        chapterNumber: 1,
        title: 'Prologue: Awakening',
        coinCost: 0,
      })
      expect(result.success).toBe(true)
    })

    it('rejects non-positive chapter numbers and negative coin costs', () => {
      expect(createChapterSchema.safeParse({
        novelId: validUuid,
        chapterNumber: 0,
        title: 'Title',
      }).success).toBe(false)

      expect(createChapterSchema.safeParse({
        novelId: validUuid,
        chapterNumber: 1,
        title: 'Title',
        coinCost: -10,
      }).success).toBe(false)
    })
  })
})
