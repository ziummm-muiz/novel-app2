"use client"

import { useState } from "react"
import { addComment, toggleCommentLike } from "@/app/actions/engagement"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Heart, Reply, Loader2 } from "lucide-react"

type Comment = {
  id: string
  target_id: string
  user_id: string
  parent_id: string | null
  comment_text: string
  created_at: string
  profiles: { username: string, full_name: string, avatar_url: string }
  comment_likes: any[]
}

export default function CommentsSection({ targetId, initialComments, userId }: { targetId: string, initialComments: Comment[], userId?: string }) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [mainInput, setMainInput] = useState("")
  const [replyInput, setReplyInput] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Organize comments into top-level and replies
  const topLevelComments = comments.filter(c => !c.parent_id).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

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
      const newComment: Comment = {
        id: `temp-${Date.now()}`,
        target_id: targetId,
        user_id: userId,
        parent_id: parentId,
        comment_text: text,
        created_at: new Date().toISOString(),
        profiles: { username: "You", full_name: "You", avatar_url: "" },
        comment_likes: []
      }
      
      setComments([newComment, ...comments])
      if (parentId) {
        setReplyInput("")
        setReplyingTo(null)
      } else {
        setMainInput("")
      }
    } catch (err: any) {
      alert(err.message || "Failed to post comment.")
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
    } catch (err: any) {
      // Revert if error
      alert(err.message || "Failed to toggle like.")
    }
  }

  const CommentBubble = ({ comment, isReply = false }: { comment: Comment, isReply?: boolean }) => {
    const isLiked = userId && comment.comment_likes?.some(like => like.user_id === userId)
    const likeCount = comment.comment_likes?.length || 0

    return (
      <div className={`flex gap-4 ${isReply ? 'mt-4' : 'mt-6'}`}>
        <div className={`shrink-0 ${isReply ? 'size-8' : 'size-10'} bg-muted rounded-full border overflow-hidden flex items-center justify-center font-bold text-muted-foreground`}>
          {comment.profiles?.avatar_url ? (
            <img src={comment.profiles.avatar_url} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            (comment.profiles?.username || "?").charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="font-semibold text-sm">{comment.profiles?.username || "Unknown"}</span>
              <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                {new Date(comment.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{comment.comment_text}</p>
          </div>
          
          <div className="flex items-center gap-4 mt-2 px-2">
            <button 
              onClick={() => handleLike(comment.id)}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${isLiked ? 'text-rose-500' : 'text-muted-foreground hover:text-rose-500'}`}
            >
              <Heart className={`size-3.5 ${isLiked ? 'fill-current' : ''}`} />
              {likeCount > 0 ? likeCount : 'Like'}
            </button>
            
            {!isReply && (
              <button 
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                <Reply className="size-3.5" />
                Reply
              </button>
            )}
          </div>

          {/* Reply Input Box */}
          {replyingTo === comment.id && (
            <div className="mt-4 flex gap-3">
              <Textarea 
                value={replyInput}
                onChange={e => setReplyInput(e.target.value)}
                placeholder="Write a reply..."
                className="min-h-20 text-sm resize-y bg-background"
                autoFocus
              />
              <Button size="sm" onClick={() => handlePost(replyInput, comment.id)} disabled={isSubmitting || !replyInput.trim()}>
                {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Reply"}
              </Button>
            </div>
          )}

          {/* Render nested replies */}
          {!isReply && (
            <div className="ml-4 border-l-2 border-border/50 pl-4 mt-2">
              {getReplies(comment.id).map(reply => (
                <CommentBubble key={reply.id} comment={reply} isReply={true} />
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
        {topLevelComments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No comments yet. Start the conversation!</div>
        ) : (
          topLevelComments.map(comment => (
            <CommentBubble key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  )
}
