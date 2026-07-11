import { createClient } from "@/lib/supabase/server";
import { APP_GENRES } from "@/lib/constants";
import CategoryNovelCard from "@/components/web/category-novel-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

async function getTopNovelsForCategory(genre: string) {
    const supabase = await createClient();
    
    // Fetch novels, joining with profiles and reviews
    const { data: novels, error } = await supabase
        .from("novels")
        .select(`
            *,
            profiles!inner(username, full_name),
            reviews(rating)
        `)
        .contains("genres", [genre])
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(3); // Show top 3 per category on the main page

    if (error) {
        console.error(`Error fetching novels for ${genre}:`, error);
        return [];
    }

    return novels || [];
}

async function CategorySection({ genre }: { genre: string }) {
    const novels = await getTopNovelsForCategory(genre);

    if (!novels || novels.length === 0) return null;

    return (
        <div className="w-full mb-16">
            <div className="flex flex-row items-end justify-between mb-6 pb-2 border-b border-border">
                <h2 className="text-3xl font-extrabold tracking-tight">{genre}</h2>
                <Link href={`/categories/${genre.toLowerCase()}`}>
                    <Button variant="outline" size="sm" className="rounded-full">View All {genre}</Button>
                </Link>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {novels.map((novel) => (
                    <CategoryNovelCard key={novel.id} novel={novel} />
                ))}
            </div>
        </div>
    );
}

export default function CategoriesPage() {
    return (
        <div className="w-full max-w-7xl mx-auto px-6 py-8">
            <div className="mb-12 text-center bg-muted/30 py-12 rounded-3xl border border-border">
                <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter">Explore Categories</h1>
                <p className="text-muted-foreground max-w-xl mx-auto px-4">
                    Dive into our vast library of stories spanning across multiple genres. 
                    Find your next favorite adventure right here.
                </p>
            </div>

            <div className="flex flex-col w-full mt-8">
                {APP_GENRES.map(genre => (
                    <CategorySection key={genre} genre={genre} />
                ))}
            </div>
        </div>
    );
}
