"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { sendMessage } from "@/app/actions/messages"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { User, Send, MessageSquare, ArrowLeft } from "lucide-react"

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
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 1. Fetch Conversations
  useEffect(() => {
    const fetchConversations = async () => {
      // Find all distinct users the current user has chatted with
      const { data, error } = await supabase
        .from("messages")
        .select("sender_id, receiver_id")
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order("created_at", { ascending: false })

      if (error || !data) {
        setIsLoading(false)
        return
      }

      // Extract unique user IDs
      const userIds = new Set<string>()
      data.forEach(m => {
        if (m.sender_id !== currentUser.id) userIds.add(m.sender_id)
        if (m.receiver_id !== currentUser.id) userIds.add(m.receiver_id)
      })

      if (targetUserId) {
        userIds.add(targetUserId)
      }

      if (userIds.size > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .in("id", Array.from(userIds))
        
        if (profiles) {
          setConversations(profiles)
          
          if (targetUserId) {
            const target = profiles.find(p => p.id === targetUserId)
            if (target) setActiveUser(target)
          } else if (profiles.length > 0) {
            setActiveUser(profiles[0])
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
          const isRelevant = 
            (newMsg.sender_id === currentUser.id && newMsg.receiver_id === activeUser.id) ||
            (newMsg.sender_id === activeUser.id && newMsg.receiver_id === currentUser.id)
          
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
              supabase.from("messages").update({ is_read: true }).eq("id", newMsg.id)
            }
          }
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

    try {
      await sendMessage(activeUser.id, msgText, `/chats`)
    } catch (error) {
      console.error("Failed to send message", error)
      // Remove optimistic message if failed
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
    }
  }

  if (isLoading) {
    return <div className="h-[600px] flex items-center justify-center text-muted-foreground animate-pulse">Loading chats...</div>
  }

  return (
    <div className="h-[calc(100vh-140px)] min-h-[600px] border border-border rounded-2xl overflow-hidden bg-card flex shadow-sm animate-in fade-in duration-500">
      
      {/* Left Sidebar - Conversation List */}
      <div className={`w-full md:w-80 border-r border-border flex flex-col ${activeUser ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-border bg-muted/20">
          <h2 className="font-bold text-lg">Messages</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="text-center p-6 text-muted-foreground text-sm">
              <MessageSquare className="size-8 mx-auto mb-2 opacity-50" />
              <p>No conversations yet.</p>
              <p className="text-xs mt-1">Visit a user's profile to start chatting.</p>
            </div>
          ) : (
            conversations.map(profile => {
              const displayName = profile.full_name || profile.username || "Unknown"
              const isActive = activeUser?.id === profile.id
              
              return (
                <button
                  key={profile.id}
                  onClick={() => setActiveUser(profile)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                    isActive ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-muted"
                  }`}
                >
                  <div className="size-10 rounded-full bg-muted overflow-hidden shrink-0 border border-border/50">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="size-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold truncate text-sm ${isActive ? "text-primary" : ""}`}>
                      {displayName}
                    </div>
                    {profile.username && <div className="text-xs text-muted-foreground truncate">@{profile.username}</div>}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Right Area - Active Chat */}
      <div className={`flex-1 flex flex-col bg-background ${!activeUser ? 'hidden md:flex' : 'flex'}`}>
        {activeUser ? (
          <>
            {/* Active User Header */}
            <div className="p-4 border-b border-border flex items-center gap-3 bg-card shadow-sm z-10">
              <Button variant="ghost" size="icon" className="md:hidden mr-1" onClick={() => setActiveUser(null)}>
                <ArrowLeft className="size-5" />
              </Button>
              <div className="size-10 rounded-full bg-muted overflow-hidden shrink-0 border border-border">
                {activeUser.avatar_url ? (
                  <img src={activeUser.avatar_url} alt={activeUser.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="size-5 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-bold">{activeUser.full_name || activeUser.username || "Unknown"}</h3>
                {activeUser.username && <p className="text-xs text-muted-foreground">@{activeUser.username}</p>}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm opacity-50">
                  <MessageSquare className="size-12 mb-4" />
                  <p>This is the beginning of your chat history.</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMe = msg.sender_id === currentUser.id
                  const showAvatar = index === messages.length - 1 || messages[index + 1].sender_id !== msg.sender_id

                  return (
                    <div key={msg.id} className={`flex gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                      {!isMe && (
                        <div className="w-8 shrink-0 flex items-end">
                          {showAvatar && (
                            <div className="size-8 rounded-full bg-muted overflow-hidden border border-border">
                              {activeUser.avatar_url ? (
                                <img src={activeUser.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <User className="size-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                        isMe 
                          ? "bg-primary text-primary-foreground rounded-br-sm" 
                          : "bg-muted rounded-bl-sm"
                      }`}>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.message_text}</p>
                        <span className={`text-[10px] opacity-60 mt-1 block ${isMe ? "text-right" : "text-left"}`}>
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
            <div className="p-4 bg-card border-t border-border">
              <div className="flex gap-2 relative">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="min-h-[50px] max-h-[150px] resize-none pr-12 rounded-xl border-border focus-visible:ring-primary/50"
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
                  className="absolute right-2 bottom-2 rounded-lg"
                >
                  <Send className="size-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-2">Press Enter to send, Shift+Enter for new line.</p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <div className="size-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageSquare className="size-10 opacity-50" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Your Messages</h3>
            <p className="text-sm mt-2 max-w-sm text-center">Select a conversation from the sidebar or go to a user's profile to start a new chat.</p>
          </div>
        )}
      </div>

    </div>
  )
}
