"use client"

import { useState } from "react"
import { addReview } from "@/app/actions/engagement"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star, Loader2 } from "lucide-react"

export default function NovelReviews({ novelId, initialReviews, userId }: { novelId: string, initialReviews: any[], userId?: string }) {
  const [reviews, setReviews] = useState(initialReviews)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasReviewed = userId ? reviews.some(r => r.user_id === userId) : false

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) {
      alert("Please log in to leave a review.")
      return
    }
    if (rating === 0) {
      setError("Please select a rating.")
      return
    }

    setIsSubmitting(true)
    setError(null)
    
    try {
      await addReview(novelId, rating, reviewText)
      // Optimistically update
      const newReview = {
        id: `temp-${Date.now()}`,
        user_id: userId,
        rating,
        review_text: reviewText,
        created_at: new Date().toISOString(),
        profiles: { username: "You", full_name: "You" } // Simple mock for UI
      }
      setReviews([newReview, ...reviews])
      setRating(0)
      setReviewText("")
    } catch (err: any) {
      setError(err.message || "Failed to post review.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0"

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-6 pb-6 border-b border-border">
        <div className="text-center">
          <div className="text-5xl font-black text-primary">{averageRating}</div>
          <div className="flex items-center justify-center text-primary mt-1">
            <Star className="size-4 fill-current" />
          </div>
          <div className="text-sm text-muted-foreground mt-1">{reviews.length} reviews</div>
        </div>
        <div>
          <h2 className="text-2xl font-bold">Community Reviews</h2>
          <p className="text-muted-foreground">What readers are saying about this novel.</p>
        </div>
      </div>

      {userId && !hasReviewed && (
        <form onSubmit={handleSubmit} className="bg-muted/30 p-6 rounded-2xl border border-border">
          <h3 className="font-semibold mb-4">Leave a Review</h3>
          {error && <div className="text-destructive text-sm mb-4">{error}</div>}
          
          <div className="flex items-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                className="focus:outline-none transition-transform hover:scale-110"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              >
                <Star 
                  className={`size-8 ${
                    star <= (hoverRating || rating) 
                      ? "fill-primary text-primary" 
                      : "text-muted-foreground"
                  }`} 
                />
              </button>
            ))}
          </div>
          
          <Textarea 
            placeholder="What did you think about this novel?" 
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            className="mb-4 bg-background resize-y min-h-[100px]"
            required
          />
          
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || rating === 0}>
              {isSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
              Post Review
            </Button>
          </div>
        </form>
      )}

      {userId && hasReviewed && (
        <div className="bg-primary/10 text-primary p-4 rounded-lg font-medium text-center text-sm">
          Thanks for reviewing this novel!
        </div>
      )}

      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No reviews yet. Be the first!</div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border border-border p-6 rounded-2xl bg-card shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 bg-muted rounded-full flex items-center justify-center font-bold overflow-hidden border">
                    {review.profiles?.avatar_url ? (
                      <img src={review.profiles.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      (review.profiles?.full_name || review.profiles?.username || "?").charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">{review.profiles?.full_name || review.profiles?.username || "Unknown"}</div>
                    <div className="text-xs text-muted-foreground" suppressHydrationWarning>
                      {new Date(review.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 text-primary">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`size-4 ${i < review.rating ? "fill-current" : "text-muted-foreground/30"}`} />
                  ))}
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{review.review_text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
