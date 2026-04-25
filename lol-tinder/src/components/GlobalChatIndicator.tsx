'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/src/utils/supabase/client'
import { MessageCircle, X, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import { getMatches } from '@/app/matches/actions'
import { Chat } from './Chat'
import { useToast } from '@/src/components/ToastProvider'

const supabase = createClient();

export function GlobalChatIndicator() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [activeChat, setActiveChat] = useState<any>(null)
  const [isWindowOpen, setIsWindowOpen] = useState(false)
  const [matches, setMatches] = useState<any[]>([])
  const [pendingMatchesCount, setPendingMatchesCount] = useState(0)
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({})
  const pathname = usePathname()
  const router = useRouter()
  const { showToast } = useToast()

  const fetchMatchesAndUnread = async (userId: string) => {
    const res = await getMatches()
    if (res.data) {
      const acceptedMatches = res.data.filter((m: any) => m.status === 'ACCEPTED')
      setMatches(acceptedMatches)
      const pendingIncoming = res.data.filter((m: any) => m.status === 'PENDING' && m.isIncoming)
      setPendingMatchesCount(pendingIncoming.length)
      const matchIds = acceptedMatches.map((m: any) => m.id)
      if (matchIds.length > 0) {
        const { data: unreadData } = await supabase
          .from('messages')
          .select('match_id')
          .in('match_id', matchIds)
          .eq('is_read', false)
          .neq('sender_id', userId)
        
        const counts: Record<string, number> = {}
        unreadData?.forEach((msg: any) => {
          counts[msg.match_id] = (counts[msg.match_id] || 0) + 1
        })
        setUnreadMap(counts)
        setUnreadCount(Object.values(counts).reduce((a, b) => a + b, 0))
      } else {
        setUnreadMap({})
        setUnreadCount(0)
      }
    }
  }

  useEffect(() => {
    const channel = supabase.channel(`global-unread-${Math.random()}`);

    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return
      setUser(authUser)
      await fetchMatchesAndUnread(authUser.id)

      channel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
          fetchMatchesAndUnread(authUser.id)
          if (payload.eventType === 'INSERT' && payload.new.sender_id !== authUser.id && !pathname.includes('/matches')) {
            showToast("New message received!", "success");
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => fetchMatchesAndUnread(authUser.id))
        .subscribe()
    }
    init()

    const handleOpenChat = (e: any) => {
      setActiveChat(e.detail)
      setIsWindowOpen(true)
    }
    window.addEventListener('open-global-chat', handleOpenChat)

    return () => {
      window.removeEventListener('open-global-chat', handleOpenChat)
      supabase.removeChannel(channel)
    }
  }, [pathname, showToast])

  useEffect(() => {
    const totalNotifications = unreadCount + pendingMatchesCount;
    if (totalNotifications > 0) {
      document.title = `(${totalNotifications}) LoLMatch - Find your Duo`;
    } else {
      document.title = `LoLMatch - Find your Duo`;
    }
  }, [unreadCount, pendingMatchesCount]);

  if (!user) return null

  const toggleChat = () => {
    setIsWindowOpen(!isWindowOpen)
  }

  return (
    <>
      <AnimatePresence>
        {isWindowOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-[100] w-[350px] max-w-[calc(100vw-3rem)] shadow-2xl"
          >
            {activeChat ? (
              <Chat 
                matchId={activeChat.id} 
                currentUser={user} 
                targetProfile={activeChat.profile}
                onClose={() => setIsWindowOpen(false)}
                onBack={() => setActiveChat(null)}
              />
            ) : (
              <div className="flex flex-col h-[500px] w-full bg-zinc-900 shadow-2xl border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                   <h4 className="text-sm font-bold text-white">Messages</h4>
                   <button onClick={() => setIsWindowOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                     <X size={18} />
                   </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-white/5">
                   {matches.length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center text-zinc-600 p-8 text-center">
                        <MessageCircle size={32} className="mb-2 opacity-20" />
                        <p className="text-xs uppercase font-bold tracking-widest">No active chats. Match with players to start talking!</p>
                     </div>
                   ) : (
                     matches.map(m => (
                       <button 
                         key={m.id}
                         onClick={() => setActiveChat(m)}
                         className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all group"
                       >
                         <div className="flex items-center gap-3">
                           <div className="relative">
                             <img src={m.profile.avatar_url} className="w-10 h-10 rounded-full border border-white/10" alt="" />
                             {unreadMap[m.id] > 0 && (
                               <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-zinc-900" />
                             )}
                             {m.profile.last_seen && new Date(m.profile.last_seen).getTime() > Date.now() - 10 * 60 * 1000 && (
                               <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-900" />
                             )}
                           </div>
                           <div className="text-left">
                             <p className="text-sm font-bold text-zinc-200 group-hover:text-[rgb(var(--accent-color))] transition-colors">{m.profile.game_name}</p>
                             {m.last_message && (
                               <p className="text-[10px] text-zinc-500 truncate max-w-[180px]">
                                 {m.last_message.sender_id === user.id && <span className="text-[rgb(var(--accent-color))] font-black mr-1">You:</span>}
                                 {m.last_message.content}
                               </p>
                             )}
                           </div>
                         </div>
                         <ChevronRight size={16} className="text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                       </button>
                     ))
                   )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-6 right-6 z-[60] group"
        onClick={toggleChat}
      >
        <div className="relative p-4 bg-[rgb(var(--accent-color))] text-white rounded-full shadow-2xl shadow-[rgb(var(--accent-color)/0.4)] hover:brightness-110 transition-all active:scale-95 cursor-pointer">
          <MessageCircle size={24} />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] font-black border-2 border-[#0a0a0a]"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  )
}