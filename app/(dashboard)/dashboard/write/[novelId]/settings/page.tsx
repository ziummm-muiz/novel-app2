"use client"

import { useState, useEffect } from "react"
import { updateNovel, softDeleteNovel } from "../../../actions"
import { APP_GENRES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ImagePlus, Loader2, AlertTriangle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function NovelSettingsPage({ params }: { params: Promise<{ novelId: string }> }) {
  const [novelId, setNovelId] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [initialNovel, setInitialNovel] = useState<any>(null)
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    params.then(p => {
      setNovelId(p.novelId)
      fetchNovel(p.novelId)
    })
  }, [params])

  const fetchNovel = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("novels")
      .select("*")
      .eq("id", id)
      .eq("author_id", user.id)
      .single()

    if (data) {
      setInitialNovel(data)
      setSelectedGenres(data.genres || [])
      if (data.cover_url) setPreviewUrl(data.cover_url)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size exceeds the 5MB limit. Please select a smaller file.")
        e.target.value = ""
        setPreviewUrl(initialNovel?.cover_url || null)
        return
      }
      setError(null)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    try {
      const formData = new FormData(e.currentTarget)
      formData.append("genres", JSON.stringify(selectedGenres))
      
      await updateNovel(novelId, formData)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "An unexpected error occurred.")
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this novel? This will also remove all its chapters. This action cannot be undone.")) return

    setIsDeleting(true)
    try {
      await softDeleteNovel(novelId)
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to delete novel")
      setIsDeleting(false)
    }
  }

  if (!initialNovel) {
    return <div className="p-12 text-center text-muted-foreground"><Loader2 className="size-6 animate-spin mx-auto" /></div>
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Link href={`/dashboard/write/${novelId}/chapters`} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="size-4 mr-2" />
        Back to Chapters
      </Link>

      <div className="mb-8">
        <h1 className="text-4xl font-black mb-2">Novel Settings</h1>
        <p className="text-muted-foreground">Update your novel's metadata or completely remove it from the platform.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-card p-8 rounded-2xl border border-border shadow-sm mb-12">
        
        {error && (
          <div className="bg-destructive/15 text-destructive p-4 rounded-md text-sm font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-1 flex flex-col gap-4">
            <Label>Cover Image (Optional to update)</Label>
            <div className="relative aspect-2/3 w-full bg-muted rounded-xl border-2 border-dashed border-border overflow-hidden flex items-center justify-center group cursor-pointer hover:border-primary transition-colors">
              <input 
                type="file" 
                name="cover" 
                accept="image/*" 
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
              />
              
              {previewUrl ? (
                <img src={previewUrl} alt="Cover Preview" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                  <ImagePlus className="size-8 mb-2 group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium">Click to upload cover</span>
                  <span className="text-xs mt-1 text-primary font-semibold">Max size: 5MB</span>
                </div>
              )}
              {previewUrl && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <span className="bg-background/80 text-foreground px-3 py-1.5 rounded-full text-sm font-semibold backdrop-blur-sm">Change Cover</span>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 flex flex-col gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Novel Title</Label>
              <Input id="title" name="title" defaultValue={initialNovel.title} required className="text-lg py-6" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="synopsis">Synopsis</Label>
              <Textarea 
                id="synopsis" 
                name="synopsis" 
                defaultValue={initialNovel.synopsis}
                required 
                className="min-h-40 resize-none" 
              />
            </div>

            <div className="space-y-3">
              <Label>Genres</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {APP_GENRES.map(genre => (
                  <div key={genre} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`genre-${genre}`} 
                      checked={selectedGenres.includes(genre)}
                      onCheckedChange={() => toggleGenre(genre)}
                    />
                    <label 
                      htmlFor={`genre-${genre}`} 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {genre}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
              Deleting a novel is a permanent action. All chapters associated with this novel will also be deleted immediately.
            </p>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              {isDeleting ? "Deleting..." : "Delete Novel Permanently"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
