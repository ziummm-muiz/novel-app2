"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBlog } from "@/app/actions/blogs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

export default function NewBlogPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)

    try {
      await createBlog(formData)
      // Redirection is handled by the server action
    } catch (err: any) {
      setError(err.message)
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/blogs">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="size-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Draft New Blog</h1>
          <p className="text-muted-foreground">Share an update, announcement, or thought with your readers.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Blog Post Details</CardTitle>
          <CardDescription>
            You can use Markdown in the content area for formatting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <Label htmlFor="title">Post Title</Label>
              <Input 
                id="title" 
                name="title" 
                placeholder="e.g. Chapter 10 is delayed until Friday" 
                required 
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content (Markdown supported)</Label>
              <Textarea 
                id="content" 
                name="content" 
                placeholder="Write your blog post here..." 
                required 
                className="min-h-[300px] font-mono text-sm"
              />
            </div>

            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium">
                {error}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-border">
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  "Publish Blog Post"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
