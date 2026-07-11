import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import NovelReviews from "@/components/web/novel-reviews";
import CommentsSection from "@/components/web/comments-section";

export default async function NovelPage({ params }: { params: Promise<{ novelId: string }> }) {
  const { novelId } = await params;
  const supabase = await createClient();

  const { data: novel, error: novelError } = await supabase
    .from("novels")
    .select(`
      *,
      profiles:author_id(full_name, username)
    `)
    .eq("id", novelId)
    .is("deleted_at", null)
    .single();

  if (novelError || !novel) {
    notFound();
  }

  const { data: chapters } = await supabase
    .from("chapters")
    .select("chapter_number, title, id, published_at")
    .eq("novel_id", novelId)
    .is("deleted_at", null)
    .order("chapter_number", { ascending: true });

  const { data: { user } } = await supabase.auth.getUser();

  const { data: reviews } = await supabase
    .from("reviews")
    .select(`*, profiles(username, full_name, avatar_url)`)
    .eq("novel_id", novelId)
    .order("created_at", { ascending: false });

  const { data: comments } = await supabase
    .from("comments")
    .select(`*, profiles(username, full_name, avatar_url), comment_likes(user_id)`)
    .eq("target_id", novelId)
    .order("created_at", { ascending: false });

  const authorName = novel.profiles?.full_name || novel.profiles?.username || "Unknown Author";
  
  const firstChapter = chapters?.[0]?.chapter_number;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="w-full md:w-72 shrink-0 aspect-2/3 rounded-lg overflow-hidden border border-border shadow-2xl shadow-primary/10 bg-muted relative group">
          {novel.cover_url ? (
            <img src={novel.cover_url} alt={novel.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Cover</div>
          )}
        </div>
        
        <div className="flex-1 space-y-6 pt-2">
          <div>
            <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight">{novel.title}</h1>
            <p className="text-xl text-muted-foreground font-medium flex items-center gap-2">
              By <Link href={`/user/${novel.author_id}`} className="text-foreground hover:text-primary transition-colors hover:underline decoration-primary underline-offset-4">{authorName}</Link>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {novel.genres?.map((genre: string) => (
              <span key={genre} className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full font-medium">
                {genre}
              </span>
            ))}
          </div>

          {firstChapter !== undefined && (
            <Link href={`/novel/${novel.id}/chapter/${firstChapter}`} className="inline-block mt-4">
              <Button size="lg" className="rounded-full px-8 text-base font-semibold shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                <BookOpen className="mr-2 size-5" />
                Start Reading
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-12 pt-8">
        <div className="md:col-span-2 space-y-10">
          {/* Synopsis */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold border-b border-border pb-2">Synopsis</h2>
            <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-lg">
              {novel.synopsis}
            </div>
          </div>

          {/* Chapters List */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold border-b border-border pb-2">Table of Contents</h2>
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              {chapters && chapters.length > 0 ? (
                <div className="divide-y divide-border">
                  {chapters.map((chapter) => (
                    <Link 
                      key={chapter.id} 
                      href={`/novel/${novel.id}/chapter/${chapter.chapter_number}`}
                      className="flex items-center justify-between p-5 hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-6">
                        <span className="text-muted-foreground font-medium text-sm min-w-3rem">Ch. {chapter.chapter_number}</span>
                        <span className="font-medium text-foreground group-hover:text-primary transition-colors">{chapter.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        {new Date(chapter.published_at).toLocaleDateString()}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  No chapters have been published yet.
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold mb-4">Novel Stats</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Chapters</span>
                <span className="font-bold text-base">{chapters?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <span className="font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded text-xs">Ongoing</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-16 space-y-16">
        <NovelReviews novelId={novelId} initialReviews={reviews || []} userId={user?.id} />
        
        <div className="bg-muted/10 p-8 rounded-3xl border border-border">
          <CommentsSection targetId={novelId} initialComments={comments || []} userId={user?.id} />
        </div>
      </div>
    </div>
  );
}
