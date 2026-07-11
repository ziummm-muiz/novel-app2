'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleFollow(targetUserId: string, currentPath: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be logged in to follow users.')
  }

  if (user.id === targetUserId) {
    throw new Error('You cannot follow yourself.')
  }

  // Check if already following
  const { data: existingFollow } = await supabase
    .from('followers')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId)
    .single()

  if (existingFollow) {
    // Unfollow
    const { error } = await supabase
      .from('followers')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)

    if (error) {
      console.error('Error unfollowing:', error)
      throw new Error('Failed to unfollow user.')
    }
  } else {
    // Follow
    const { error } = await supabase
      .from('followers')
      .insert({
        follower_id: user.id,
        following_id: targetUserId
      })

    if (error) {
      console.error('Error following:', error)
      throw new Error('Failed to follow user.')
    }

    // Get follower's username for the notification
    const { data: followerProfile } = await supabase.from('profiles').select('username').eq('id', user.id).single()
    const followerName = followerProfile?.username || 'Someone'

    // Notify target user
    await supabase.from('notifications').insert({
      user_id: targetUserId,
      title: 'New Follower',
      content: `${followerName} started following you!`,
      link: `/user/${user.id}`
    })
  }

  // Revalidate the path so the UI updates
  revalidatePath(currentPath)
}
