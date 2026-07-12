import { Loader2 } from "lucide-react"

export default function DashboardLoading() {
  return (
    <div className="h-full w-full min-h-[60vh] flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
      <div className="relative flex flex-col items-center justify-center p-8 rounded-3xl bg-card/50 border border-border/50 shadow-sm overflow-hidden w-full max-w-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent -z-10"></div>
        <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
          <Loader2 className="size-8 text-primary animate-spin" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">Loading Dashboard</h3>
        <p className="text-sm text-muted-foreground font-medium text-center">Retrieving your data, please wait...</p>
      </div>
    </div>
  )
}
