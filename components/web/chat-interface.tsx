"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { sendMessage } from "@/app/actions/messages"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { User, Send, MessageSquare, ArrowLeft, Search, X } from "lucide-react"

type ProfileInfo = {
  id: string
  username: string
  full_name: string
  avatar_url: string
}

type Message = {
  id: string
  sender_id: string
  receiver_id: string
  message_text: string
  is_read: boolean
  created_at: string
}

export default function ChatInterface({ 
  currentUser,
  targetUserId
}: { 
  currentUser: ProfileInfo,
  targetUserId?: string
}) {
  const supabase = createClient()
  const [conversations, setConversations] = useState<ProfileInfo[]>([])
  const [activeUser, setActiveUser] = useState<ProfileInfo | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [conversationTexts, setConversationTexts] = useState<Record<string, string[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // 1. Fetch Conversations
  useEffect(() => {
    const fetchConversations = async () => {
      // Find all distinct users the current user has chatted with
      const { data, error } = await supabase
        .from("messages")
        .select("sender_id, receiver_id, message_text")
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order("created_at", { ascending: false })

      if (error || !data) {
        setIsLoading(false)
        return
      }

      // Extract unique user IDs in order of most recent message
      const userIds = new Set<string>()
      const orderedUserIds: string[] = []
      const textsMap: Record<string, string[]> = {}
      
      data.forEach(m => {
        const otherId = m.sender_id === currentUser.id ? m.receiver_id : m.sender_id
        if (!userIds.has(otherId)) {
          userIds.add(otherId)
          orderedUserIds.push(otherId)
        }
        if (!textsMap[otherId]) textsMap[otherId] = []
        if (m.message_text) textsMap[otherId].push(m.message_text)
      })
      
      setConversationTexts(textsMap)

      if (targetUserId && !userIds.has(targetUserId)) {
        userIds.add(targetUserId)
        orderedUserIds.unshift(targetUserId)
      }

      if (userIds.size > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .in("id", Array.from(userIds))
        
        if (profiles) {
          const sortedProfiles = profiles.sort((a, b) => orderedUserIds.indexOf(a.id) - orderedUserIds.indexOf(b.id))
          setConversations(sortedProfiles)
          
          if (targetUserId) {
            const target = sortedProfiles.find(p => p.id === targetUserId)
            if (target) setActiveUser(target)
          }
        }
      }
      setIsLoading(false)
    }

    fetchConversations()
  }, [currentUser.id, targetUserId, supabase])

  // 2. Fetch Messages & Setup Realtime
  useEffect(() => {
    if (!activeUser) return

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${activeUser.id}),and(sender_id.eq.${activeUser.id},receiver_id.eq.${currentUser.id})`)
        .order("created_at", { ascending: true })

      if (data) {
        setMessages(data)
        scrollToBottom()
        
        // Mark as read
        const unreadIds = data.filter(m => m.receiver_id === currentUser.id && !m.is_read).map(m => m.id)
        if (unreadIds.length > 0) {
          await supabase.from("messages").update({ is_read: true }).in("id", unreadIds)
          router.refresh()
        }
      }
    }

    fetchMessages()

    // Realtime Subscription
    const channel = supabase
      .channel('chat_updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new as Message
          // Check if message belongs to current active chat
          const isRelevant = activeUser && (
            (newMsg.sender_id === currentUser.id && newMsg.receiver_id === activeUser.id) ||
            (newMsg.sender_id === activeUser.id && newMsg.receiver_id === currentUser.id)
          )
          
          if (isRelevant) {
            setMessages(prev => {
              // Avoid duplicates if optimistic update already added it
              if (prev.some(m => m.message_text === newMsg.message_text && Math.abs(new Date(m.created_at).getTime() - new Date(newMsg.created_at).getTime()) < 5000)) {
                return prev
              }
              return [...prev, newMsg]
            })
            scrollToBottom()
            
            // Mark as read if received
            if (newMsg.receiver_id === currentUser.id) {
              supabase.from("messages").update({ is_read: true }).eq("id", newMsg.id).then(() => router.refresh())
            }
          }

          // Move the conversation to the top of the list
          const otherId = newMsg.sender_id === currentUser.id ? newMsg.receiver_id : newMsg.sender_id
          
          setConversationTexts(prev => ({
            ...prev,
            [otherId]: [newMsg.message_text, ...(prev[otherId] || [])]
          }))
          
          setConversations(prev => {
            const index = prev.findIndex(p => p.id === otherId)
            if (index > 0) {
              const copy = [...prev]
              const [item] = copy.splice(index, 1)
              copy.unshift(item)
              return copy
            }
            return prev
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeUser, currentUser.id, supabase])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeUser) return

    const msgText = newMessage.trim()
    setNewMessage("") // Optimistic clear

    // Optimistic UI update
    const tempMsg: Message = {
      id: crypto.randomUUID(),
      sender_id: currentUser.id,
      receiver_id: activeUser.id,
      message_text: msgText,
      is_read: false,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempMsg])
    scrollToBottom()

    // Optimistically update conversation text
    setConversationTexts(prev => ({
      ...prev,
      [activeUser.id]: [msgText, ...(prev[activeUser.id] || [])]
    }))

    // Optimistically move activeUser to top of conversations list
    setConversations(prev => {
      const index = prev.findIndex(p => p.id === activeUser.id)
      if (index > 0) {
        const copy = [...prev]
        const [item] = copy.splice(index, 1)
        copy.unshift(item)
        return copy
      }
      return prev
    })

    try {
      await sendMessage(activeUser.id, msgText, `/chats`)
    } catch (error) {
      console.error("Failed to send message", error)
      // Remove optimistic message if failed
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
    }
  }

  if (isLoading) {
    return (
      <div className="h-full w-full overflow-hidden bg-card/60 backdrop-blur-xl flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground animate-pulse">
          <MessageSquare className="size-8 opacity-50" />
          <p className="font-medium">Loading conversations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full overflow-hidden bg-card/80 backdrop-blur-2xl flex">
      
      {/* Left Sidebar - Conversation List */}
      <div className={`w-full md:w-80 border-r border-border/50 flex flex-col bg-background/50 ${activeUser ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-border/50">
          <h2 className="font-black text-xl mb-4">Chats</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..." 
              className="w-full bg-muted/50 border border-border/50 rounded-full py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {conversations.length === 0 ? (
            <div className="text-center p-8 flex flex-col items-center justify-center h-full">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                <MessageSquare className="size-8 text-primary/60" />
              </div>
              <h3 className="font-bold text-lg mb-1">No Messages Yet</h3>
              <p className="text-xs text-muted-foreground max-w-[200px] mx-auto leading-relaxed">Visit a user's profile and click message to start chatting.</p>
            </div>
          ) : (
            conversations.filter(p => {
              const query = searchQuery.toLowerCase()
              const matchUsername = (p.username || '').toLowerCase().includes(query)
              const matchText = (conversationTexts[p.id] || []).some(t => t.toLowerCase().includes(query))
              return matchUsername || matchText
            }).map(profile => {
              const displayName = profile.username || "Unknown"
              const isActive = activeUser?.id === profile.id
              const query = searchQuery.trim().toLowerCase()
              
              let matchedSnippet = null
              if (query && !(profile.username || '').toLowerCase().includes(query)) {
                const matchText = (conversationTexts[profile.id] || []).find(t => t.toLowerCase().includes(query))
                if (matchText) {
                  const idx = matchText.toLowerCase().indexOf(query)
                  const start = Math.max(0, idx - 15)
                  const end = Math.min(matchText.length, idx + query.length + 15)
                  const snippet = (start > 0 ? "..." : "") + matchText.substring(start, end) + (end < matchText.length ? "..." : "")
                  
                  const parts = snippet.split(new RegExp(`(${searchQuery.trim()})`, 'gi'))
                  
                  matchedSnippet = (
                    <div className="text-[11px] text-muted-foreground truncate mt-1 bg-background/50 p-1.5 rounded-md border border-border/30">
                      {parts.map((part, i) => 
                        part.toLowerCase() === query ? <mark key={i} className="bg-primary/20 text-primary font-medium rounded-sm px-0.5">{part}</mark> : <span key={i}>{part}</span>
                      )}
                    </div>
                  )
                }
              }
              
              return (
                <button
                  key={profile.id}
                  onClick={() => setActiveUser(profile)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 text-left ${
                    isActive 
                      ? "bg-primary/10 border border-primary/20 shadow-sm text-primary" 
                      : "hover:bg-muted/80 border border-transparent hover:translate-x-1"
                  }`}
                >
                  <div className={`size-12 rounded-full overflow-hidden shrink-0 border-2 transition-colors ${isActive ? "border-primary" : "border-background shadow-sm"}`}>
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${isActive ? "bg-primary/20" : "bg-muted"}`}>
                        <User className="size-5 opacity-70" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate text-sm">
                      {displayName}
                    </div>
                    <div className={`text-xs truncate ${isActive ? "text-primary/70" : "text-muted-foreground"}`}>
                      {conversationTexts[profile.id]?.[0] || (profile.username ? `@${profile.username}` : "")}
                    </div>
                    {matchedSnippet}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Right Area - Active Chat */}
      <div className={`flex-1 flex flex-col bg-background/30 ${!activeUser ? 'hidden md:flex' : 'flex'}`}>
        {activeUser ? (
          <>
            {/* Active User Header */}
            <div className="px-6 py-4 border-b border-border/50 flex items-center gap-4 bg-card/50 backdrop-blur-md shadow-sm z-10 relative">
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
              
              <Button variant="ghost" size="icon" className="md:hidden shrink-0 hover:bg-muted" onClick={() => setActiveUser(null)}>
                <ArrowLeft className="size-5" />
              </Button>
              <div className="size-10 rounded-full overflow-hidden shrink-0 border-2 border-background shadow-sm">
                {activeUser.avatar_url ? (
                  <img src={activeUser.avatar_url} alt={activeUser.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <User className="size-5 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base leading-tight truncate">{activeUser.username || "Unknown"}</h3>
                {activeUser.username && <p className="text-xs text-muted-foreground font-medium truncate">@{activeUser.username}</p>}
              </div>
              <Button variant="ghost" size="icon" className="shrink-0 hover:bg-muted rounded-full" onClick={() => setActiveUser(null)} title="Close Chat">
                <X className="size-5 text-muted-foreground" />
              </Button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="size-20 rounded-full bg-primary/5 flex items-center justify-center mb-6 border border-primary/10 shadow-inner">
                    <MessageSquare className="size-10 text-primary/40" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Say Hello!</h3>
                  <p className="text-muted-foreground text-sm max-w-xs font-medium">This is the beginning of your chat history with @{activeUser.username}.</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMe = msg.sender_id === currentUser.id
                  const showAvatar = index === messages.length - 1 || messages[index + 1].sender_id !== msg.sender_id

                  return (
                    <div key={msg.id} className={`flex gap-3 ${isMe ? "justify-end" : "justify-start"} group`}>
                      {!isMe && (
                        <div className="w-8 shrink-0 flex items-end justify-center">
                          {showAvatar && (
                            <div className="size-8 rounded-full overflow-hidden border-2 border-background shadow-sm">
                              {activeUser.avatar_url ? (
                                <img src={activeUser.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted">
                                  <User className="size-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex flex-col max-w-[75%]">
                        <div className={`px-5 py-3 ${
                          isMe 
                            ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-2xl rounded-br-sm shadow-md shadow-primary/20" 
                            : "bg-card border border-border/50 text-foreground rounded-2xl rounded-bl-sm shadow-sm"
                        }`}>
                          <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{msg.message_text}</p>
                        </div>
                        <span className={`text-[10px] mt-1.5 block font-medium opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? "text-muted-foreground text-right mr-1" : "text-muted-foreground text-left ml-1"}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-card/50 backdrop-blur-md border-t border-border/50">
              <div className="flex gap-3 relative max-w-4xl mx-auto">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="min-h-14 max-h-40 resize-none pr-14 py-4 rounded-2xl border-border/50 bg-background shadow-inner focus-visible:ring-primary/30 text-base"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  size="icon" 
                  className="absolute right-2 bottom-2 size-10 rounded-xl shadow-md shadow-primary/20 transition-transform active:scale-95"
                >
                  <Send className="size-4 ml-0.5" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium text-center mt-3">Press Enter to send, Shift+Enter for new line.</p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-muted/10">
            <div className="size-24 rounded-full bg-primary/5 flex items-center justify-center mb-6 border border-primary/10 shadow-inner">
              <MessageSquare className="size-12 text-primary/40" />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-2">Your Conversations</h3>
            <p className="text-muted-foreground max-w-sm font-medium">Select a conversation from the sidebar or go to a user's profile to start a new private chat.</p>
          </div>
        )}
      </div>

    </div>
  )
}
