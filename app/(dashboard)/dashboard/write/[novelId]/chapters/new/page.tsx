"use client"
import { useState } from "react"
import { createChapter } from "../../../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { use } from "react"

export default function NewChapterPage({ params }: { params: Promise<{ novelId: string }> }) {
  const { novelId } = use(params)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    try {
      const formData = new FormData(e.currentTarget)
      formData.append("novelId", novelId)
      
      await createChapter(formData)
      // Redirect happens in the server action
    } catch (err: any) {
      console.error(err)
      setError(err.message || "An unexpected error occurred.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      
      <div className="mb-6">
        <Link href={`/dashboard/write/${novelId}/chapters`}>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary -ml-3">
            <ArrowLeft className="size-4" />
            Back to Chapters
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-black mb-2">Write Chapter</h1>
        <p className="text-muted-foreground">You can format your chapter using standard Markdown.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-card p-6 sm:p-8 rounded-2xl border border-border shadow-sm">
        
        {error && (
          <div className="bg-destructive/15 text-destructive p-4 rounded-md text-sm font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="col-span-1 md:col-span-3 space-y-2">
            <Label htmlFor="title">Chapter Title</Label>
            <Input id="title" name="title" placeholder="e.g. The Awakening" required className="text-lg py-6" />
          </div>
          <div className="col-span-1 space-y-2">
            <Label htmlFor="chapterNumber">Chapter Number</Label>
            <Input id="chapterNumber" name="chapterNumber" type="number" min="1" placeholder="e.g. 1" required className="text-lg py-6" />
          </div>
        </div>

        <div className="space-y-2 flex flex-col h-full min-h-[500px]">
          <div className="flex justify-between items-end">
            <Label htmlFor="content">Chapter Content (Markdown supported)</Label>
          </div>
          <Textarea 
            id="content" 
            name="content" 
            placeholder="# Your story begins here...&#10;&#10;Write or paste your chapter text." 
            required 
            className="flex-1 min-h-[500px] resize-y font-mono text-sm leading-relaxed p-6" 
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publishing Chapter...
              </>
            ) : (
              "Publish Chapter"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
