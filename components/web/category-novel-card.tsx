import Link from "next/link";
import { Star, BookOpen } from "lucide-react";
import { Button } from "../ui/button";

interface CategoryNovelCardProps {
  novel: {
    id: string
    title: string
    cover_url?: string | null
    synopsis?: string | null
    profiles?: {
      username?: string | null
      full_name?: string | null
    } | null
    reviews?: { rating?: number | null }[] | null
  }
}

export default function CategoryNovelCard({ novel }: CategoryNovelCardProps) {
    // Calculate rating locally
    const reviews = novel.reviews || [];
    const totalRating = reviews.reduce((sum: number, r) => sum + (r.rating || 0), 0);
    const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : "0.0";

    // Author name fallback
    const authorName = novel.profiles?.username || "Unknown Author";

    return (
        <div className="flex bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-200 h-48 w-full group">
            {/* Cover Image */}
            <Link
                href={`/novel/${novel.id}`}
                className="w-32 sm:w-36 shrink-0 relative bg-muted overflow-hidden"
                aria-label={`Read ${novel.title}`}
            >
                {novel.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={novel.cover_url}
                        alt={novel.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    /* Fallback: branded gradient + book icon */
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-primary/20 to-primary/5 group-hover:from-primary/30 group-hover:to-primary/10 transition-colors duration-200">
                        <BookOpen className="size-8 text-primary/50" />
                    </div>
                )}
                {/* Subtle right-edge gradient so cover bleeds into card body */}
                <div className="absolute inset-y-0 right-0 w-4 bg-gradient-to-r from-transparent to-card/60 pointer-events-none" />
            </Link>

            {/* Novel Info */}
            <div className="flex flex-col flex-1 p-4 justify-between overflow-hidden min-w-0">
                <div className="flex flex-col gap-1 min-w-0">
                    <Link href={`/novel/${novel.id}`} className="min-w-0">
                        <h3 className="font-bold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-150">
                            {novel.title}
                        </h3>
                    </Link>

                    <span className="text-xs text-muted-foreground truncate">
                        By {authorName}
                    </span>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mt-1">
                        <Star
                            className={`size-3.5 shrink-0 ${
                                reviews.length > 0
                                    ? "fill-yellow-500 text-yellow-500"
                                    : "fill-muted text-muted-foreground"
                            }`}
                        />
                        <span className="text-xs font-semibold">{averageRating}</span>
                        <span className="text-xs text-muted-foreground">
                            ({reviews.length})
                        </span>
                    </div>

                    {/* Synopsis Snippet */}
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 hidden sm:block leading-relaxed">
                        {novel.synopsis || "No synopsis available."}
                    </p>
                </div>

                {/* CTA */}
                <div className="flex items-center justify-end pt-1">
                    <Link href={`/novel/${novel.id}`}>
                        <Button size="sm" className="gap-1.5 rounded-full text-xs h-7 px-3">
                            <BookOpen className="size-3.5" />
                            Read
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
