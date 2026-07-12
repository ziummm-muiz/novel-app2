import { Loader2 } from "lucide-react"

export default function MainLoading() {
  return (
    <div className="h-[calc(100vh-65px)] w-full flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 size-16 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
          <div className="relative size-16 rounded-full bg-card flex items-center justify-center border border-border/50 shadow-lg">
            <Loader2 className="size-8 text-primary animate-spin" />
          </div>
        </div>
        <p className="text-sm font-semibold tracking-wider uppercase text-muted-foreground animate-pulse mt-4">
          Loading Page...
        </p>
      </div>
    </div>
  )
}
