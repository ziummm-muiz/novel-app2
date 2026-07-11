"use client"
import { useState, useEffect } from "react"
import { updateChapter, softDeleteChapter } from "../../../../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function EditChapterPage({ params }: { params: Promise<{ novelId: string, chapterId: string }> }) {
  const [novelId, setNovelId] = useState<string>("")
  const [chapterId, setChapterId] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [initialChapter, setInitialChapter] = useState<any>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    params.then(p => {
      setNovelId(p.novelId)
      setChapterId(p.chapterId)
      fetchChapter(p.novelId, p.chapterId)
    })
  }, [params])

  const fetchChapter = async (nId: string, cId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Quick security check: does the user own the novel?
    const { data: novel } = await supabase
      .from("novels")
      .select("author_id")
      .eq("id", nId)
      .single()

    if (novel?.author_id !== user.id) {
      router.push("/dashboard")
      return
    }

    const { data } = await supabase
      .from("chapters")
      .select("*")
      .eq("id", cId)
      .single()

    if (data) {
      setInitialChapter(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    try {
      const formData = new FormData(e.currentTarget)
      await updateChapter(novelId, chapterId, formData)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "An unexpected error occurred.")
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this chapter? This action cannot be undone.")) return

    setIsDeleting(true)
    try {
      await softDeleteChapter(novelId, chapterId)
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to delete chapter")
      setIsDeleting(false)
    }
  }

  if (!initialChapter) {
    return <div className="p-12 text-center text-muted-foreground"><Loader2 className="size-6 animate-spin mx-auto" /></div>
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Link href={`/dashboard/write/${novelId}/chapters`} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="size-4 mr-2" />
        Back to Chapters
      </Link>

      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black mb-2">Edit Chapter</h1>
          <p className="text-muted-foreground">Make changes to your chapter content.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-card p-8 rounded-2xl border border-border shadow-sm mb-12">
        {error && (
          <div className="bg-destructive/15 text-destructive p-4 rounded-md text-sm font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="col-span-1 space-y-2">
            <Label htmlFor="chapterNumber">Chapter No.</Label>
            <Input 
              id="chapterNumber" 
              name="chapterNumber" 
              type="number"
              min="1"
              defaultValue={initialChapter.chapter_number}
              required 
              className="text-lg py-6 font-mono" 
            />
          </div>
          
          <div className="col-span-1 md:col-span-3 space-y-2">
            <Label htmlFor="title">Chapter Title</Label>
            <Input 
              id="title" 
              name="title" 
              defaultValue={initialChapter.title}
              required 
              className="text-lg py-6" 
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="content">Chapter Content (Markdown)</Label>
            <span className="text-xs text-muted-foreground">Supports **bold**, *italics*, etc.</span>
          </div>
          <Textarea 
            id="content" 
            name="content"
            defaultValue={initialChapter.content_url} 
            required 
            className="min-h-[500px] resize-y font-mono text-sm leading-relaxed" 
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-destructive/10 text-destructive rounded-full shrink-0">
            <AlertTriangle className="size-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-destructive mb-1">Danger Zone</h3>
            <p className="text-muted-foreground mb-6">
              Deleting a chapter removes it from the reading list. This action cannot be undone.
            </p>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              {isDeleting ? "Deleting..." : "Delete Chapter"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
