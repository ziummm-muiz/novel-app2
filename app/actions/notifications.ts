'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getUnreadNotificationsCount() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) {
    console.error('Error fetching unread notifications count:', error)
    return 0
  }

  return count || 0
}

export async function markNotificationAsRead(notificationId: string, currentPath: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error marking notification as read:', error)
    throw new Error('Failed to mark notification as read')
  }

  revalidatePath(currentPath)
}

export async function markAllNotificationsAsRead(currentPath: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) {
    console.error('Error marking all notifications as read:', error)
    throw new Error('Failed to mark all notifications as read')
  }

  revalidatePath(currentPath)
}

export async function createNotification(userId: string, title: string, content: string, link?: string) {
  const supabase = await createClient()

  // We don't throw error if insertion fails because notifications are non-critical
  // and we don't want to break the main action (like posting a comment)
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    title,
    content,
    link
  })

  if (error) {
    console.error('Error creating notification:', error)
  }
}

