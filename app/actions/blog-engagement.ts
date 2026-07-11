'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// 1. Blog Likes
export async function toggleBlogLike(blogId: string, currentPath: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('You must be logged in to like a blog.')
  }

  // Check if already liked
  const { data: existingLike } = await supabase
    .from('blog_likes')
    .select('id')
    .eq('blog_id', blogId)
    .eq('user_id', user.id)
    .single()

  if (existingLike) {
    // Unlike
    await supabase.from('blog_likes').delete().eq('id', existingLike.id)
  } else {
    // Like
    await supabase.from('blog_likes').insert({
      blog_id: blogId,
      user_id: user.id
    })
    
    // Notify blog author
    const { data: blog } = await supabase.from('blogs').select('author_id, title').eq('id', blogId).single()
    if (blog && blog.author_id !== user.id) {
      await supabase.from('notifications').insert({
        user_id: blog.author_id,
        title: 'New Blog Like',
        content: `Someone liked your blog post "${blog.title}".`,
        link: `/blogs/${blogId}`
      })
    }
  }

  revalidatePath(currentPath)
}

// 2. Add Comment
export async function addComment(blogId: string, content: string, parentId: string | null, currentPath: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('You must be logged in to comment.')
  }

  const { data: profile } = await supabase.from('profiles').select('is_restricted').eq('id', user.id).single()
  if (profile?.is_restricted) {
    throw new Error('Your account is restricted from commenting.')
  }

  if (!content.trim()) {
    throw new Error('Comment cannot be empty.')
  }

  const { error } = await supabase.from('blog_comments').insert({
    blog_id: blogId,
    user_id: user.id,
    content: content.trim(),
    parent_id: parentId
  })

  if (error) {
    console.error('Error adding comment:', error)
    throw new Error('Failed to post comment.')
  }

  // Notify authors
  if (parentId) {
    const { data: parentComment } = await supabase.from('blog_comments').select('user_id').eq('id', parentId).single()
    if (parentComment && parentComment.user_id !== user.id) {
      await supabase.from('notifications').insert({
        user_id: parentComment.user_id,
        title: 'New Reply',
        content: `Someone replied to your comment on a blog post.`,
        link: `/blogs/${blogId}`
      })
    }
  } else {
    const { data: blog } = await supabase.from('blogs').select('author_id, title').eq('id', blogId).single()
    if (blog && blog.author_id !== user.id) {
      await supabase.from('notifications').insert({
        user_id: blog.author_id,
        title: 'New Comment',
        content: `Someone commented on your blog post "${blog.title}".`,
        link: `/blogs/${blogId}`
      })
    }
  }

  revalidatePath(currentPath)
}

// 3. Delete Comment
export async function deleteComment(commentId: string, currentPath: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('You must be logged in to delete a comment.')
  }

  const { error } = await supabase
    .from('blog_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id) // Ensure only author can delete

  if (error) {
    throw new Error('Failed to delete comment.')
  }

  revalidatePath(currentPath)
}

// 4. Toggle Comment Like
export async function toggleCommentLike(commentId: string, currentPath: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('You must be logged in to like a comment.')
  }

  const { data: existingLike } = await supabase
    .from('blog_comment_likes')
    .select('id')
    .eq('comment_id', commentId)
    .eq('user_id', user.id)
    .single()

  if (existingLike) {
    await supabase.from('blog_comment_likes').delete().eq('id', existingLike.id)
  } else {
    await supabase.from('blog_comment_likes').insert({
      comment_id: commentId,
      user_id: user.id
    })
    
    // Notify comment author
    const { data: comment } = await supabase.from('blog_comments').select('user_id, blog_id').eq('id', commentId).single()
    if (comment && comment.user_id !== user.id) {
      await supabase.from('notifications').insert({
        user_id: comment.user_id,
        title: 'New Like',
        content: `Someone liked your comment.`,
        link: `/blogs/${comment.blog_id}`
      })
    }
  }

  revalidatePath(currentPath)
}
