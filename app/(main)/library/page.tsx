import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, CheckCircle, Star, ArrowRight } from "lucide-react"

// Helper component for empty states
function EmptyState({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-2xl bg-muted/20">
      <Icon className="size-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
      <Link href="/categories" className="mt-6 text-primary hover:underline font-medium inline-flex items-center">
        Explore Novels <ArrowRight className="size-4 ml-1" />
      </Link>
    </div>
  )
}

export default async function LibraryPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // 1. Fetch user library with novel details
  const { data: libraryItems } = await supabase
    .from("user_library")
    .select(`
      id,
      status,
      novel_id,
      novels (
        id,
        title,
        cover_url,
        profiles (username, full_name)
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // 2. Fetch reading history (for "Continue Reading" button)
  const { data: historyItems } = await supabase
    .from("reading_history")
    .select("novel_id, last_chapter_read, last_read_at")
    .eq("user_id", user.id)

  const historyMap = new Map()
  historyItems?.forEach(h => historyMap.set(h.novel_id, h.last_chapter_read))

  const reading = libraryItems?.filter(item => item.status === 'reading') || []
  const completed = libraryItems?.filter(item => item.status === 'completed') || []
  const favourites = libraryItems?.filter(item => item.status === 'favourite') || []

  // Helper to render novel cards
  const renderNovels = (items: any[], type: 'reading' | 'completed' | 'favourite') => {
    if (items.length === 0) {
      if (type === 'reading') return <EmptyState icon={BookOpen} title="Nothing here yet" description="Books you are currently reading will appear here." />
      if (type === 'completed') return <EmptyState icon={CheckCircle} title="No completed books" description="Books you finish will be saved here." />
      if (type === 'favourite') return <EmptyState icon={Star} title="No favourites yet" description="Mark your top picks as favourites to see them here." />
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {items.map((item) => {
          const novel = item.novels
          if (!novel) return null
          
          const authorName = novel.profiles?.full_name || novel.profiles?.username || "Unknown"
          const lastChapter = historyMap.get(novel.id)

          return (
            <Card key={item.id} className="overflow-hidden group hover:border-primary/50 transition-colors bg-card flex flex-col">
              <Link href={`/novel/${novel.id}`} className="block relative aspect-2/3 bg-muted">
                {novel.cover_url ? (
                  <img src={novel.cover_url} alt={novel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-4">
                    <BookOpen className="size-8 text-muted-foreground/30" />
                  </div>
                )}
              </Link>
              <CardContent className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <Link href={`/novel/${novel.id}`} className="font-bold line-clamp-1 hover:text-primary transition-colors">
                    {novel.title}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">By {authorName}</p>
                </div>
                
                {/* Continue Reading Button */}
                {type === 'reading' && lastChapter && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <Link href={`/novel/${novel.id}/chapter/${lastChapter}`} className="text-xs font-semibold text-primary flex items-center hover:underline group/btn">
                      Continue Ch. {lastChapter}
                      <ArrowRight className="size-3 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 animate-in fade-in duration-500 min-h-screen">
      <header className="mb-10">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">Your Library</h1>
        <p className="text-xl text-muted-foreground">Track your reading progress and favorite stories.</p>
      </header>

      <Tabs defaultValue="reading" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-8 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="reading" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Reading ({reading.length})</TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Completed ({completed.length})</TabsTrigger>
          <TabsTrigger value="favourites" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Favourites ({favourites.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="reading" className="mt-0">
          {renderNovels(reading, 'reading')}
        </TabsContent>

        <TabsContent value="completed" className="mt-0">
          {renderNovels(completed, 'completed')}
        </TabsContent>

        <TabsContent value="favourites" className="mt-0">
          {renderNovels(favourites, 'favourite')}
        </TabsContent>
      </Tabs>
    </div>
  )
}
