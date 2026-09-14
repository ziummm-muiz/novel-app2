"use client"

import { useState, useMemo } from "react"
import { addComment, toggleCommentLike } from "@/app/actions/engagement"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Heart, Reply, Loader2 } from "lucide-react"
import type { CommentWithMeta, CommentNode } from "@/types/engagement"
import { nestComments } from "@/lib/comments"

interface CommentsSectionProps {
  targetId: string
  initialComments: CommentWithMeta[]
  userId?: string
}

export default function CommentsSection({ targetId, initialComments, userId }: CommentsSectionProps) {
  const [comments, setComments] = useState<CommentWithMeta[]>(initialComments)
  const [mainInput, setMainInput] = useState("")
  const [replyInput, setReplyInput] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Assemble comments into a typed nested tree
  const commentTree = useMemo(() => nestComments(comments), [comments])

  const handlePost = async (text: string, parentId: string | null = null) => {
    if (!userId) {
      alert("Please log in to comment.")
      return
    }
    if (!text.trim()) return

    setIsSubmitting(true)
    try {
      await addComment(targetId, text, parentId)
      
      // Optimistic update
      const newComment: CommentWithMeta = {
        id: `temp-${Date.now()}`,
        target_id: targetId,
        user_id: userId,
        parent_id: parentId,
        comment_text: text,
        created_at: new Date().toISOString(),
        profiles: { id: userId, username: "You", avatar_url: null },
        comment_likes: []
      }
      
      setComments(prev => [newComment, ...prev])
      if (parentId) {
        setReplyInput("")
        setReplyingTo(null)
      } else {
        setMainInput("")
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to post comment."
      alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLike = async (commentId: string) => {
    if (!userId) {
      alert("Please log in to like.")
      return
    }

    const comment = comments.find(c => c.id === commentId)
    if (!comment) return

    const isLiked = comment.comment_likes?.some(like => like.user_id === userId)
    
    // Optimistic UI toggle
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        let newLikes = [...(c.comment_likes || [])]
        if (isLiked) {
          newLikes = newLikes.filter(l => l.user_id !== userId)
        } else {
          newLikes.push({ user_id: userId })
        }
        return { ...c, comment_likes: newLikes }
      }
      return c
    }))

    try {
      await toggleCommentLike(commentId, isLiked || false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to toggle like."
      alert(message)
    }
  }

  const CommentBubble = ({ node, isReply = false }: { node: CommentNode; isReply?: boolean }) => {
    const isLiked = Boolean(userId && node.comment_likes?.some(like => like.user_id === userId))
    const likeCount = node.comment_likes?.length || 0

    return (
      <div className={`flex gap-4 ${isReply ? 'mt-4' : 'mt-6'}`}>
        <div className={`shrink-0 ${isReply ? 'size-8' : 'size-10'} bg-muted rounded-full border overflow-hidden flex items-center justify-center font-bold text-muted-foreground`}>
          {node.profiles?.avatar_url ? (
            <img src={node.profiles.avatar_url} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            (node.profiles?.username || "?").charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="font-semibold text-sm">{node.profiles?.username || "Unknown"}</span>
              <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                {node.created_at ? new Date(node.created_at).toLocaleDateString() : ""}
              </span>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{node.comment_text}</p>
          </div>
          
          <div className="flex items-center gap-4 mt-2 px-2">
            <button 
              onClick={() => handleLike(node.id)}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${isLiked ? 'text-rose-500' : 'text-muted-foreground hover:text-rose-500'}`}
            >
              <Heart className={`size-3.5 ${isLiked ? 'fill-current' : ''}`} />
              {likeCount > 0 ? likeCount : 'Like'}
            </button>
            
            {!isReply && (
              <button 
                onClick={() => setReplyingTo(replyingTo === node.id ? null : node.id)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                <Reply className="size-3.5" />
                Reply
              </button>
            )}
          </div>

          {/* Reply Input Box */}
          {replyingTo === node.id && (
            <div className="mt-4 flex gap-3">
              <Textarea 
                value={replyInput}
                onChange={e => setReplyInput(e.target.value)}
                placeholder="Write a reply..."
                className="min-h-20 text-sm resize-y bg-background"
                autoFocus
              />
              <Button size="sm" onClick={() => handlePost(replyInput, node.id)} disabled={isSubmitting || !replyInput.trim()}>
                {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Reply"}
              </Button>
            </div>
          )}

          {/* Render nested replies recursively */}
          {node.children && node.children.length > 0 && (
            <div className="ml-4 border-l-2 border-border/50 pl-4 mt-2">
              {node.children.map(childNode => (
                <CommentBubble key={childNode.id} node={childNode} isReply={true} />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <MessageSquare className="size-5 text-primary" />
        <h2 className="text-2xl font-bold">Comments ({comments.length})</h2>
      </div>

      {userId ? (
        <div className="flex gap-4">
          <div className="flex-1">
            <Textarea 
              value={mainInput}
              onChange={e => setMainInput(e.target.value)}
              placeholder="What are your thoughts?"
              className="min-h-25 resize-y bg-background"
            />
            <div className="flex justify-end mt-3">
              <Button onClick={() => handlePost(mainInput)} disabled={isSubmitting || !mainInput.trim()}>
                {isSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                Post Comment
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-muted p-6 rounded-xl text-center text-muted-foreground border border-border">
          Please log in to join the discussion.
        </div>
      )}

      <div className="pt-4">
        {commentTree.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No comments yet. Start the conversation!</div>
        ) : (
          commentTree.map(rootNode => (
            <CommentBubble key={rootNode.id} node={rootNode} />
          ))
        )}
      </div>
    </div>
  )
}
