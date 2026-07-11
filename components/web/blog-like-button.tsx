"use client"

import { useTransition } from "react"
import { toggleBlogLike } from "@/app/actions/blog-engagement"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"

export default function BlogLikeButton({ 
  blogId, 
  likesCount, 
  hasLiked,
  currentUserId 
}: { 
  blogId: string
  likesCount: number
  hasLiked: boolean
  currentUserId?: string
}) {
  const [isPending, startTransition] = useTransition()

  const handleLike = () => {
    if (!currentUserId) return
    
    startTransition(async () => {
      try {
        await toggleBlogLike(blogId, `/blogs/${blogId}`)
      } catch (err) {
        console.error(err)
      }
    })
  }

  return (
    <Button 
      variant={hasLiked ? "secondary" : "outline"} 
      className={`rounded-full gap-2 transition-all duration-300 ${hasLiked ? "bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 border-rose-200" : ""}`}
      onClick={handleLike}
      disabled={isPending || !currentUserId}
    >
      <Heart className={`size-4 transition-transform ${hasLiked ? "fill-rose-500" : ""} ${isPending ? "scale-90" : "hover:scale-110"}`} />
      <span className="font-semibold">{likesCount} {likesCount === 1 ? 'Like' : 'Likes'}</span>
    </Button>
  )
}
