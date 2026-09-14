import type { CommentRow, ReviewRow, ProfileRow } from '@/types/database.types'

export type AuthorSnippet = Pick<ProfileRow, 'id' | 'username' | 'avatar_url'>

export interface ReviewWithAuthor extends ReviewRow {
  author?: AuthorSnippet | null
  profiles?: AuthorSnippet | null
}

export interface CommentWithMeta extends CommentRow {
  author?: AuthorSnippet | null
  profiles?: AuthorSnippet | null
  comment_likes?: { user_id: string }[]
}

export interface CommentNode extends CommentWithMeta {
  children: CommentNode[]
}
