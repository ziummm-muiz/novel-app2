import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { User, Calendar } from "lucide-react"

// Helper component to render a list of blogs
function BlogList({ blogs, emptyMessage }: { blogs: any[], emptyMessage: string }) {
  if (!blogs || blogs.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground border rounded-lg bg-muted/20 border-dashed">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      {blogs.map((blog) => (
        <Card key={blog.id} className="overflow-hidden hover:border-primary/50 transition-colors">
          <CardContent className="p-6">
            <Link href={`/blogs/${blog.id}`} className="block group">
              <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {blog.title}
              </h3>
            </Link>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <Link href={`/user/${blog.author_id}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                <User className="size-3" />
                <span className="font-medium">
                  {blog.profiles?.full_name || blog.profiles?.username || "Unknown Author"}
                </span>
              </Link>
              <div className="flex items-center gap-1">
                <Calendar className="size-3" />
                <span>{new Date(blog.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <p className="text-muted-foreground line-clamp-3">
              {/* Strip some markdown or just show raw string for preview */}
              {blog.content.substring(0, 300)}...
            </p>
          </CardContent>
        </Card>
      ))}
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
      profiles:author_id(username, full_name)
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
          profiles:author_id(username, full_name)
        `)
        .in("author_id", followingIds)
        .order("created_at", { ascending: false })
        .limit(20)
      
      if (data) followingBlogs = data
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 animate-in fade-in duration-500 min-h-screen">
      <header className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Community Blogs</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Read the latest updates, stories, and announcements directly from your favorite authors.
        </p>
      </header>

      <Tabs defaultValue={user ? "following" : "discover"} className="w-full">
        <div className="flex justify-center mb-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="following" disabled={!user}>Following</TabsTrigger>
            <TabsTrigger value="discover">Discover</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="following" className="mt-0">
          <BlogList 
            blogs={followingBlogs} 
            emptyMessage={
              followingBlogs.length === 0 && user
                ? "The authors you follow haven't posted any blogs yet."
                : "Log in and follow authors to see their updates here."
            } 
          />
        </TabsContent>

        <TabsContent value="discover" className="mt-0">
          <BlogList 
            blogs={discoverBlogs || []} 
            emptyMessage="No blogs have been published on the platform yet." 
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
