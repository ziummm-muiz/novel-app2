import Link from "next/link";
import { Star, BookOpen } from "lucide-react";
import { Button } from "../ui/button";

export default function CategoryNovelCard({ novel }: { novel: any }) {
    // Calculate rating locally
    const reviews = novel.reviews || [];
    const totalRating = reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0);
    const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : "0.0";
    
    // Author name fallback
    const authorName = novel.profiles?.full_name || novel.profiles?.username || "Unknown Author";

    return (
        <div className="flex bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all h-48 w-full group">
            {/* Cover Image */}
            <Link href={`/novel/${novel.id}`} className="w-32 sm:w-36 flex-shrink-0 relative bg-muted cursor-pointer overflow-hidden">
                {/* Fallback image placeholder */}
                <div className="absolute inset-0 bg-primary/10 group-hover:bg-primary/20 transition-colors" />
                {novel.cover_url && (
                    <img src={novel.cover_url} alt={novel.title} className="w-full h-full object-cover" />
                )}
            </Link>

            {/* Novel Info */}
            <div className="flex flex-col flex-1 p-4 justify-between overflow-hidden">
                <div className="flex flex-col">
                    <Link href={`/novel/${novel.id}`}>
                        <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors cursor-pointer">
                            {novel.title}
                        </h3>
                    </Link>
                    <span className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                        By {authorName}
                    </span>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-1 mt-2">
                        <Star className={`size-4 ${reviews.length > 0 ? "fill-yellow-500 text-yellow-500" : "fill-muted text-muted-foreground"}`} />
                        <span className="text-sm font-medium">{averageRating}</span>
                        <span className="text-xs text-muted-foreground ml-1">({reviews.length} reviews)</span>
                    </div>

                    {/* Synopsis Snippet */}
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-2 hidden sm:block">
                        {novel.synopsis || "No synopsis available."}
                    </p>
                </div>

                {/* Read/Buy Action */}
                <div className="flex items-center justify-end mt-2 sm:mt-0">
                    <Link href={`/novel/${novel.id}`}>
                        <Button size="sm" className="gap-2 rounded-full">
                            <BookOpen className="size-4" />
                            Read
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
