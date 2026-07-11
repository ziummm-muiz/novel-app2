import { createClient } from "@/lib/supabase/server";
import CategoryNovelCard from "@/components/web/category-novel-card";
import { notFound } from "next/navigation";
import { APP_GENRES } from "@/lib/constants";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function SpecificCategoryPage({ params }: { params: Promise<{ category: string }> }) {
    const { category } = await params;
    
    // Determine exact genre case from URL
    const decodedCategory = decodeURIComponent(category).toLowerCase();
    const actualGenre = APP_GENRES.find(g => g.toLowerCase() === decodedCategory);

    if (!actualGenre) {
        notFound();
    }

    const supabase = await createClient();
    
    // Fetch all novels for this category
    const { data: novels, error } = await supabase
        .from("novels")
        .select(`
            *,
            profiles!inner(username, full_name),
            reviews(rating)
        `)
        .contains("genres", [actualGenre])
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching category:", error);
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-6 py-8">
            {/* Back Button */}
            <div className="mb-6">
                <Link href="/categories">
                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary">
                        <ArrowLeft className="size-4" />
                        Back to Categories
                    </Button>
                </Link>
            </div>

            {/* Header */}
            <div className="mb-10 text-center bg-muted/30 py-16 rounded-3xl border border-border">
                <h1 className="text-5xl font-black mb-4 tracking-tighter capitalize">{actualGenre} Novels</h1>
                <p className="text-muted-foreground max-w-xl mx-auto px-4">
                    Browse the top-rated and most popular {actualGenre.toLowerCase()} stories on the platform.
                </p>
            </div>

            {/* Grid */}
            {(!novels || novels.length === 0) ? (
                <div className="text-center py-20 text-muted-foreground">
                    No novels found in this category yet. Check back soon!
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {novels.map((novel) => (
                        <CategoryNovelCard key={novel.id} novel={novel} />
                    ))}
                </div>
            )}
        </div>
    );
}
