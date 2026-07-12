import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { APP_GENRES } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import NovelCard from "./novel-card";

// 2. Query function to fetch novels that contain the specific genre
async function getNovelsByGenre(genre: string) {
    const supabase = await createClient();
    
    const { data: novels, error } = await supabase
        .from("novels")
        .select("*, author:profiles(username, full_name)")
        .contains("genres", [genre])
        .limit(4) // Limit to 4 for the homepage preview
        .order("created_at", { ascending: false });

    if (error) {
        console.error(`Error fetching ${genre} novels:`, error);
        return [];
    }

    return novels;
}

// 3. Individual Section Component
async function GenreSection({ genreName }: { genreName: string }) {
    const novels = await getNovelsByGenre(genreName);

    // If a genre has no novels yet, don't render an empty section
    if (novels.length === 0) {
        return null;
    }

    return (
        <section className="w-full my-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">{genreName} Novels</h2>
                <Link href={`/explore?genre=${genreName.toLowerCase()}`} className="text-sm font-medium text-primary hover:underline">
                    View All
                </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
                {novels.map((novel) => (
                    <NovelCard key={novel.id} novel={novel} />
                ))}
            </div>
        </section>
    );
}

// 4. Main Exported Component that maps through all genres (Grid format)
export default function AllGenres() {
    return (
        <div className="w-full flex flex-col gap-2">
            {APP_GENRES.map((genre) => (
                <GenreSection key={genre} genreName={genre} />
            ))}
        </div>
    );
}

// 5. Genre Carousel Component (Shows categories instead of books)
export function GenreCarousel() {
    return (
        <section className="w-full my-8 relative">
            <h2 className="text-2xl font-bold mb-4">Explore Categories</h2>
            
            {/* Native scrollable container for better mobile support */}
            <div className="flex w-full overflow-x-auto snap-x snap-mandatory gap-4 pb-4 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {APP_GENRES.map((genre, index) => (
                    <div key={index} className="shrink-0 w-36 sm:w-40 md:w-48 lg:w-56 snap-start">
                        <Link href={`/categories/${genre.toLowerCase()}`}>
                            <Card className="overflow-hidden border-none cursor-pointer group shadow-md hover:shadow-xl transition-all duration-300">
                                <CardContent className="p-0 aspect-[4/5] relative flex items-center justify-center">
                                    <img 
                                        src={`/images/genres/${genre.toLowerCase().replace(/ /g, '-')}.png`} 
                                        alt={genre} 
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    {/* Dark Overlay for text readability */}
                                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300" />
                                    
                                    {/* Text */}
                                    <h3 className="relative z-10 text-white font-bold text-lg md:text-xl tracking-widest uppercase drop-shadow-lg text-center px-2">
                                        {genre}
                                    </h3>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>
                ))}
            </div>
        </section>
    );
}