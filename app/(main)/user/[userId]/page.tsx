import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FollowButton } from './follow-button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Users, PenTool, LayoutGrid } from 'lucide-react'

export default async function PublicProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const supabase = await createClient()

  // Get current logged-in user to see if they are following this profile
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  // 1. Fetch Profile Info
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    notFound()
  }

  // 2. Fetch User's Novels
  const { data: novels } = await supabase
    .from('novels')
    .select('*')
    .eq('author_id', userId)
    .order('created_at', { ascending: false })

  // 2.5 Fetch User's Blogs
  const { data: blogs } = await supabase
    .from('blogs')
    .select('*')
    .eq('author_id', userId)
    .order('created_at', { ascending: false })

  // 3. Fetch Followers and Following count
  // We can do this efficiently using count
  const { count: followersCount } = await supabase
    .from('followers')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId)

  const { count: followingCount } = await supabase
    .from('followers')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId)

  // 4. Check if current user is following this profile
  let isFollowing = false
  if (currentUser) {
    const { data: followStatus } = await supabase
      .from('followers')
      .select('follower_id')
      .eq('follower_id', currentUser.id)
      .eq('following_id', userId)
      .single()
      
    if (followStatus) {
      isFollowing = true
    }
  }

  const displayName = profile.full_name || profile.username || "Anonymous Writer"
  const displayUsername = profile.username ? `@${profile.username}` : ""

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-500">
      
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 bg-card border border-border rounded-3xl p-8 shadow-sm">
        {/* Avatar */}
        <div className="size-32 rounded-full border-4 border-background shadow-lg overflow-hidden shrink-0 bg-muted flex items-center justify-center">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl font-bold text-muted-foreground">{displayName.charAt(0).toUpperCase()}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 text-center md:text-left space-y-4 pt-2">
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">{displayName}</h1>
            {displayUsername && <p className="text-muted-foreground font-medium">{displayUsername}</p>}
          </div>

          <div className="flex items-center justify-center md:justify-start gap-6 text-sm font-medium">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <span className="text-foreground">{followersCount || 0}</span>
              <span className="text-muted-foreground">Followers</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-foreground">{followingCount || 0}</span>
              <span className="text-muted-foreground">Following</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <FollowButton 
            targetUserId={userId} 
            initialIsFollowing={isFollowing} 
            currentUserId={currentUser?.id} 
          />
        </div>
      </div>

      {/* Profile Content Tabs */}
      <Tabs defaultValue="novels" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="novels" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <BookOpen className="size-4 mr-2" />
            Novels ({novels?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="blogs" className="rounded-full">
            <PenTool className="size-4 mr-2" />
            Blogs ({blogs?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="novels" className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <LayoutGrid className="size-5 text-primary" />
            Published Works
          </h2>
          
          {novels && novels.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {novels.map((novel) => (
                <Link key={novel.id} href={`/novel/${novel.id}`} className="group space-y-3">
                  <div className="aspect-2/3 rounded-lg border border-border bg-muted overflow-hidden relative shadow-sm group-hover:shadow-xl group-hover:shadow-primary/10 transition-all duration-300">
                    {novel.cover_url ? (
                      <img src={novel.cover_url} alt={novel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                        <BookOpen className="size-8 text-muted-foreground/50 mb-2" />
                        <span className="text-xs text-muted-foreground">No Cover</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                      {novel.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/30 border border-border border-dashed rounded-2xl">
              <BookOpen className="size-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-foreground">No novels yet</h3>
              <p className="text-muted-foreground mt-1">This author hasn't published any novels.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="blogs" className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <PenTool className="size-5 text-primary" />
            Latest Posts
          </h2>
          
          {blogs && blogs.length > 0 ? (
            <div className="grid gap-4">
              {blogs.map((blog) => (
                <div key={blog.id} className="p-6 border border-border bg-card rounded-xl hover:border-primary/50 transition-colors">
                  <Link href={`/blogs/${blog.id}`} className="block group mb-2">
                    <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                      {blog.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-muted-foreground mb-4">
                    Published on {new Date(blog.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-muted-foreground line-clamp-2">
                    {blog.content.substring(0, 200)}...
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/30 border border-border border-dashed rounded-2xl">
              <PenTool className="size-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-foreground">No blogs yet</h3>
              <p className="text-muted-foreground mt-1">This author hasn't published any blogs.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

    </div>
  )
}
