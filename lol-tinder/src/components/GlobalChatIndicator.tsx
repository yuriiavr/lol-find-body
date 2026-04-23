'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/src/utils/supabase/client'
import { MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import { Chat } from './Chat'

export function GlobalChatIndicator() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [activeChat, setActiveChat] = useState<any>(null)
  const [isWindowOpen, setIsWindowOpen] = useState(false)
  const supabase = createClient()
  const pathname = usePathname()
  const router = useRouter()

  const fetchUnreadCount = async (userId: string) => {
    const { data: matches } = await supabase
      .from('matches')
      .select('id')
      .or(`user_id.eq.${userId},target_id.eq.${userId}`)

    if (matches && matches.length > 0) {
      const matchIds = matches.map(m => m.id)
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('match_id', matchIds)
        .eq('is_read', false)
        .neq('sender_id', userId)
      
      setUnreadCount(count || 0)
    } else {
      setUnreadCount(0)
    }
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser(user)
      await fetchUnreadCount(user.id)

      // Підписка на ВСІ нові повідомлення
      const channel = supabase
        .channel('global-unread-count')
        .on('postgres_changes', { 
          event: '*', // Слухаємо INSERT (нове) та UPDATE (прочитане)
          schema: 'public', 
          table: 'messages' 
        }, () => {
           fetchUnreadCount(user.id)
        })
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }
    init()

    // Слухаємо подію на відкриття чату з інших сторінок
    const handleOpenChat = (e: any) => {
      setActiveChat(e.detail)
      setIsWindowOpen(true)
    }
    window.addEventListener('open-global-chat', handleOpenChat)
    return () => window.removeEventListener('open-global-chat', handleOpenChat)
  }, [])

  if (!user) return null

  const toggleChat = () => {
    if (!activeChat) {
      router.push('/matches')
    } else {
      setIsWindowOpen(!isWindowOpen)
    }
  }

  return (
    <>
      <AnimatePresence>
        {isWindowOpen && activeChat && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-[100] w-[350px] max-w-[calc(100vw-3rem)] shadow-2xl"
          >
            <Chat 
              matchId={activeChat.id} 
              currentUser={user} 
              targetProfile={activeChat.profile}
              onClose={() => setIsWindowOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-6 right-6 z-[60] group"
        onClick={toggleChat}
      >
        <div className="relative p-4 bg-orange-600 text-white rounded-full shadow-2xl shadow-orange-900/40 hover:bg-orange-500 transition-all active:scale-95 cursor-pointer">
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