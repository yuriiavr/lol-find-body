'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/src/utils/supabase/client'
import { Send, Loader2, User } from 'lucide-react'
import { sendMessage, getMessages } from '@/app/matches/actions'

export function Chat({ matchId, currentUser, targetProfile }: { matchId: string, currentUser: any, targetProfile: any }) {
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await getMessages(matchId)
      if (data) setMessages(data)
      setLoading(false)
      scrollToBottom()
    }

    loadMessages()

    // Підписка на нові повідомлення в Realtime
    const channel = supabase
      .channel(`match:${matchId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `match_id=eq.${matchId}`
      }, (payload) => {
        const msg = payload.new
        setMessages((prev) => [...prev, msg])
        // Якщо повідомлення прийшло від іншої людини, позначаємо як прочитане
        if (msg.sender_id !== currentUser.id) markMessagesAsRead(matchId)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [matchId])

  useEffect(() => { scrollToBottom() }, [messages])

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    const result = await sendMessage(matchId, newMessage)
    if (result.success) {
      setNewMessage('')
    }
    setSending(false)
  }

  return (
    <div className="flex flex-col h-[500px] bg-zinc-950/50 border border-white/5 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-white/5 border-b border-white/5 flex items-center gap-3">
        <img src={targetProfile.avatar_url} className="w-8 h-8 rounded-full border border-orange-500/30" alt="" />
        <div>
          <h4 className="text-sm font-bold text-white leading-none">{targetProfile.game_name}</h4>
          <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">In-App Secure Chat</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-orange-500/20">
        {loading ? (
          <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" /></div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-600 text-xs uppercase font-bold tracking-widest">Start the conversation...</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                msg.sender_id === currentUser.id 
                  ? 'bg-orange-500 text-white rounded-tr-none' 
                  : 'bg-zinc-800 text-zinc-200 rounded-tl-none'
              }`}>
                {msg.content}
                <span className="block text-[8px] opacity-40 mt-1 text-right">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-white/5 border-t border-white/5 flex gap-2">
        <input 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 text-sm outline-none focus:border-orange-500/50 transition-all"
        />
        <button 
          type="submit" 
          disabled={sending || !newMessage.trim()}
          className="p-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl transition-all"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  )
}