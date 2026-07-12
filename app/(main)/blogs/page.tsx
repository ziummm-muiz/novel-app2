import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, PenTool, ArrowRight } from "lucide-react"

// Helper component to render a list of blogs
function BlogList({ blogs, emptyTitle, emptyDesc }: { blogs: any[], emptyTitle: string, emptyDesc: string }) {
  if (!blogs || blogs.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-center bg-card/50 backdrop-blur-sm border border-border rounded-3xl shadow-sm">
        <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
          <PenTool className="size-10 text-primary/60" />
        </div>
        <h3 className="text-2xl font-bold mb-2">{emptyTitle}</h3>
        <p className="text-muted-foreground max-w-sm mb-6">{emptyDesc}</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      {blogs.map((blog) => {
        const authorName = blog.profiles?.username || "Unknown Author";
        const avatarUrl = blog.profiles?.avatar_url;
        
        return (
          <Link href={`/blogs/${blog.id}`} key={blog.id} className="block group">
            <Card className="relative overflow-hidden border-border/50 bg-card hover:bg-card/80 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 group-hover:border-primary/30">
              
              {/* Subtle accent gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <CardContent className="p-8 relative z-10 flex flex-col sm:flex-row gap-8">
                
                {/* Author Info Column */}
                <div className="flex flex-col sm:items-center sm:w-32 shrink-0 border-b sm:border-b-0 sm:border-r border-border pb-6 sm:pb-0 sm:pr-8">
                  <div className="size-14 rounded-full bg-muted border-2 border-background shadow-sm overflow-hidden mb-3">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={authorName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-lg">
                        {authorName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="font-bold text-sm text-center line-clamp-2">{authorName}</span>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 font-medium">
                    <Calendar className="size-3" />
                    <time>{new Date(blog.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</time>
                  </div>
                </div>

                {/* Content Column */}
                <div className="flex-1 flex flex-col justify-center">
                  <h3 className="text-2xl font-black mb-3 text-foreground group-hover:text-primary transition-colors leading-tight">
                    {blog.title}
                  </h3>
                  
                  <p className="text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                    {blog.content.replace(/[#*`_]/g, '').substring(0, 200)}
                  </p>

                  <div className="mt-auto flex items-center text-sm font-bold text-primary group-hover:translate-x-2 transition-transform duration-300 w-fit">
                    Read Article <ArrowRight className="ml-2 size-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

export default async function BlogsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // 1. Fetch Discover Blogs (Global feed)
  const { data: discoverBlogs } = await supabase
    .from("blogs")
    .select(`
      *,
      profiles:author_id(username, full_name, avatar_url)
    `)
    .order("created_at", { ascending: false })
    .limit(20)

  // 2. Fetch Following Blogs (if logged in)
  let followingBlogs: any[] = []
  if (user) {
    const { data: follows } = await supabase
      .from("followers")
      .select("following_id")
      .eq("follower_id", user.id)

    const followingIds = follows?.map(f => f.following_id) || []

    if (followingIds.length > 0) {
      const { data } = await supabase
        .from("blogs")
        .select(`
          *,
          profiles:author_id(username, full_name, avatar_url)
        `)
        .in("author_id", followingIds)
        .order("created_at", { ascending: false })
        .limit(20)
      
      if (data) followingBlogs = data
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-16 animate-in fade-in duration-700 min-h-screen">
      <header className="mb-16 text-center relative">
        <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[200px] bg-primary/10 blur-[100px] rounded-full"></div>
        </div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/70">
          Community Blogs
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
          Read the latest updates, stories, and announcements directly from your favorite authors.
        </p>
      </header>

      <Tabs defaultValue={user ? "following" : "discover"} className="w-full">
        <div className="flex justify-center mb-12">
          <TabsList className="grid w-full max-w-md grid-cols-2 h-14 items-center bg-muted/50 backdrop-blur-md rounded-full p-1 border border-border shadow-inner">
            <TabsTrigger value="following" disabled={!user} className="rounded-full h-full text-base font-bold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md transition-all">Following</TabsTrigger>
            <TabsTrigger value="discover" className="rounded-full h-full text-base font-bold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md transition-all">Discover</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="following" className="mt-0 outline-none">
          <BlogList 
            blogs={followingBlogs} 
            emptyTitle={user ? "Quiet Feed" : "Join the Community"}
            emptyDesc={
              followingBlogs.length === 0 && user
                ? "The authors you follow haven't posted any blogs yet. Head over to Discover to find new voices."
                : "Log in and follow authors to build your personalized feed."
            } 
          />
        </TabsContent>

        <TabsContent value="discover" className="mt-0 outline-none">
          <BlogList 
            blogs={discoverBlogs || []} 
            emptyTitle="Nothing Here Yet"
            emptyDesc="No blogs have been published on the platform yet. Be the first to share your thoughts!" 
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
