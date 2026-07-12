import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Edit, BookOpen } from "lucide-react"

export default async function DashboardBlogsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: blogs, error } = await supabase
    .from("blogs")
    .select("*")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="animate-in fade-in duration-700 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      
      {/* Premium Header */}
      <div className="relative mb-8 p-8 rounded-3xl overflow-hidden bg-card border border-border/50 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 z-10">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-background"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 -z-10"></div>
        
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 text-foreground">Your Blogs</h1>
          <p className="text-muted-foreground font-medium max-w-lg text-lg">
            Manage your written posts, share updates, and engage with your readers.
          </p>
        </div>
        <Link href="/dashboard/blogs/new" className="shrink-0 w-full sm:w-auto">
          <Button size="lg" className="w-full sm:w-auto rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5">
            <Plus className="mr-2 h-5 w-5" /> Create New Post
          </Button>
        </Link>
      </div>

      {!blogs || blogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl bg-muted/10 border border-border/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/5 blur-[80px] rounded-full pointer-events-none"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 border border-primary/20 shadow-inner">
              <Edit className="size-10 text-primary/60" />
            </div>
            <h3 className="text-2xl font-black mb-2 text-foreground">No Blog Posts Yet</h3>
            <p className="text-muted-foreground mb-8 max-w-sm font-medium text-lg leading-relaxed">
              Start sharing your thoughts, announcements, or writing tips with your readers.
            </p>
            <Link href="/dashboard/blogs/new">
              <Button size="lg" className="rounded-full shadow-md shadow-primary/20">Write Your First Post</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-5">
          {blogs.map((blog) => (
            <div key={blog.id} className="group relative rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/40 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/5 flex flex-col sm:flex-row">
              <div className="sm:w-56 h-40 sm:h-auto shrink-0 bg-muted relative overflow-hidden">
                {blog.cover_image ? (
                   <img src={blog.cover_image} alt={blog.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                   <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center transition-transform duration-700 group-hover:scale-105">
                     <BookOpen className="size-10 text-primary/30" />
                   </div>
                )}
              </div>
              <div className="p-6 flex-1 flex flex-col justify-center">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div>
                    <h3 className="font-bold text-xl mb-1.5 group-hover:text-primary transition-colors line-clamp-1">{blog.title}</h3>
                    <p className="text-sm text-muted-foreground font-medium mb-3">Published on {new Date(blog.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                    {blog.excerpt && <p className="text-[15px] text-muted-foreground line-clamp-2 leading-relaxed">{blog.excerpt}</p>}
                  </div>
                  <Link href={`/blogs/${blog.id}`} className="shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                    <Button variant="secondary" className="w-full sm:w-auto rounded-full shadow-sm hover:shadow-md transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                      View Post
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
