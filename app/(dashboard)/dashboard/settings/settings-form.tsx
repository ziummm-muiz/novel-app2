"use client"

import { useState } from "react"
import { updateProfileSettings } from "../actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2 } from "lucide-react"

export function SettingsForm({ profile, email }: { profile: any, email: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Profile picture size exceeds the 2MB limit. Please select a smaller file.")
        e.target.value = ""
      } else {
        setError(null)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)
    
    try {
      const formData = new FormData(e.currentTarget)
      await updateProfileSettings(formData)
      setSuccess(true)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-8 space-y-8">
      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md text-sm font-medium">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-emerald-500/15 text-emerald-600 p-4 rounded-md text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="size-4" />
          Settings saved successfully!
        </div>
      )}

      {/* Avatar Section */}
      <div className="space-y-4">
        <Label>Profile Picture</Label>
        <div className="flex items-center gap-6">
          <div className="size-20 rounded-full bg-muted border border-border overflow-hidden flex items-center justify-center shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-muted-foreground">
                {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || email.charAt(0)}
              </span>
            )}
          </div>
          <div className="space-y-2 flex-1">
            <Input 
              id="avatar" 
              name="avatar" 
              type="file" 
              accept="image/png, image/jpeg, image/webp" 
              className="w-full max-w-sm cursor-pointer"
              onChange={handleAvatarChange}
            />
            <p className="text-xs text-muted-foreground">Recommended size: 256x256px. <span className="text-primary font-semibold">Max 2MB.</span></p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input id="fullName" name="fullName" defaultValue={profile?.full_name || ""} placeholder="Your real name" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" defaultValue={profile?.username || ""} placeholder="e.g. author_john" />
      </div>
      
      <div className="space-y-2">
        <Label>Email</Label>
        <Input defaultValue={email} disabled />
        <p className="text-xs text-muted-foreground mt-1">Email cannot be changed directly.</p>
      </div>
      
      <div className="pt-4 border-t border-border">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  )
}
