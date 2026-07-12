export default function DashboardLoading() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-pulse space-y-8">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-8 rounded-3xl bg-card border border-border/50">
        <div className="space-y-3 flex-1">
          <div className="h-10 w-48 bg-muted rounded-xl"></div>
          <div className="h-6 w-64 max-w-full bg-muted/60 rounded-lg"></div>
        </div>
        <div className="h-12 w-40 bg-muted rounded-full shrink-0"></div>
      </div>
      
      {/* List Skeleton */}
      <div className="grid gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col sm:flex-row gap-6 p-6 rounded-2xl bg-card/80 border border-border/50">
            <div className="w-full sm:w-56 h-40 bg-muted rounded-xl shrink-0"></div>
            <div className="flex flex-col justify-center space-y-4 flex-1">
              <div className="h-7 w-3/4 bg-muted rounded-lg"></div>
              <div className="h-4 w-1/4 bg-muted/60 rounded-md"></div>
              <div className="h-4 w-full bg-muted/40 rounded-md mt-2"></div>
            </div>
            <div className="flex items-center mt-4 sm:mt-0">
              <div className="h-10 w-full sm:w-28 bg-muted rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
