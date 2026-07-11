import Hero from "@/components/hero"
import AllGenres, { GenreCarousel } from "@/components/web/genre"
import TrendingNovels from "@/components/web/trending"
import FriendsReading from "@/components/web/friends-reading"

export default function Page() {
  return (
    <div className="flex flex-col w-full">
      <Hero/>
      <div className="flex flex-col w-full max-w-7xl mx-auto px-6 py-8 gap-12">
        {/* Carousel of Categories */}
        <GenreCarousel />
        
        {/* Leaderboard of Trending Novels */}
        <TrendingNovels />

        {/* Friends Reading Feed (Hidden if logged out) */}
        <FriendsReading />

        {/* Grids of Novels by Genre */}
        <AllGenres />
      </div>
    </div>
  )
}
