import Link from "next/link";
import { BookOpen, User } from "lucide-react";

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
  const authorName = novel.author?.username || "Anonymous";

  return (
    <Link href={`/novel/${novel.id}`} className="group flex flex-col h-full rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-500 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/5">
      <div className="w-full aspect-[3/4] bg-muted relative overflow-hidden">
        
        {/* Cover Image */}
        {novel.cover_url ? (
          <img 
            src={novel.cover_url} 
            alt={novel.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          />
        ) : (
          <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors flex flex-col items-center justify-center gap-2">
            <BookOpen className="size-10 text-primary/30" />
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10">
          {primaryGenre && (
            <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/10 shadow-sm">
              {primaryGenre}
            </span>
          )}
          {novel.status === 'completed' && (
            <span className="bg-green-500/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm ml-auto border border-white/10">
              Done
            </span>
          )}
        </div>

        {/* Glassmorphism Hover Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-5 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/60 to-transparent h-2/3">
          <p className="text-sm text-gray-300 line-clamp-4 leading-relaxed font-medium drop-shadow-md">
            {novel.synopsis || "No synopsis available. Dive in to discover the story."}
          </p>
        </div>
        
        {/* Subtle persistent gradient for contrast */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent z-10 pointer-events-none transition-opacity duration-300 group-hover:opacity-0"></div>
      </div>
      
      {/* Novel Info Block */}
      <div className="flex flex-col flex-1 p-4 bg-card z-10 relative">
        <h3 className="font-bold text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors duration-300 mb-1">
          {novel.title}
        </h3>
        
        <div className="flex items-center gap-2 mt-auto pt-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
            <User className="size-3 text-primary" />
          </div>
          <p className="text-xs font-semibold text-muted-foreground truncate">
            {authorName}
          </p>
        </div>
      </div>
    </Link>
  );
}
