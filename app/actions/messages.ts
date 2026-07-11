'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function sendMessage(receiverId: string, messageText: string, currentPath: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('You must be logged in to send a message.')
  }

  const { data: profile } = await supabase.from('profiles').select('is_restricted').eq('id', user.id).single()
  if (profile?.is_restricted) {
    throw new Error('Your account is restricted from sending messages.')
  }

  if (!messageText.trim()) {
    throw new Error('Message cannot be empty.')
  }

  const { error } = await supabase.from('messages').insert({
    sender_id: user.id,
    receiver_id: receiverId,
    message_text: messageText.trim()
  })

  if (error) {
    console.error('Error sending message:', error)
    throw new Error('Failed to send message.')
  }

  revalidatePath(currentPath)
}

export async function markAsRead(senderId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return
  }

  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('receiver_id', user.id)
    .eq('sender_id', senderId)
    .eq('is_read', false)

  if (error) {
    console.error('Error marking messages as read:', error)
  }
}
