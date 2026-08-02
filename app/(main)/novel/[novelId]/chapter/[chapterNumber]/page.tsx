import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import CommentsSection from "@/components/web/comments-section";

export default async function ChapterPage({ params }: { params: Promise<{ novelId: string, chapterNumber: string }> }) {
  const { novelId, chapterNumber } = await params;
  const supabase = await createClient();
  const chapterNum = parseInt(chapterNumber);

  // Fetch the current chapter
  const { data: chapter, error: chapterError } = await supabase
    .from("chapters")
    .select("*, novels(title)")
    .eq("novel_id", novelId)
    .eq("chapter_number", chapterNum)
    .single();

  if (chapterError || !chapter) {
    notFound();
  }

  // Record reading history if logged in
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  if (user) {
    await supabase.from("reading_history").upsert({
      user_id: user.id,
      novel_id: novelId,
      chapter_id: chapter.id,
      last_read_at: new Date().toISOString()
    });
  }

  // Find prev/next chapter numbers
  const { data: allChapters } = await supabase
    .from("chapters")
    .select("chapter_number")
    .eq("novel_id", novelId)
    .is("deleted_at", null)
    .order("chapter_number", { ascending: true });

  const chaptersArray = allChapters?.map(c => c.chapter_number) || [];
  
  const prevChapter = chaptersArray.includes(chapterNum - 1) ? chapterNum - 1 : null;
  const nextChapter = chaptersArray.includes(chapterNum + 1) ? chapterNum + 1 : null;

  // Fetch comments
  const { data: comments } = await supabase
    .from("comments")
    .select(`*, profiles(username, full_name, avatar_url), comment_likes(user_id)`)
    .eq("target_id", chapter.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 min-h-screen flex flex-col animate-in fade-in duration-500">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-border pb-6 mb-10">
        <Link href={`/novel/${novelId}`} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 font-medium">
          <Menu className="size-5" />
          {chapter.novels?.title || "Novel Home"}
        </Link>
        <div className="flex items-center gap-2">
          {prevChapter ? (
            <Link href={`/novel/${novelId}/chapter/${prevChapter}`}>
              <Button variant="outline" size="sm" className="rounded-full"><ChevronLeft className="size-4 mr-1"/> Prev</Button>
            </Link>
          ) : (
            <Button variant="outline" size="sm" className="rounded-full" disabled><ChevronLeft className="size-4 mr-1"/> Prev</Button>
          )}
          
          {nextChapter ? (
            <Link href={`/novel/${novelId}/chapter/${nextChapter}`}>
              <Button variant="outline" size="sm" className="rounded-full">Next <ChevronRight className="size-4 ml-1"/></Button>
            </Link>
          ) : (
            <Button variant="outline" size="sm" className="rounded-full" disabled>Next <ChevronRight className="size-4 ml-1"/></Button>
          )}
        </div>
      </div>

      {/* Chapter Content */}
      <article className="flex-1">
        <header className="mb-14 text-center space-y-4">
          <h2 className="text-muted-foreground font-semibold uppercase tracking-widest text-sm">Chapter {chapter.chapter_number}</h2>
          <h1 className="text-3xl md:text-5xl font-black leading-tight text-foreground/90">{chapter.title}</h1>
        </header>

        <div className="text-lg md:text-xl text-foreground/80 leading-[1.8] space-y-6 [&>p]:mb-6 [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:mt-10 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mt-8 [&>h3]:text-xl [&>h3]:font-bold [&>ul]:list-disc [&>ul]:ml-6 [&>ol]:list-decimal [&>ol]:ml-6 [&>blockquote]:border-l-4 [&>blockquote]:border-primary/50 [&>blockquote]:pl-6 [&>blockquote]:italic [&>blockquote]:text-muted-foreground">
          <ReactMarkdown>
            {chapter.content_url || ""}
          </ReactMarkdown>
        </div>
      </article>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between border-t border-border pt-8 mt-16">
        {prevChapter ? (
          <Link href={`/novel/${novelId}/chapter/${prevChapter}`}>
            <Button variant="secondary" size="lg" className="rounded-full shadow-sm hover:scale-105 transition-transform"><ChevronLeft className="size-5 mr-2"/> Previous Chapter</Button>
          </Link>
        ) : (
          <div />
        )}
        
        {nextChapter ? (
          <Link href={`/novel/${novelId}/chapter/${nextChapter}`}>
            <Button size="lg" className="rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform">Next Chapter <ChevronRight className="size-5 ml-2"/></Button>
          </Link>
        ) : (
          <div />
        )}
      </div>

      {/* Comments Section */}
      <div className="mt-16 bg-muted/10 p-8 rounded-3xl border border-border">
        <CommentsSection targetId={chapter.id} initialComments={comments || []} userId={user?.id} />
      </div>

    </div>
  );
}
