import { BookOpen } from "lucide-react"

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-md">
      <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-700">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 size-32 bg-primary/20 rounded-full animate-ping opacity-50"></div>
          <div className="relative size-20 bg-background rounded-full flex items-center justify-center border border-primary/20 shadow-2xl shadow-primary/20">
            <BookOpen className="size-10 text-primary animate-pulse" />
          </div>
        </div>
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-black tracking-tight animate-pulse text-foreground">NovelApp<span className="text-primary">.</span></h2>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground animate-pulse">Loading Experience</p>
        </div>
      </div>
    </div>
  )
}
