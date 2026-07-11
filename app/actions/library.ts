"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateLibraryStatus(novelId: string, status: 'reading' | 'completed' | 'favourite' | 'none') {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("You must be logged in to manage your library.")

  if (status === 'none') {
    // Remove from library
    const { error } = await supabase
      .from('user_library')
      .delete()
      .eq('user_id', user.id)
      .eq('novel_id', novelId)

    if (error) throw new Error("Failed to remove from library.")
  } else {
    // Upsert into library
    // Checking if it already exists to use UPDATE vs INSERT, or we can rely on ON CONFLICT
    // Since Supabase `upsert` requires the primary key or unique constraint
    // The unique constraint would be (user_id, novel_id). Let's just do a select then update/insert to be safe
    // in case the unique constraint isn't perfectly set up yet by the user.

    const { data: existing } = await supabase
      .from('user_library')
      .select('id')
      .eq('user_id', user.id)
      .eq('novel_id', novelId)
      .single()

    if (existing) {
      const { error } = await supabase
        .from('user_library')
        .update({ status })
        .eq('id', existing.id)
      
      if (error) throw new Error("Failed to update library status.")
    } else {
      const { error } = await supabase
        .from('user_library')
        .insert({
          user_id: user.id,
          novel_id: novelId,
          status
        })

      if (error) throw new Error("Failed to add to library.")
    }
  }

  revalidatePath(`/novel/${novelId}`)
  revalidatePath(`/library`)
  return { success: true }
}
