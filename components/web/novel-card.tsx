import Link from "next/link";
import { BookOpen } from "lucide-react";

export interface NovelCardProps {
  novel: {
    id: string;
    title: string;
    synopsis?: string | null;
    cover_url?: string | null;
    genres?: string[] | null;
    status?: string | null;
    author?: {
      username?: string | null;
      full_name?: string | null;
    } | null;
  };
}

export default function NovelCard({ novel }: NovelCardProps) {
  // Try to use the first genre as a badge
  const primaryGenre = novel.genres && novel.genres.length > 0 ? novel.genres[0] : null;
  const authorName = novel.author?.username || novel.author?.full_name || "Anonymous";

  return (
    <Link href={`/novel/${novel.id}`} className="group flex flex-col h-full">
      <div className="w-full aspect-2/3 bg-muted rounded-xl overflow-hidden mb-3 relative shadow-md border border-border/50 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:border-primary/30">
        
        {/* Cover Image */}
        {novel.cover_url ? (
          <img 
            src={novel.cover_url} 
            alt={novel.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          />
        ) : (
          <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors flex flex-col items-center justify-center gap-2">
            <BookOpen className="size-8 text-primary/40" />
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest px-2 text-center">No Cover</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex justify-between items-start z-10">
          {primaryGenre && (
            <span className="bg-background/80 backdrop-blur-md text-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border border-white/10 shadow-sm">
              {primaryGenre}
            </span>
          )}
          {novel.status === 'completed' && (
            <span className="bg-green-500/90 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md shadow-sm ml-auto">
              Done
            </span>
          )}
        </div>

        {/* Bottom Inner Gradient */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/80 via-black/30 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300 z-0"></div>
      </div>
      
      {/* Novel Info */}
      <div className="flex flex-col flex-1 px-1">
        <h3 className="font-bold text-base leading-tight line-clamp-1 group-hover:text-primary transition-colors">
          {novel.title}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
          By {authorName}
        </p>
        <p className="text-xs text-muted-foreground/80 line-clamp-2 mt-2 flex-1">
          {novel.synopsis || "No synopsis available."}
        </p>
      </div>
    </Link>
  );
}
