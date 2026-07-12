"use client"
import { useState } from "react"
import { createNovel } from "../../actions"
import { APP_GENRES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ImagePlus, Loader2 } from "lucide-react"

export default function NewNovelPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size exceeds the 5MB limit. Please select a smaller file.")
        e.target.value = ""
        setPreviewUrl(null)
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
      
      await createNovel(formData)
      // Redirect happens in the server action
    } catch (err: any) {
      console.error(err)
      setError(err.message || "An unexpected error occurred. Ensure the 'covers' bucket exists.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-2">Create New Novel</h1>
        <p className="text-muted-foreground">Setup your book's metadata before publishing chapters.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-card p-8 rounded-2xl border border-border shadow-sm">
        
        {error && (
          <div className="bg-destructive/15 text-destructive p-4 rounded-md text-sm font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Cover Upload Area */}
          <div className="col-span-1 flex flex-col gap-4">
            <Label>Cover Image</Label>
            <div className="relative aspect-2/3 w-full bg-muted rounded-xl border-2 border-dashed border-border overflow-hidden flex items-center justify-center group cursor-pointer hover:border-primary transition-colors">
              <input 
                type="file" 
                name="cover" 
                accept="image/*" 
                required 
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
              />
              
              {previewUrl ? (
                <img src={previewUrl} alt="Cover Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                  <ImagePlus className="size-8 mb-2 group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium">Click to upload cover</span>
                  <span className="text-xs mt-1">Recommended: 600x900px</span>
                  <span className="text-xs mt-1 text-primary font-semibold">Max size: 5MB</span>
                </div>
              )}
            </div>
          </div>

          {/* Details Area */}
          <div className="col-span-1 md:col-span-2 flex flex-col gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Novel Title</Label>
              <Input id="title" name="title" placeholder="e.g. The Beginning After The End" required className="text-lg py-6" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="synopsis">Synopsis</Label>
              <Textarea 
                id="synopsis" 
                name="synopsis" 
                placeholder="Write a compelling blurb for your novel..." 
                required 
                className="min-h-160px resize-none" 
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
                Creating Novel...
              </>
            ) : (
              "Save and Continue to Chapters"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
