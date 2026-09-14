import { createClient } from '@/lib/supabase/server'
import type { ProfileRow } from '@/types/database.types'

/**
 * Data Access Layer: Profiles
 * Centralizes reusable domain-level queries for user profiles.
 */

export async function getProfileById(userId: string): Promise<ProfileRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) return null
  return data
}

export async function getCurrentProfile(): Promise<ProfileRow | null> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null

  return getProfileById(user.id)
}
