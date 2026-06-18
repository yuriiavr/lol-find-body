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
  sender?: {
    display_name: string;
    avatar_url: string;
  };
}

export function Chat({ matchId, currentUser, targetProfile, onClose, onBack }: { matchId: string, currentUser: any, targetProfile: any, onClose?: () => void, onBack?: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [sending, setSending] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const t = useTranslations('Chat')
  const supabase = createClient()

  const isRoomChat = matchId.startsWith('room-') || targetProfile.display_name === 'Room Chat';
  const actualId = matchId.replace('room-', '');
  const tableName = isRoomChat ? 'room_messages' : 'messages';
  const idColumn = isRoomChat ? 'room_id' : 'match_id';

  useEffect(() => {
    const loadMessages = async () => {
      // Важливо: у твоєму matches/actions.ts getMessages має робити join профілів
      // Якщо ні, можна зробити це тут:
      const { data } = await supabase
        .from(tableName)
        .select('*, sender:profiles(display_name, avatar_url)')
        .eq(idColumn, actualId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        const reversed = (data as any).reverse();
        setMessages(reversed);
        setHasMore(data.length === 50);
      }
      setLoading(false)
      // markMessagesAsRead працює лише для match-чатів (таблиця messages).
      // Для кімнат (room_messages) це звернення нічого не робить — пропускаємо.
      if (!isRoomChat) markMessagesAsRead(matchId)
      // Скролимо вниз лише при першому завантаженні
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }

    loadMessages()

    const channel = supabase
      .channel(`match:${matchId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: tableName,
        filter: `${idColumn}=eq.${actualId}`
      }, async (payload) => {
        const realMsg = payload.new as ChatMessage;
        
        // Якщо це нове повідомлення від іншого користувача, нам потрібен його профіль
        let senderInfo = undefined;
        if (realMsg.sender_id !== currentUser.id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('id', realMsg.sender_id)
            .single();
          if (profile) senderInfo = profile;
        }

        setMessages((prev) => {
          // Дедуп за реальним id — захист від подвійних realtime-подій.
          if (prev.some((m) => m.id === realMsg.id)) return prev;
          const msgWithSender = { ...realMsg, sender: senderInfo, status: 'sent' as const };
          const existingOptimisticIndex = prev.findIndex(
            (msg) => msg.status === 'sending' && msg.sender_id === realMsg.sender_id && msg.content === realMsg.content
          );
          if (existingOptimisticIndex !== -1) {
            const newMessages = [...prev];
            newMessages[existingOptimisticIndex] = msgWithSender;
            return newMessages;
          }
          return [...prev, msgWithSender];
        });
        if (realMsg.sender_id !== currentUser.id) {
          if (!isRoomChat) markMessagesAsRead(matchId);
          // Прокрутка вниз і на вхідні повідомлення від співрозмовника.
          setTimeout(() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
            }
          }, 50);
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [matchId, currentUser.id, supabase])

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);

    const oldestMessage = messages[0];

    const { data } = await supabase
      .from(tableName)
      .select('*, sender:profiles(display_name, avatar_url)')
      .eq(idColumn, actualId)
      .lt('created_at', oldestMessage.created_at) // Знайти ті, що створені раніше за найстаріше в поточному списку
      .order('created_at', { ascending: false })
      .limit(50);

    if (data && data.length > 0) {
      setMessages(prev => {
        const existing = new Set(prev.map((m) => m.id));
        const older = (data as any[]).reverse().filter((m) => !existing.has(m.id));
        return [...older, ...prev];
      });
      setHasMore(data.length === 50);
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

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

    // Використовуємо пряму вставку для кімнат, щоб оминути перевірки matches
    const { error } = await supabase.from(tableName).insert({
      [idColumn]: actualId,
      sender_id: currentUser.id,
      content: messageContent,
    });

    if (error) {
      console.error('Send error:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...msg, status: 'failed' } : msg
        )
      );
    } else {
      // Скролимо вниз, якщо ми успішно відправили повідомлення
      setTimeout(scrollToBottom, 50);
    }
    setSending(false);
  }
  return (
    <div className="flex flex-col h-full w-full bg-transparent">
      <div className="p-4 bg-white/[0.03] border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-1 -ml-1 text-zinc-500 hover:text-white transition-colors" title="Back to list">
              <ArrowLeft size={18} />
            </button>
          )}
          {targetProfile.avatar_url && <img src={targetProfile.avatar_url} className="w-7 h-7 rounded-lg border border-white/10" alt="" />}
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-tight text-white leading-none">{targetProfile.display_name}</h4>
            <span className="text-[8px] text-[rgb(var(--accent-color))] uppercase font-black tracking-widest opacity-70">Lobby Feed</span>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 text-zinc-500 hover:text-white transition-colors">
            <X size={16} />
           </button>
        )}
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[rgb(var(--accent-color)/0.2)]">
        {loading ? (
          <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-[rgb(var(--accent-color))]" /></div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-600 text-xs uppercase font-bold tracking-widest">{t('startConversation')}</div>
        ) : (
          <>
            {hasMore && (
              <div className="flex justify-center pb-2">
                <button 
                  onClick={loadMoreMessages}
                  disabled={loadingMore}
                  className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-[rgb(var(--accent-color))] transition-colors disabled:opacity-50"
                >
                  {loadingMore ? <Loader2 size={12} className="animate-spin" /> : 'Load older messages'}
                </button>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                {isRoomChat && msg.sender_id !== currentUser.id && (
                  <img 
                    src={msg.sender?.avatar_url || ''} 
                    className="w-8 h-8 rounded-full mt-auto mb-1 border border-white/10" 
                    alt="" 
                  />
                )}
                <div className={`max-w-[80%] flex flex-col ${msg.sender_id === currentUser.id ? 'items-end' : 'items-start'}`}>
                  {isRoomChat && msg.sender_id !== currentUser.id && (
                    <span className="text-[9px] font-black text-zinc-500 ml-1 mb-1 uppercase tracking-tight">{msg.sender?.display_name}</span>
                  )}
                  <div className={`px-3 py-2 rounded-xl text-[13px] leading-relaxed ${
                    msg.sender_id === currentUser.id 
                      ? 'bg-[rgb(var(--accent-color))] text-white shadow-lg shadow-[rgb(var(--accent-color)/0.15)]' 
                      : 'bg-white/5 text-zinc-200 border border-white/5'
                  } ${msg.status === 'failed' ? 'bg-red-500/50' : ''}`}>
                    {msg.content}
                    <span className="block text-[8px] opacity-40 mt-1 text-right flex items-center justify-end gap-1">
                      {msg.status === 'sending' && <Loader2 size={8} className="animate-spin" />}
                      {msg.status === 'failed' && <AlertCircle size={10} className="text-red-300" />}
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      <form onSubmit={handleSend} className="p-4 bg-white/[0.02] border-t border-white/5 flex gap-2">
        <input 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={t('placeholder')}
          className="flex-1 bg-black/20 border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[rgb(var(--accent-color)/0.3)] transition-all placeholder:text-zinc-600"
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