import type { NovelRow, ChapterRow, ProfileRow } from '@/types/database.types'

export type AuthorSnippet = Pick<ProfileRow, 'id' | 'username' | 'avatar_url'>

export interface NovelWithAuthor extends NovelRow {
  author?: AuthorSnippet | null
  profiles?: AuthorSnippet | null
}

export interface NovelWithChapters extends NovelWithAuthor {
  chapters?: ChapterRow[]
}
