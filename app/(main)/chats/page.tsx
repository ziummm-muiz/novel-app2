import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ChatInterface from "@/components/web/chat-interface"

export default async function ChatsPage({ searchParams }: { searchParams: Promise<{ userId?: string }> }) {
  const { userId } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch current user profile to pass to the interface
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/")
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">Messages</h1>
        <p className="text-muted-foreground mt-1">Connect privately with other authors and readers.</p>
      </div>
      
      <ChatInterface currentUser={profile} targetUserId={userId} />
    </div>
  )
}
