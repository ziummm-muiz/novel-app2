import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent } from "../ui/card";

export default async function TrendingNovels() {
    const supabase = await createClient();
    
    // NOTE: To get TRUE trending based on reading_history in the past month, 
    // you will need to create a PostgreSQL View in Supabase that joins novels and reading_history.
    // For now, we fetch the 10 most recently added novels to build the UI!
    const { data: novels, error } = await supabase
        .from("novels")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

    if (error) {
        console.error("Error fetching trending novels:", error);
        return null;
    }

    if (!novels || novels.length === 0) {
        return null;
    }

    return (
        <section className="w-full my-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="text-orange-500">🔥</span> Trending This Month
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
                {novels.map((novel, index) => (
                    <Link href={`/novel/${novel.id}`} key={novel.id} className="group block">
                        <Card className="border-none shadow-none bg-transparent hover:bg-muted/50 transition-colors duration-200">
                            <CardContent className="p-3 flex items-center gap-4">
                                {/* Rank Number */}
                                <div className={`w-8 flex-shrink-0 text-center font-black text-2xl sm:text-3xl ${
                                    index === 0 ? 'text-amber-500' : 
                                    index === 1 ? 'text-slate-400' : 
                                    index === 2 ? 'text-amber-700' : 
                                    'text-muted-foreground/50'
                                }`}>
                                    {index + 1}
                                </div>
                                
                                {/* Cover Image */}
                                <div className="w-16 sm:w-20 aspect-2/3 bg-muted rounded-md overflow-hidden flex-shrink-0 relative">
                                    {/* Placeholder for actual cover image */}
                                    <div className="absolute inset-0 bg-primary/10 group-hover:bg-primary/20 transition-colors" />
                                </div>
                                
                                {/* Text Content */}
                                <div className="flex flex-col flex-1 overflow-hidden py-1">
                                    <h3 className="font-semibold text-base sm:text-lg line-clamp-1 group-hover:text-primary transition-colors">
                                        {novel.title}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-1">
                                        {novel.synopsis || "No synopsis available for this novel."}
                                    </p>
                                    
                                    {/* Top Genre Tag */}
                                    {novel.genres && novel.genres.length > 0 && (
                                        <div className="mt-2 flex">
                                            <span className="text-[10px] font-bold tracking-wider uppercase bg-primary/10 text-primary px-2 py-0.5 rounded-sm">
                                                {novel.genres[0]}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </section>
    );
}