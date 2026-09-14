import type { CommentWithMeta, CommentNode } from '@/types/engagement'

/**
 * Transforms a flat array of database comment records into a nested tree of CommentNode objects.
 * 
 * Behavior & Guarantees:
 * - Empty input returns an empty array `[]`.
 * - Multi-level replies are placed into their immediate parent's `children` array.
 * - Missing parent fallback: If a comment has a `parent_id` that is not present in the input dataset
 *   (e.g. parent comment was deleted or orphaned), it is gracefully treated as a root-level comment
 *   rather than being dropped from the discussion tree.
 * - Deterministic ordering: Preserves the input sequence of sibling comments.
 */
export function nestComments(flatComments: CommentWithMeta[]): CommentNode[] {
  if (!flatComments || flatComments.length === 0) {
    return []
  }

  const commentMap = new Map<string, CommentNode>()
  const rootComments: CommentNode[] = []

  // First pass: Instantiate each comment as a node with empty children array
  for (const comment of flatComments) {
    commentMap.set(comment.id, {
      ...comment,
      children: [],
    })
  }

  // Second pass: Assemble hierarchy
  for (const comment of flatComments) {
    const node = commentMap.get(comment.id)!
    if (comment.parent_id && commentMap.has(comment.parent_id)) {
      // Valid parent found: append to parent's children
      commentMap.get(comment.parent_id)!.children.push(node)
    } else {
      // Root comment, OR orphaned comment whose parent doesn't exist in dataset
      rootComments.push(node)
    }
  }

  return rootComments
}
