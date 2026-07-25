import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle, Settings, BookOpen, Pencil } from "lucide-react";
import { notFound } from "next/navigation";
import { DeleteChapterButton } from "./delete-chapter-button";

export default async function ChapterManagementPage({ params }: { params: Promise<{ novelId: string }> }) {
    const { novelId } = await params;
    const supabase = await createClient();
    
    // Verify ownership and get novel details
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return notFound();

    const { data: novel, error: novelError } = await supabase
        .from("novels")
        .select("*")
        .eq("id", novelId)
        .eq("author_id", user.id)
        .single();

    if (novelError || !novel) {
        return notFound();
    }

    // Fetch chapters
    const { data: chapters } = await supabase
        .from("chapters")
        .select("*")
        .eq("novel_id", novelId)
        .is("deleted_at", null)
        .order("chapter_number", { ascending: true });

    return (
        <div className="max-w-5xl mx-auto px-6 py-12">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-muted/30 p-8 rounded-3xl border border-border">
                <div className="flex flex-col sm:flex-row gap-6 sm:items-center flex-1 min-w-0">
                    <div className="w-24 aspect-2/3 bg-muted rounded-md overflow-hidden shrink-0 shadow-sm border border-border hidden sm:block">
                        {novel.cover_url && <img src={novel.cover_url} alt="cover" className="w-full h-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-3xl font-black mb-2 truncate">{novel.title}</h1>
                        <p className="text-muted-foreground mb-4 line-clamp-2 max-w-xl">{novel.synopsis}</p>
                        <div className="flex flex-wrap gap-2">
                            {novel.genres?.map((g: string) => (
                                <span key={g} className="text-[10px] uppercase tracking-widest font-bold bg-primary/10 text-primary px-2 py-1 rounded-sm">
                                    {g}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
                    <Link href={`/dashboard/write/${novelId}/chapters/new`}>
                        <Button className="w-full gap-2">
                            <PlusCircle className="size-4" />
                            Write New Chapter
                        </Button>
                    </Link>
                    <Link href={`/dashboard/write/${novelId}/settings`}>
                        <Button variant="secondary" className="w-full gap-2">
                            <Settings className="size-4" />
                            Novel Settings
                        </Button>
                    </Link>
                    <Link href={`/novel/${novelId}`}>
                        <Button variant="outline" className="w-full gap-2">
                            <BookOpen className="size-4" />
                            View Public Page
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Chapters List */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4">Published Chapters ({chapters?.length || 0})</h2>
                
                {!chapters || chapters.length === 0 ? (
                    <div className="text-center py-16 bg-card border border-dashed border-border rounded-xl">
                        <p className="text-muted-foreground mb-4">You haven't written any chapters yet.</p>
                        <Link href={`/dashboard/write/${novelId}/chapters/new`}>
                            <Button variant="secondary">Start Writing Chapter 1</Button>
                        </Link>
                    </div>
                ) : (
                    chapters.map((chapter) => (
                        <Card key={chapter.id} className="border-border hover:border-primary transition-colors">
                            <CardContent className="p-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center font-black text-xl text-muted-foreground shrink-0">
                                        {chapter.chapter_number}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-lg truncate">{chapter.title}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Published on {new Date(chapter.published_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Link href={`/dashboard/write/${novelId}/chapters/${chapter.id}/edit`}>
                                        <Button variant="ghost" size="sm" className="gap-2">
                                            <Pencil className="size-4" />
                                            Edit
                                        </Button>
                                    </Link>
                                    <DeleteChapterButton
                                        novelId={novelId}
                                        chapterId={chapter.id}
                                        chapterTitle={chapter.title}
                                        chapterNumber={chapter.chapter_number}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
