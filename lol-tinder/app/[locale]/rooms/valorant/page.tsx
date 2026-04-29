'use client'

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/src/utils/supabase/client';
import { Users, Plus, ChevronDown, Shield, Target } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CreateRoomModal } from '@/src/components/CreateRoomModal';
import { useToast } from '@/src/components/ToastProvider';

const supabase = createClient();

export default function ValorantRooms() {
  const { showToast } = useToast();
  const t = useTranslations('Rooms');
  const router = useRouter();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);

  const modes = ['ALL', 'COMPETITIVE', 'UNRATED', 'SWIFPLAY', 'SPIKE RUSH', 'DEATHMATCH', 'PREMIER'];
  const rankOrder = ['UNRANKED', 'IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'ASCENDANT', 'IMMORTAL', 'RADIANT'];
  const modalRanks = ['ALL', 'IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'ASCENDANT', 'IMMORTAL', 'RADIANT'];

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setUserProfile(data);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchRooms = async () => {
      let query = supabase.from('rooms').select('*, participants:room_participants(count)').eq('game_type', 'valorant');
      if (filterMode !== 'ALL') query = query.eq('mode', filterMode);
      const { data } = await query.order('created_at', { ascending: false });
      setRooms(data || []);
      setLoading(false);
    };
    fetchRooms();
    const channel = supabase.channel('public:valorant-rooms').on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: 'game_type=eq.valorant' }, fetchRooms).subscribe();
    return () => { supabase.removeChannel(channel) };
  }, [filterMode]);

  const checkRankRequirement = (roomMinRank: string, roomMaxRank: string) => {
    if (!userProfile) return 'ok';
    const userRankBase = (userProfile.val_rank || 'Unranked').split(' ')[0].toUpperCase();
    const minIdx = (!roomMinRank || roomMinRank === 'ALL') ? 0 : rankOrder.indexOf(roomMinRank.replace('+', '').toUpperCase());
    const maxIdx = (!roomMaxRank || roomMaxRank === 'ALL') ? rankOrder.length - 1 : rankOrder.indexOf(roomMaxRank.replace('+', '').toUpperCase());
    const userIdx = rankOrder.indexOf(userRankBase);
    if (userIdx < minIdx) return 'low';
    if (userIdx > maxIdx) return 'high';
    return 'ok';
  };

  const handleCreateRoomSubmit = async (description: string, mode: string, maxPlayers: number, minRank: string, maxRank: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return showToast(t('loginRequired'), 'error');
    const { data, error } = await supabase.from('rooms').insert({ owner_id: user.id, game_type: 'valorant', mode, max_players: maxPlayers, min_rank: minRank, max_rank: maxRank, description }).select().single();
    if (error) return showToast(t('createRoomError', { message: error.message }), 'error');
    await supabase.from('room_participants').insert({ room_id: data.id, user_id: user.id });
    router.push(`./room/${data.id}`);
  };

  const handleJoinRoom = (room: any) => {
    const check = checkRankRequirement(room.min_rank, room.max_rank);
    if (check !== 'ok') return showToast(t(check === 'low' ? 'rankLow' : 'rankHigh'), 'error');
    router.push(`./room/${room.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:w-64" ref={filterRef}>
          <div onClick={() => setIsFilterOpen(!isFilterOpen)} className="bg-zinc-900/50 border border-white/5 rounded-xl px-5 py-3 text-sm flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all">
            <span className="text-zinc-400 font-bold uppercase tracking-wider text-[10px] mr-2">Mode:</span>
            <span className="text-white font-bold flex-1">{filterMode}</span>
            <ChevronDown size={16} className={`text-zinc-500 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
          </div>
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute z-50 top-full left-0 w-full mt-2 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl">
                {modes.map((m) => (
                  <div key={m} onClick={() => { setFilterMode(m); setIsFilterOpen(false); }} className={`px-5 py-3 text-sm font-bold uppercase tracking-tighter transition-colors cursor-pointer ${filterMode === m ? 'text-[rgb(var(--accent-color))] bg-[rgb(var(--accent-color)/0.1)]' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                    {m}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button onClick={() => setIsCreateRoomModalOpen(true)} className="btn-modern flex items-center gap-3 py-3 px-8 text-xs font-black uppercase tracking-[0.2em]">
          <Plus size={20} strokeWidth={3} /> {t('createRoom')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map(room => (
          <motion.div key={room.id} whileHover={{ y: -4 }} onClick={() => handleJoinRoom(room)} className="modern-panel p-0 cursor-pointer group overflow-hidden border-white/5 hover:border-[rgb(var(--accent-color)/0.5)] transition-all flex flex-col">
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col gap-2">
                   <div className="flex gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-[rgb(var(--accent-color))] bg-[rgb(var(--accent-color)/0.1)] px-2.5 py-1 rounded-lg border border-[rgb(var(--accent-color)/0.2)]">{room.mode}</span>
                      {((room.min_rank && room.min_rank !== 'ALL') || (room.max_rank && room.max_rank !== 'ALL')) && (
                         <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1"><Shield size={10} /> {room.min_rank} - {room.max_rank === 'ALL' ? '∞' : room.max_rank}</span>
                      )}
                   </div>
                </div>
                <div className="flex items-center gap-1.5 py-1.5 px-3 bg-white/5 rounded-xl border border-white/5 text-zinc-400 group-hover:text-white transition-colors">
                  <Users size={14} /><span className="text-xs font-black tracking-tighter">{room.participants?.[0]?.count || 0}/{room.max_players}</span>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-black tracking-tight text-white group-hover:text-[rgb(var(--accent-color))] transition-colors line-clamp-2 min-h-[3.5rem]">{room.description || 'Quick Game'}</h3>
                <div className="flex items-center gap-3 py-3 border-y border-white/5">
                   <div className="flex -space-x-2">
                     {[...Array(room.max_players)].map((_, i) => (
                       <div key={i} className={`w-7 h-7 rounded-lg border-2 border-zinc-900 flex items-center justify-center transition-all ${i < (room.participants?.[0]?.count || 0) ? 'bg-[rgb(var(--accent-color))] shadow-[0_0_10px_rgb(var(--accent-color)/0.3)]' : 'bg-zinc-800'}`}>
                         {i < (room.participants?.[0]?.count || 0) && <Target size={12} className="text-white" />}
                       </div>
                     ))}
                   </div>
                   <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Slots</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {rooms.length === 0 && !loading && <div className="col-span-full py-20 text-center text-zinc-500 uppercase font-black tracking-widest opacity-20">{t('noRooms')}</div>}
      </div>

      <CreateRoomModal isOpen={isCreateRoomModalOpen} onClose={() => setIsCreateRoomModalOpen(false)} initialMode={filterMode} onSubmit={handleCreateRoomSubmit} isLoading={loading} modes={modes.filter(m => m !== 'ALL')} ranks={modalRanks} />
    </div>
  );
}
