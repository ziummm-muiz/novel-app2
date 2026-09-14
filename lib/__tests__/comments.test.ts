import { describe, it, expect } from 'vitest'
import { nestComments } from '../comments'
import type { CommentWithMeta } from '@/types/engagement'

function makeMockComment(id: string, parentId: string | null = null, text = `Comment ${id}`): CommentWithMeta {
  return {
    id,
    target_id: 'novel-123',
    user_id: 'user-abc',
    comment_text: text,
    parent_id: parentId,
    created_at: new Date().toISOString(),
    author: {
      id: 'user-abc',
      username: 'testuser',
      avatar_url: null,
    },
    comment_likes: [],
  }
}

describe('nestComments', () => {
  it('should return an empty array when given empty input', () => {
    expect(nestComments([])).toEqual([])
  })

  it('should correctly structure flat root comments with no replies', () => {
    const flat = [
      makeMockComment('root-1'),
      makeMockComment('root-2'),
      makeMockComment('root-3'),
    ]

    const nested = nestComments(flat)
    expect(nested).toHaveLength(3)
    expect(nested.map(c => c.id)).toEqual(['root-1', 'root-2', 'root-3'])
    expect(nested.every(c => c.children.length === 0)).toBe(true)
  })

  it('should assemble a multi-level comment tree with multiple roots and nested replies', () => {
    // flat comments:
    // root A
    //  ├── reply A1
    //  │    └── reply A1.1
    //  └── reply A2
    // root B
    const flat = [
      makeMockComment('root-A'),
      makeMockComment('reply-A1', 'root-A'),
      makeMockComment('reply-A1.1', 'reply-A1'),
      makeMockComment('reply-A2', 'root-A'),
      makeMockComment('root-B'),
    ]

    const nested = nestComments(flat)
    expect(nested).toHaveLength(2)

    // Root A
    const rootA = nested.find(c => c.id === 'root-A')!
    expect(rootA).toBeDefined()
    expect(rootA.children).toHaveLength(2)

    // Reply A1
    const replyA1 = rootA.children.find(c => c.id === 'reply-A1')!
    expect(replyA1).toBeDefined()
    expect(replyA1.children).toHaveLength(1)
    expect(replyA1.children[0].id).toBe('reply-A1.1')
    expect(replyA1.children[0].children).toHaveLength(0)

    // Reply A2
    const replyA2 = rootA.children.find(c => c.id === 'reply-A2')!
    expect(replyA2).toBeDefined()
    expect(replyA2.children).toHaveLength(0)

    // Root B
    const rootB = nested.find(c => c.id === 'root-B')!
    expect(rootB).toBeDefined()
    expect(rootB.children).toHaveLength(0)
  })

  it('should gracefully handle children when child appears before parent in random order', () => {
    // reply-1 appears BEFORE parent-1 in the array
    const flat = [
      makeMockComment('reply-1', 'parent-1'),
      makeMockComment('parent-1', null),
    ]

    const nested = nestComments(flat)
    expect(nested).toHaveLength(1)
    expect(nested[0].id).toBe('parent-1')
    expect(nested[0].children).toHaveLength(1)
    expect(nested[0].children[0].id).toBe('reply-1')
  })

  it('should gracefully treat orphaned comments (parent does not exist) as root comments', () => {
    // non-existent-parent is not in input
    const flat = [
      makeMockComment('orphan-1', 'non-existent-parent'),
      makeMockComment('normal-root', null),
    ]

    const nested = nestComments(flat)
    expect(nested).toHaveLength(2)
    expect(nested.map(c => c.id)).toContain('orphan-1')
    expect(nested.map(c => c.id)).toContain('normal-root')
  })

  it('should handle deeply nested reply chains (4+ levels)', () => {
    const flat = [
      makeMockComment('l1', null),
      makeMockComment('l2', 'l1'),
      makeMockComment('l3', 'l2'),
      makeMockComment('l4', 'l3'),
      makeMockComment('l5', 'l4'),
    ]

    const nested = nestComments(flat)
    expect(nested).toHaveLength(1)
    expect(nested[0].children[0].children[0].children[0].children[0].id).toBe('l5')
  })
})
