import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Edit, Trash2 } from "lucide-react"

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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Blogs</h1>
          <p className="text-muted-foreground mt-1">
            Write and manage blog posts to share updates with your readers.
          </p>
        </div>
        <Link href="/dashboard/blogs/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> New Blog Post
          </Button>
        </Link>
      </div>

      {!blogs || blogs.length === 0 ? (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-primary/10 p-3 mb-4">
              <Edit className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No blogs yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              You haven't written any blog posts yet. Start sharing your thoughts with your followers!
            </p>
            <Link href="/dashboard/blogs/new">
              <Button variant="outline">Create your first blog</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {blogs.map((blog) => (
            <Card key={blog.id} className="overflow-hidden">
              <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">
                    {blog.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Published on {new Date(blog.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/blogs/${blog.id}`}>
                    <Button variant="secondary" size="sm">View</Button>
                  </Link>
                  {/* Note: Delete logic requires client side action which we will add later if needed. For now, we focus on creation. */}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
