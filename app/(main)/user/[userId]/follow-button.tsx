'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { UserPlus, UserMinus, Loader2 } from 'lucide-react'
import { toggleFollow } from '@/app/actions/follow'

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing: boolean;
  currentUserId?: string;
}

export function FollowButton({ targetUserId, initialIsFollowing, currentUserId }: FollowButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [error, setError] = useState<string | null>(null)

  // Don't show the follow button on your own profile
  if (currentUserId === targetUserId) {
    return null
  }

  const handleFollow = () => {
    if (!currentUserId) {
      // You could redirect to login here instead of just an error string, 
      // but keeping it simple for now.
      setError('Please login to follow users')
      return
    }

    startTransition(async () => {
      // Optimistic update
      const previousState = isFollowing
      setIsFollowing(!isFollowing)
      setError(null)

      try {
        await toggleFollow(targetUserId, `/user/${targetUserId}`)
      } catch (err: any) {
        // Revert optimistic update on failure
        setIsFollowing(previousState)
        setError(err.message || 'Something went wrong')
      }
    })
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button 
        onClick={handleFollow}
        disabled={isPending}
        variant={isFollowing ? "outline" : "default"}
        className="rounded-full px-6 font-semibold shadow-sm transition-all hover:scale-105"
      >
        {isPending ? (
          <Loader2 className="size-4 mr-2 animate-spin" />
        ) : isFollowing ? (
          <UserMinus className="size-4 mr-2" />
        ) : (
          <UserPlus className="size-4 mr-2" />
        )}
        {isFollowing ? 'Following' : 'Follow'}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}
