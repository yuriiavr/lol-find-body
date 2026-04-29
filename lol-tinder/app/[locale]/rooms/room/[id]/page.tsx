'use client'

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/src/utils/supabase/client';
import { Users, LogOut, Trash2, Send, Copy, ShieldAlert, Crown, UserPlus, Info, ExternalLink } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Chat } from '@/src/components/Chat';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/src/components/ToastProvider';
import { useGameTheme } from '@/src/context/GameThemeContext';

const supabase = createClient();

export default function LiveRoomPage() {
  const { id } = useParams();
  const router = useRouter();
  const t = useTranslations('Rooms');
  const locale = useLocale();
  const { showToast } = useToast();
  const [room, setRoom] = useState<any>(null);
  const { activeGame, setActiveGame } = useGameTheme();
  const [participants, setParticipants] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isOwner = room?.owner_id === currentUser?.id;
  const roomId = (Array.isArray(id) ? id[0] : id) as string;

  const getBackPath = (gameType?: string) => {
    const type = gameType || activeGame;
    const slug = type === 'lol' ? 'league' : type;
    return `/${locale}/rooms/${slug}`;
  };

  useEffect(() => {
    if (!roomId) return;

    const init = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return router.push(getBackPath());
      setCurrentUser(user);

      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();
      
      if (roomError || !roomData) return router.push(getBackPath());
      setRoom(roomData);
      
      setActiveGame(roomData.game_type);

      // Rank Range Check
      if ((roomData.min_rank && roomData.min_rank !== 'ALL') || (roomData.max_rank && roomData.max_rank !== 'ALL')) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        const rankOrder = roomData.game_type === 'valorant' ? ['UNRANKED', 'IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'ASCENDANT', 'IMMORTAL', 'RADIANT'] : ['UNRANKED', 'IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];
        const rankField = roomData.game_type === 'lol' ? 'solo_rank' : roomData.game_type === 'tft' ? 'tft_rank' : 'val_rank';
        const userRankBase = (profile?.[rankField] || 'Unranked').split(' ')[0].toUpperCase();
        
        const minIdx = (!roomData.min_rank || roomData.min_rank === 'ALL') ? 0 : rankOrder.indexOf(roomData.min_rank.replace('+', '').toUpperCase());
        const maxIdx = (!roomData.max_rank || roomData.max_rank === 'ALL') ? rankOrder.length - 1 : rankOrder.indexOf(roomData.max_rank.replace('+', '').toUpperCase());
        const userIdx = rankOrder.indexOf(userRankBase);

        if (userIdx < minIdx) {
           return router.push(`${getBackPath(roomData.game_type)}?error=rank_low`);
        }
        if (userIdx > maxIdx) {
           return router.push(`${getBackPath(roomData.game_type)}?error=rank_high`);
        }
      }

      // Join room automatically
      const { error: joinError } = await supabase
        .from('room_participants')
        .upsert({ room_id: roomId, user_id: user.id }, { onConflict: 'room_id,user_id' });

      if (joinError) {
        console.error('Помилка приєднанння до кімнати:', joinError);
        // Якщо це помилка RLS, ми все одно спробуємо завантажити учасників,
        // можливо ми вже там є, або просто хочемо бачити список
      }

      await fetchParticipants();
    };

    const fetchParticipants = async () => {
      const { data } = await supabase
        .from('room_participants')
        .select('*, profiles!user_id (*)')
        .eq('room_id', roomId);
      setParticipants(data || []);
      setLoading(false);
    };

    init();

    const channel = supabase.channel(`room:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_participants', filter: `room_id=eq.${roomId}` }, fetchParticipants)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, () => router.push(getBackPath(room?.game_type)))
      .subscribe();

    return () => { supabase.removeChannel(channel) };
  }, [id, roomId, setActiveGame, locale, activeGame, room?.game_type]);

  const leaveRoom = async () => {
    await supabase.from('room_participants').delete().eq('room_id', roomId).eq('user_id', currentUser.id);
    router.push(getBackPath(room?.game_type));
  };

  const closeRoom = async () => {
    showToast(t('close') + '?', 'error', {
      label: t('close'),
      onClick: async () => {
        await supabase.from('rooms').delete().eq('id', roomId);
      }
    }, 10000);
  };

  const kickPlayer = async (userId: string, userName: string) => {
    showToast(`${t('kick')} ${userName}?`, 'error', {
      label: t('kick'),
      onClick: async () => {
        await supabase.from('room_participants').delete().eq('room_id', roomId).eq('user_id', userId);
        showToast(`${userName} removed`, 'success');
      }
    }, 8000);
  };

  const copyNickname = (nick: string) => {
    navigator.clipboard.writeText(nick);
    showToast("ID Copied!", "success");
  };

  if (loading) return null;

  // Get game-specific nickname
  const getNick = (profile: any) => {
    if (!profile) return 'Призивач';
    if (room?.game_type === 'lol') return profile.riot_game_name || profile.display_name;
    if (room?.game_type === 'valorant') return profile.val_game_name || profile.display_name;
    return profile.display_name || 'Призивач';
  };

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-140px)] overflow-hidden">
      {/* Top Header Panel */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/20 backdrop-blur-xl p-5 flex flex-col md:flex-row justify-between items-center gap-6"
      >
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[rgb(var(--accent-color)/0.1)] to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[rgb(var(--accent-color))] to-[rgb(var(--accent-color)/0.6)] flex items-center justify-center text-white shadow-[0_0_25px_rgb(var(--accent-color)/0.3)]">
            <Users size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase italic tracking-tight text-white leading-tight mb-1">{room.description}</h2>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <Info size={12} className="text-[rgb(var(--accent-color))]" /> {room.mode}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-[rgb(var(--accent-color)/0.1)] border border-[rgb(var(--accent-color)/0.2)] text-[9px] font-black uppercase tracking-widest text-[rgb(var(--accent-color))]">
                {participants.length} / {room.max_players} PLAYERS
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex gap-2">
          {isOwner ? (
            <button onClick={closeRoom} className="px-6 py-2.5 rounded-xl bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center gap-2">
              <Trash2 size={14} /> {t('close')}
            </button>
          ) : (
            <button onClick={leaveRoom} className="px-6 py-2.5 rounded-xl bg-zinc-800/50 text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] hover:text-white border border-white/5 hover:bg-zinc-800 transition-all flex items-center gap-2">
              <LogOut size={14} /> {t('leave')}
            </button>
          )}
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
        {/* Main Grid Area */}
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: room.max_players }).map((_, i) => {
              const p = participants[i];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`relative group min-h-[110px] rounded-2xl border transition-all duration-300 flex items-center p-4 overflow-hidden ${
                    p 
                    ? 'bg-zinc-900/40 border-white/5 hover:border-[rgb(var(--accent-color)/0.2)] hover:bg-zinc-900/60 shadow-lg shadow-black/10' 
                    : 'bg-white/[0.02] border-dashed border-white/5'
                  }`}
                >
                  {p ? (
                    <>
                      <div className="relative z-10 flex items-center gap-4 w-full">
                        <div className="relative">
                          <img 
                            src={p.profiles?.avatar_url || ''} 
                            className="w-16 h-16 rounded-xl object-cover border-2 border-white/5 group-hover:border-[rgb(var(--accent-color)/0.3)] transition-all duration-300" 
                            alt="" 
                          />
                          {p.user_id === room.owner_id && (
                            <div className="absolute -top-2 -right-2 w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center text-zinc-900 shadow-xl border-2 border-zinc-900 ring-4 ring-amber-500/20">
                              <Crown size={14} fill="currentColor" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-base font-black text-white truncate group-hover:text-[rgb(var(--accent-color))] transition-colors mb-0.5 tracking-tight">{getNick(p.profiles)}</p>
                          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.1em]">
                            {p.user_id === room.owner_id ? t('roomOwner') : 'Member'}
                          </p>
                          
                          <div className="mt-2.5 flex gap-1.5">
                             <button 
                              onClick={() => copyNickname(getNick(p.profiles))}
                              className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-all text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-white/5"
                             >
                               <Copy size={10} /> ID
                             </button>
                             {isOwner && p.user_id !== currentUser.id && (
                               <button 
                                onClick={() => kickPlayer(p.user_id, getNick(p.profiles))}
                                className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-500 transition-all text-[8px] font-black uppercase tracking-widest"
                               >
                                 {t('kick')}
                               </button>
                             )}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full flex items-center justify-center gap-3 opacity-30 group-hover:opacity-50 transition-opacity">
                      <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} className="w-10 h-10 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center">
                        <UserPlus size={14} className="text-white" />
                      </motion.div>
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-800">{t('emptySlot')}</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Chat Area */}
        <div className="w-full lg:w-[400px] flex flex-col h-[500px] lg:h-[500px]">
          <div className="flex-1 rounded-3xl overflow-hidden border border-white/5 bg-zinc-900/10 backdrop-blur-md shadow-2xl">
            <Chat 
              matchId={roomId} 
              currentUser={currentUser}
              targetProfile={{ display_name: 'Room Chat', avatar_url: '' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
