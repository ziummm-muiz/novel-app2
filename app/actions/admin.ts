"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Restrict or unrestrict a user
export async function toggleUserRestriction(userId: string, isRestricted: boolean) {
  const supabase = await createClient()

  // 1. Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("You must be logged in to perform this action.")
  }

  // 2. Check if current user is admin
  const { data: currentProfile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (profileError || !currentProfile?.is_admin) {
    throw new Error("Unauthorized: Only admins can manage users.")
  }

  // 3. Update the target user's is_restricted status
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ is_restricted: isRestricted })
    .eq('id', userId)

  if (updateError) {
    console.error("Error updating user restriction:", updateError)
    throw new Error("Failed to update user restriction status.")
  }

  revalidatePath("/dashboard/users")
}
