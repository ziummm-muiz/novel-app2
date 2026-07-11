"use client"

import { useState, useTransition } from "react"
import { updateLibraryStatus } from "@/app/actions/library"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Bookmark, Check, Loader2, BookOpen, Star, X } from "lucide-react"

type Status = 'reading' | 'completed' | 'favourite' | 'none'

export default function LibraryStatusButton({ novelId, initialStatus, userId }: { novelId: string, initialStatus: Status, userId?: string }) {
  const [status, setStatus] = useState<Status>(initialStatus)
  const [isPending, startTransition] = useTransition()

  const handleUpdate = (newStatus: Status) => {
    if (!userId) {
      alert("Please log in to add novels to your library.")
      return
    }

    startTransition(async () => {
      try {
        await updateLibraryStatus(novelId, newStatus)
        setStatus(newStatus)
      } catch (error: any) {
        alert(error.message || "Failed to update library.")
      }
    })
  }

  const getButtonContent = () => {
    if (isPending) return <><Loader2 className="size-4 mr-2 animate-spin" /> Updating...</>
    if (status === 'reading') return <><BookOpen className="size-4 mr-2 text-blue-500" /> Reading</>
    if (status === 'completed') return <><Check className="size-4 mr-2 text-emerald-500" /> Completed</>
    if (status === 'favourite') return <><Star className="size-4 mr-2 fill-amber-400 text-amber-400" /> Favourite</>
    return <><Bookmark className="size-4 mr-2" /> Add to Library</>
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={status !== 'none' ? "secondary" : "outline"} className="rounded-full font-semibold shadow-sm w-full md:w-auto" disabled={isPending}>
          {getButtonContent()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-xl p-2">
        <DropdownMenuItem onClick={() => handleUpdate('reading')} className="rounded-lg cursor-pointer py-2.5">
          <BookOpen className="size-4 mr-3 text-blue-500" />
          Reading
          {status === 'reading' && <Check className="size-4 ml-auto" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleUpdate('completed')} className="rounded-lg cursor-pointer py-2.5">
          <Check className="size-4 mr-3 text-emerald-500" />
          Completed
          {status === 'completed' && <Check className="size-4 ml-auto" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleUpdate('favourite')} className="rounded-lg cursor-pointer py-2.5">
          <Star className="size-4 mr-3 text-amber-400" />
          Favourite
          {status === 'favourite' && <Check className="size-4 ml-auto" />}
        </DropdownMenuItem>
        
        {status !== 'none' && (
          <DropdownMenuItem onClick={() => handleUpdate('none')} className="rounded-lg cursor-pointer py-2.5 text-destructive focus:text-destructive focus:bg-destructive/10 mt-1 border-t">
            <X className="size-4 mr-3" />
            Remove from Library
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
