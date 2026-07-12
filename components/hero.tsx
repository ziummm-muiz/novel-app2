import Link from "next/link";
import SearchBar from "./web/search-bar";

export default function Hero() {
    return (
        <div className="relative w-full min-h-[60vh] md:min-h-[70vh] flex items-center justify-center overflow-hidden">
            {/* Background Image / Gradient */}
            <div className="absolute inset-0 bg-zinc-950 z-0"></div>
            <div 
                className="absolute inset-0 opacity-40 z-0 bg-cover bg-center"
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2070')` }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20 z-0"></div>
            
            {/* Content */}
            <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl pt-10">
                <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm mb-6">
                    <span className="flex h-2 w-2 rounded-full bg-green-400 mr-2 animate-pulse"></span>
                    Discover a world of stories
                </div>
                
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 drop-shadow-md tracking-tight">
                    Read Endless <span className="text-primary">Worlds.</span>
                </h1>
                
                <p className="text-lg md:text-xl lg:text-2xl text-gray-200 mb-10 max-w-2xl drop-shadow">
                    Immerse yourself in thousands of novels from emerging authors, or start writing your own epic journey today.
                </p>
                
                {/* Search Bar - Visible only on mobile/tablet where it might be hidden in navbar, but we can just show it here globally for better UX */}
                <div className="w-full max-w-md mb-10 lg:hidden">
                    <SearchBar />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Link 
                        href="/categories" 
                        className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 px-8 rounded-full text-lg transition-transform hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center"
                    >
                        Start Reading
                    </Link>
                    <Link 
                        href="/dashboard/write/new" 
                        className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur font-bold py-3.5 px-8 rounded-full text-lg transition-all shadow-lg flex items-center justify-center"
                    >
                        Start Writing
                    </Link>
                </div>
            </div>
            
            {/* Bottom Gradient Fade */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-background to-transparent z-10 pointer-events-none"></div>
        </div>
    )
}