"use client"

import { useState, useTransition } from "react"
import { addComment, toggleCommentLike, deleteComment } from "@/app/actions/blog-engagement"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { User, MessageCircle, Heart, CornerDownRight, Trash2 } from "lucide-react"
import Link from "next/link"

type CommentType = {
  id: string
  parent_id: string | null
  content: string
  created_at: string
  user_id: string
  profiles: {
    username: string
    full_name: string
    avatar_url: string
  }
  blog_comment_likes: { user_id: string }[]
}

function CommentItem({ 
  comment, 
  allComments, 
  blogId, 
  currentUserId,
  currentPath
}: { 
  comment: CommentType
  allComments: CommentType[]
  blogId: string
  currentUserId: string | undefined
  currentPath: string
}) {
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [isPending, startTransition] = useTransition()

  // Find children of this comment
  const children = allComments.filter(c => c.parent_id === comment.id)
  
  const hasLiked = currentUserId ? comment.blog_comment_likes.some(l => l.user_id === currentUserId) : false
  const likesCount = comment.blog_comment_likes.length

  const handleReply = () => {
    if (!replyContent.trim()) return
    startTransition(async () => {
      try {
        await addComment(blogId, replyContent, comment.id, currentPath)
        setReplyContent("")
        setIsReplying(false)
      } catch (err) {
        console.error(err)
      }
    })
  }

  const handleLike = () => {
    if (!currentUserId) return
    startTransition(async () => {
      try {
        await toggleCommentLike(comment.id, currentPath)
      } catch (err) {
        console.error(err)
      }
    })
  }

  const handleDelete = () => {
    if (!currentUserId || currentUserId !== comment.user_id) return
    if (!confirm('Are you sure you want to delete this comment?')) return
    
    startTransition(async () => {
      try {
        await deleteComment(comment.id, currentPath)
      } catch (err) {
        console.error(err)
      }
    })
  }

  const authorName = comment.profiles?.full_name || comment.profiles?.username || "Unknown User"

  return (
    <div className="mt-4">
      <div className="flex gap-3">
        <Link href={`/user/${comment.user_id}`} className="size-8 rounded-full bg-muted overflow-hidden shrink-0 mt-1 border border-border hover:opacity-80 transition-opacity">
          {comment.profiles?.avatar_url ? (
            <img src={comment.profiles.avatar_url} alt={authorName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="size-4 text-muted-foreground" />
            </div>
          )}
        </Link>
        
        <div className="flex-1 space-y-2">
          <div className="bg-muted/30 p-4 rounded-2xl rounded-tl-sm border border-border">
            <div className="flex items-center justify-between mb-1">
              <Link href={`/user/${comment.user_id}`} className="font-semibold text-sm hover:text-primary transition-colors hover:underline">
                {authorName}
              </Link>
              <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                {new Date(comment.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{comment.content}</p>
          </div>
          
          <div className="flex items-center gap-4 px-2">
            <button 
              onClick={handleLike}
              disabled={isPending || !currentUserId}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${hasLiked ? 'text-rose-500' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Heart className={`size-3.5 ${hasLiked ? 'fill-rose-500' : ''}`} />
              {likesCount > 0 && <span>{likesCount}</span>}
            </button>
            
            <button 
              onClick={() => setIsReplying(!isReplying)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageCircle className="size-3.5" />
              Reply
            </button>

            {currentUserId === comment.user_id && (
              <button 
                onClick={handleDelete}
                disabled={isPending}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors ml-auto"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>

          {/* Reply Input */}
          {isReplying && (
            <div className="mt-3 flex gap-3 pr-4">
              <CornerDownRight className="size-4 text-muted-foreground mt-2 shrink-0" />
              <div className="flex-1 space-y-2">
                <Textarea 
                  placeholder="Write a reply..." 
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[80px] text-sm resize-none"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsReplying(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleReply} disabled={isPending || !replyContent.trim()}>
                    {isPending ? "Posting..." : "Reply"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recursive Children Rendering */}
      {children.length > 0 && (
        <div className="pl-6 md:pl-11 border-l-2 border-muted/50 ml-4 mt-2">
          {children.map(child => (
            <CommentItem 
              key={child.id}
              comment={child}
              allComments={allComments}
              blogId={blogId}
              currentUserId={currentUserId}
              currentPath={currentPath}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function BlogComments({ 
  blogId, 
  comments, 
  currentUserId 
}: { 
  blogId: string
  comments: any[]
  currentUserId?: string 
}) {
  const [newComment, setNewComment] = useState("")
  const [isPending, startTransition] = useTransition()
  const currentPath = `/blogs/${blogId}`

  const handlePostComment = () => {
    if (!newComment.trim()) return
    startTransition(async () => {
      try {
        await addComment(blogId, newComment, null, currentPath)
        setNewComment("")
      } catch (err) {
        console.error(err)
      }
    })
  }

  // Find top level comments (no parent)
  const topLevelComments = comments.filter(c => !c.parent_id)

  return (
    <div className="mt-16 pt-10 border-t border-border">
      <h3 className="text-2xl font-bold mb-8">Comments ({comments.length})</h3>

      {/* New Top-Level Comment Input */}
      {currentUserId ? (
        <div className="mb-10 space-y-4">
          <Textarea 
            placeholder="Share your thoughts..." 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px] resize-y"
          />
          <div className="flex justify-end">
            <Button onClick={handlePostComment} disabled={isPending || !newComment.trim()}>
              {isPending ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-10 p-6 rounded-xl border border-dashed bg-muted/20 text-center">
          <h4 className="font-semibold mb-2">Join the conversation</h4>
          <p className="text-muted-foreground text-sm">Please log in to leave a comment or like posts.</p>
        </div>
      )}

      {/* Comment Thread */}
      <div className="space-y-6">
        {topLevelComments.length > 0 ? (
          topLevelComments.map(comment => (
            <CommentItem 
              key={comment.id}
              comment={comment}
              allComments={comments}
              blogId={blogId}
              currentUserId={currentUserId}
              currentPath={currentPath}
            />
          ))
        ) : (
          <p className="text-muted-foreground text-center py-8">No comments yet. Be the first to share your thoughts!</p>
        )}
      </div>
    </div>
  )
}
