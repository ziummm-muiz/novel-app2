'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createBlog(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('You must be logged in to create a blog.')
  }

  const { data: profile } = await supabase.from('profiles').select('is_restricted').eq('id', user.id).single()
  if (profile?.is_restricted) {
    throw new Error('Your account is restricted from posting.')
  }

  const title = formData.get('title') as string
  const content = formData.get('content') as string

  if (!title || !content) {
    throw new Error('Title and content are required.')
  }

  const { data: blog, error } = await supabase
    .from('blogs')
    .insert({
      author_id: user.id,
      title,
      content,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating blog:', error)
    throw new Error('Failed to save blog post.')
  }

  revalidatePath('/blogs')
  revalidatePath('/dashboard/blogs')
  revalidatePath(`/user/${user.id}`)
  
  redirect('/dashboard/blogs')
}

export async function deleteBlog(blogId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('You must be logged in to delete a blog.')
  }

  const { error } = await supabase
    .from('blogs')
    .delete()
    .eq('id', blogId)
    .eq('author_id', user.id) // Extra safety check

  if (error) {
    console.error('Error deleting blog:', error)
    throw new Error('Failed to delete blog post.')
  }

  revalidatePath('/blogs')
  revalidatePath('/dashboard/blogs')
  revalidatePath(`/user/${user.id}`)
}
