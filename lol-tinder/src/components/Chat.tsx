'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/src/utils/supabase/client'
import { Send, Loader2, User, X, AlertCircle, ArrowLeft } from 'lucide-react'
import { sendMessage, getMessages, markMessagesAsRead } from '@/app/matches/actions'

// Define a type for messages to include status
interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  status?: 'sending' | 'sent' | 'failed'; // Add status field
}

export function Chat({ matchId, currentUser, targetProfile, onClose, onBack }: { matchId: string, currentUser: any, targetProfile: any, onClose?: () => void, onBack?: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]) // Use ChatMessage type
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false) // This will now control button disable, not UI state
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await getMessages(matchId)
      if (data) setMessages(data)
      setLoading(false) // Mark initial messages as sent
      markMessagesAsRead(matchId)
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
        const realMsg = payload.new as ChatMessage;
        setMessages((prev) => {
          // Check if this real message corresponds to an optimistic message we sent
          const existingOptimisticIndex = prev.findIndex(
            (msg) => msg.sender_id === realMsg.sender_id && msg.content === realMsg.content && msg.status === 'sending'
          );

          if (existingOptimisticIndex !== -1) {
            // Replace the optimistic message with the real one
            const newMessages = [...prev];
            newMessages[existingOptimisticIndex] = { ...realMsg, status: 'sent' };
            return newMessages;
          } else {
            // It's a new message (from another user or a message we sent that wasn't optimistically added)
            return [...prev, { ...realMsg, status: 'sent' }];
          }
        });
        if (realMsg.sender_id !== currentUser.id) markMessagesAsRead(matchId);
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [matchId, currentUser.id, supabase])

  useEffect(() => { scrollToBottom() }, [messages])

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const messageContent = newMessage.trim();
    if (!messageContent || sending) return

    setSending(true) // Disable button

    // 1. Create an optimistic message
    const tempId = `optimistic-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`; // Unique client-side ID
    const optimisticMessage: ChatMessage = {
      id: tempId,
      sender_id: currentUser.id,
      content: messageContent,
      created_at: new Date().toISOString(), // Use client's current time
      status: 'sending',
    };

    // 2. Add to local state immediately
    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage(''); // Clear input field immediately

    // 3. Send to server
    const result = await sendMessage(matchId, messageContent);
    
    if (!result.success) {
      // 4. Handle error: update the optimistic message status to 'failed'
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...msg, status: 'failed' } : msg
        )
      );
      // Optionally show a toast for the error
      // showToast(result.error || 'Failed to send message', 'error');
    }
    // If successful, the Realtime subscription will handle replacing the optimistic message
    setSending(false); // Re-enable button
  }

  return (
    <div className="flex flex-col h-[500px] w-full bg-zinc-900 shadow-2xl border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-1 -ml-1 text-zinc-500 hover:text-white transition-colors" title="Back to list">
              <ArrowLeft size={18} />
            </button>
          )}
          <img src={targetProfile.avatar_url} className="w-8 h-8 rounded-full border border-[rgb(var(--accent-color)/0.3)]" alt="" />
          <div>
            <h4 className="text-sm font-bold text-white leading-none">{targetProfile.game_name}</h4>
            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Secure Chat</span>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[rgb(var(--accent-color)/0.2)]">
        {loading ? (
          <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-[rgb(var(--accent-color))]" /></div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-600 text-xs uppercase font-bold tracking-widest">Start the conversation...</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                msg.sender_id === currentUser.id 
                  ? 'bg-[rgb(var(--accent-color))] text-white rounded-tr-none' 
                  : 'bg-zinc-800 text-zinc-200 rounded-tl-none'
              } ${msg.status === 'failed' ? 'bg-red-500/50' : ''}`}> {/* Highlight failed messages */}
                {msg.content}
                <span className="block text-[8px] opacity-40 mt-1 text-right flex items-center justify-end gap-1">
                  {msg.status === 'sending' && <Loader2 size={10} className="animate-spin" />} {/* Sending indicator */}
                  {msg.status === 'failed' && <AlertCircle size={10} className="text-red-300" />} {/* Error indicator */}
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
          className="flex-1 bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 text-sm outline-none focus:border-[rgb(var(--accent-color)/0.5)] transition-all"
        />
        <button 
          type="submit" 
          disabled={sending || !newMessage.trim()}
          className="p-2 bg-[rgb(var(--accent-color))] hover:brightness-110 disabled:opacity-50 text-white rounded-xl transition-all"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  )
}