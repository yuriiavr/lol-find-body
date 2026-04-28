'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/src/utils/supabase/client'
import { Send, Loader2, User, X, AlertCircle, ArrowLeft } from 'lucide-react'
import { sendMessage, getMessages, markMessagesAsRead } from '@/app/[locale]/matches/actions'
import { useTranslations } from 'next-intl'
interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  status?: 'sending' | 'sent' | 'failed';
}
export function Chat({ matchId, currentUser, targetProfile, onClose, onBack }: { matchId: string, currentUser: any, targetProfile: any, onClose?: () => void, onBack?: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const t = useTranslations('Chat')
  const supabase = createClient()
  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await getMessages(matchId)
      if (data) setMessages(data)
      setLoading(false)
      markMessagesAsRead(matchId)
      scrollToBottom()
    }
    loadMessages()
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
          const existingOptimisticIndex = prev.findIndex(
            (msg) => msg.sender_id === realMsg.sender_id && msg.content === realMsg.content && msg.status === 'sending'
          );
          if (existingOptimisticIndex !== -1) {
            const newMessages = [...prev];
            newMessages[existingOptimisticIndex] = { ...realMsg, status: 'sent' };
            return newMessages;
          } else {
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
    setSending(true)
    const tempId = `optimistic-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      sender_id: currentUser.id,
      content: messageContent,
      created_at: new Date().toISOString(),
      status: 'sending',
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage('');
    const result = await sendMessage(matchId, messageContent);
    if (!result.success) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...msg, status: 'failed' } : msg
        )
      );
    }
    setSending(false);
  }
  return (
    <div className="flex flex-col h-[500px] w-full bg-zinc-900 shadow-2xl border border-white/10 rounded-2xl overflow-hidden">
      <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-1 -ml-1 text-zinc-500 hover:text-white transition-colors" title="Back to list">
              <ArrowLeft size={18} />
            </button>
          )}
          <img src={targetProfile.avatar_url} className="w-8 h-8 rounded-full border border-[rgb(var(--accent-color)/0.3)]" alt="" />
          <div>
            <h4 className="text-sm font-bold text-white leading-none">{targetProfile.display_name}</h4>
            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">{t('secureChat')}</span>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        )}
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[rgb(var(--accent-color)/0.2)]">
        {loading ? (
          <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-[rgb(var(--accent-color))]" /></div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-600 text-xs uppercase font-bold tracking-widest">{t('startConversation')}</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                msg.sender_id === currentUser.id 
                  ? 'bg-[rgb(var(--accent-color))] text-white rounded-tr-none' 
                  : 'bg-zinc-800 text-zinc-200 rounded-tl-none'
              } ${msg.status === 'failed' ? 'bg-red-500/50' : ''}`}>
                {msg.content}
                <span className="block text-[8px] opacity-40 mt-1 text-right flex items-center justify-end gap-1">
                  {msg.status === 'sending' && <Loader2 size={10} className="animate-spin" />}
                  {msg.status === 'failed' && <AlertCircle size={10} className="text-red-300" />}
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      <form onSubmit={handleSend} className="p-4 bg-white/5 border-t border-white/5 flex gap-2">
        <input 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={t('placeholder')}
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