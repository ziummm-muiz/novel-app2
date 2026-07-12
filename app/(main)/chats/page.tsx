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
    <div className="fixed inset-0 top-[65px] z-40 bg-background animate-in fade-in duration-700">
      <ChatInterface currentUser={profile} targetUserId={userId} />
    </div>
  )
}
