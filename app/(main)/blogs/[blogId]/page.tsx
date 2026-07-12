import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, User, MessageCircle } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import BlogLikeButton from "@/components/web/blog-like-button"
import BlogComments from "@/components/web/blog-comments"

export default async function IndividualBlogPage({ params }: { params: Promise<{ blogId: string }> }) {
  const { blogId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: blog, error } = await supabase
    .from("blogs")
    .select(`
      *,
      profiles:author_id(username, full_name, avatar_url)
    `)
    .eq("id", blogId)
    .single()

  if (error || !blog) {
    notFound()
  }

  const authorName = blog.profiles?.full_name || blog.profiles?.username || "Unknown Author"

  const { count: likesCount } = await supabase
    .from('blog_likes')
    .select('*', { count: 'exact', head: true })
    .eq('blog_id', blogId)

  let hasLiked = false
  if (user) {
    const { data: existingLike } = await supabase
      .from('blog_likes')
      .select('id')
      .eq('blog_id', blogId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (existingLike) hasLiked = true
  }

  const { data: comments } = await supabase
    .from('blog_comments')
    .select(`
      *,
      profiles:user_id(username, full_name, avatar_url),
      blog_comment_likes(user_id)
    `)
    .eq('blog_id', blogId)
    .order('created_at', { ascending: true })

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 min-h-screen flex flex-col animate-in fade-in duration-500">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-border pb-6 mb-10">
        <Link href="/blogs" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 font-medium">
          <ArrowLeft className="size-5" />
          Back to Blogs
        </Link>
      </div>

      {/* Blog Header */}
      <header className="mb-14 space-y-6">
        <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight text-foreground/90">
          {blog.title}
        </h1>
        
        <div className="flex items-center gap-6 text-muted-foreground">
          <Link href={`/user/${blog.author_id}`} className="flex items-center gap-3 hover:text-primary transition-colors group">
            <div className="size-10 rounded-full bg-muted overflow-hidden border border-border flex items-center justify-center shrink-0">
              {blog.profiles?.avatar_url ? (
                <img src={blog.profiles.avatar_url} alt={authorName} className="w-full h-full object-cover" />
              ) : (
                <User className="size-5 text-muted-foreground" />
              )}
            </div>
            <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {authorName}
            </span>
          </Link>
          
          <div className="flex items-center gap-2">
            <Calendar className="size-4" />
            <span>{new Date(blog.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </header>

      {/* Blog Content */}
      <article className="flex-1">
        <div className="text-lg text-foreground/80 leading-[1.8] space-y-6 [&>p]:mb-6 [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:mt-10 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mt-8 [&>h3]:text-xl [&>h3]:font-bold [&>ul]:list-disc [&>ul]:ml-6 [&>ol]:list-decimal [&>ol]:ml-6 [&>blockquote]:border-l-4 [&>blockquote]:border-primary/50 [&>blockquote]:pl-6 [&>blockquote]:italic [&>blockquote]:text-muted-foreground">
          <ReactMarkdown>
            {blog.content}
          </ReactMarkdown>
        </div>
      </article>

      {/* Engagement Actions */}
      <div className="mt-12 flex items-center gap-4 py-4 border-y border-border">
        <BlogLikeButton 
          blogId={blogId} 
          likesCount={likesCount || 0} 
          hasLiked={hasLiked} 
          currentUserId={user?.id} 
        />
        <Button variant="ghost" className="rounded-full gap-2 text-muted-foreground hover:text-foreground">
          <MessageCircle className="size-4" />
          <span className="font-semibold">{comments?.length || 0} Comments</span>
        </Button>
      </div>

      {/* Comment Section */}
      <BlogComments 
        blogId={blogId} 
        comments={comments || []} 
        currentUserId={user?.id} 
      />

    </div>
  )
}
