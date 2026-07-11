"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createNovel(formData: FormData) {
  const supabase = await createClient()
  
  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("You must be logged in to create a novel")
  }

  // 2. Extract form data
  const title = formData.get("title") as string
  const synopsis = formData.get("synopsis") as string
  const coverFile = formData.get("cover") as File
  const genresString = formData.get("genres") as string 

  if (!title || !synopsis || !coverFile || coverFile.size === 0) {
    throw new Error("Missing required fields (Title, Synopsis, or Cover Image)")
  }

  // 3. Upload Cover Image to Supabase Storage
  const fileExt = coverFile.name.split('.').pop()
  const fileName = `${user.id}-${Date.now()}.${fileExt}`
  const { error: uploadError } = await supabase.storage
    .from('covers')
    .upload(fileName, coverFile)

  if (uploadError) {
    console.error("Storage upload error:", uploadError)
    throw new Error("Failed to upload cover image. Please ensure the 'covers' storage bucket exists.")
  }

  // Get public URL of the uploaded image
  const { data: { publicUrl } } = supabase.storage
    .from('covers')
    .getPublicUrl(fileName)

  // 4. Ensure profile exists (to prevent foreign key errors)
  await supabase
    .from('profiles')
    .upsert({ id: user.id }, { onConflict: 'id' })

  // 5. Save Novel to Database
  const genres = genresString ? JSON.parse(genresString) : []
  const { data: novel, error: insertError } = await supabase
    .from('novels')
    .insert({
      author_id: user.id,
      title,
      synopsis,
      cover_url: publicUrl,
      genres
    })
    .select()
    .single()

  if (insertError) {
    console.error("Database insert error:", insertError)
    throw new Error("Failed to save novel to database")
  }

  // 5. Redirect to chapter management
  revalidatePath("/dashboard")
  redirect(`/dashboard/write/${novel.id}/chapters`)
}

export async function createChapter(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("You must be logged in")
  }

  const novelId = formData.get("novelId") as string
  const title = formData.get("title") as string
  const chapterNumberStr = formData.get("chapterNumber") as string
  const content = formData.get("content") as string

  if (!novelId || !title || !chapterNumberStr || !content) {
    throw new Error("Missing required fields")
  }

  const chapterNumber = parseInt(chapterNumberStr)

  // Validate that the user owns this novel (Security check)
  const { data: novel, error: novelError } = await supabase
    .from('novels')
    .select('author_id')
    .eq('id', novelId)
    .single()

  if (novelError || novel?.author_id !== user.id) {
    throw new Error("Unauthorized: You do not own this novel")
  }

  // Insert Chapter
  // Note: the `chapters` table needs a `content` column for the markdown text
  const { error: insertError } = await supabase
    .from('chapters')
    .insert({
      novel_id: novelId,
      chapter_number: chapterNumber,
      title: title,
      content_url: content, // We will use content_url to store the actual markdown text directly
      status: 'published',
      published_at: new Date().toISOString()
    })

  if (insertError) {
    console.error("Database insert error:", insertError)
    throw new Error("Failed to save chapter")
  }

  revalidatePath(`/dashboard/write/${novelId}/chapters`)
  redirect(`/dashboard/write/${novelId}/chapters`)
}

export async function updateProfileSettings(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("You must be logged in to update settings")
  }

  const fullName = formData.get("fullName") as string
  const username = formData.get("username") as string
  const avatarFile = formData.get("avatar") as File | null

  let avatarUrl = undefined

  if (avatarFile && avatarFile.size > 0) {
    const fileExt = avatarFile.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, avatarFile)

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      throw new Error("Failed to upload avatar image.")
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)
      
    avatarUrl = publicUrl
  }

  const updateData: any = {
    id: user.id, // Required for upsert
    full_name: fullName,
    username: username
  }
  
  if (avatarUrl) {
    updateData.avatar_url = avatarUrl
  }

  const { error } = await supabase
    .from('profiles')
    .upsert(updateData, { onConflict: 'id' })

  if (error) {
    console.error("Error updating profile:", error)
    if (error.code === '23505') { 
      throw new Error("That username is already taken.")
    }
    throw new Error("Failed to update profile settings.")
  }

  revalidatePath("/")
  revalidatePath("/dashboard/settings")
  revalidatePath("/dashboard")
}
