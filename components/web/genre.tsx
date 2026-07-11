import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";

// 1. Predefined list of genres for your platform
export const APP_GENRES = [
    "Fantasy",
    "Romance",
    "Sci-Fi",
    "Action",
    "Mystery",
    "Horror",
    "Thriller",
    "LitRPG",
    "Historical"
];

// 2. Query function to fetch novels that contain the specific genre
async function getNovelsByGenre(genre: string) {
    const supabase = await createClient();
    
    const { data: novels, error } = await supabase
        .from("novels")
        .select("*")
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
                    <Link href={`/novel/${novel.id}`} key={novel.id} className="group">
                        <div className="w-full aspect-2/3 bg-muted rounded-md overflow-hidden mb-2 relative">
                            {/* Placeholder for cover_url - replace with real images later */}
                            <div className="absolute inset-0 bg-primary/10 group-hover:bg-primary/20 transition-colors" />
                        </div>
                        <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                            {novel.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {novel.synopsis || "No synopsis available."}
                        </p>
                    </Link>
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
            <Carousel
                opts={{
                    align: "start",
                    dragFree: true,
                }}
                className="w-full"
            >
                <CarouselContent className="-ml-4">
                    {APP_GENRES.map((genre, index) => (
                        <CarouselItem key={index} className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                            <Link href={`/explore?genre=${genre.toLowerCase()}`}>
                                <Card className="overflow-hidden border-none cursor-pointer group shadow-md hover:shadow-xl transition-all duration-300">
                                    <CardContent className="p-0 aspect-4/5 relative flex items-center justify-center">
                                        {/* Fallback Image - Can be replaced later */}
                                        <img 
                                            src="https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=400&auto=format&fit=crop" 
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
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <div className="hidden md:flex">
                    <CarouselPrevious className="-left-4 lg:-left-12 bg-background border-border" />
                    <CarouselNext className="-right-4 lg:-right-12 bg-background border-border" />
                </div>
            </Carousel>
        </section>
    );
}