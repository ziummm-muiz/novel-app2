export default function MainLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse space-y-12">
      {/* Hero Skeleton */}
      <div className="space-y-6 max-w-3xl">
        <div className="h-12 sm:h-16 w-3/4 bg-muted rounded-xl"></div>
        <div className="h-6 w-1/2 bg-muted/60 rounded-lg"></div>
        <div className="flex gap-4 pt-4">
          <div className="h-12 w-32 bg-muted rounded-full"></div>
          <div className="h-12 w-32 bg-muted rounded-full"></div>
        </div>
      </div>
      
      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="flex flex-col gap-3 rounded-2xl p-4 border border-border/50 bg-card/30">
            <div className="w-full aspect-[2/3] bg-muted rounded-xl"></div>
            <div className="space-y-3 mt-2">
              <div className="h-6 w-full bg-muted rounded-md"></div>
              <div className="h-4 w-2/3 bg-muted/60 rounded-md"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
