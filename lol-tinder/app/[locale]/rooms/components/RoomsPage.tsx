'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/src/utils/supabase/client';
import { Users, Plus, ChevronDown, Shield, Target } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CreateRoomModal } from '@/src/components/CreateRoomModal';
import { useToast } from '@/src/components/ToastProvider';
import { getRank, GameKey } from '@/src/lib/profile';

const supabase = createClient();

export interface GameRoomsConfig {
  gameType: GameKey;
  channelKey: string;
  modes: string[];
  rankOrder: string[];
  modalRanks: string[];
}

interface RoomsPageProps {
  config: GameRoomsConfig;
}

export default function RoomsPage({ config }: RoomsPageProps) {
  const { gameType, channelKey, modes, rankOrder, modalRanks } = config;

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

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setIsFilterOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchRooms = useCallback(async () => {
    let query = supabase.from('rooms').select('*, participants:room_participants(count)').eq('game_type', gameType);
    if (filterMode !== 'ALL') query = query.eq('mode', filterMode);
    const { data } = await query.order('created_at', { ascending: false });
    setRooms(data || []);
    setLoading(false);
  }, [filterMode, gameType]);

  useEffect(() => {
    fetchRooms();
    const channel = supabase
      .channel(channelKey)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `game_type=eq.${gameType}` }, fetchRooms)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_participants' }, fetchRooms)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchRooms, channelKey, gameType]);

  const checkRankRequirement = (roomMinRank: string, roomMaxRank: string) => {
    if (!userProfile) return 'ok';
    const userRankBase = getRank(userProfile, gameType).split(' ')[0].toUpperCase();
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
    const { data, error } = await supabase.from('rooms').insert({ owner_id: user.id, game_type: gameType, mode, max_players: maxPlayers, min_rank: minRank, max_rank: maxRank, description }).select().single();
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

        {/* Mode filter — Navbar style */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setIsFilterOpen((v) => !v)}
            className="flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[10px] font-bold uppercase tracking-[1.5px] text-zinc-500 hover:text-zinc-300 transition-colors duration-150 border border-white/[0.06] hover:border-white/[0.12]"
          >
            <span style={{ color: 'rgb(var(--accent-color))' }}>{filterMode}</span>
            <ChevronDown
              size={10}
              strokeWidth={2}
              style={{
                transform: isFilterOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.18s',
              }}
            />
          </button>
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.12 }}
                className="absolute left-0 top-[calc(100%+6px)] rounded-lg overflow-hidden z-[110]"
                style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', minWidth: '140px' }}
              >
                {modes.map((m) => (
                  <button
                    key={m}
                    onClick={() => { setFilterMode(m); setIsFilterOpen(false); }}
                    className="w-full px-3 py-2.5 text-[10px] font-bold uppercase tracking-[1.5px] text-left transition-colors flex items-center justify-between whitespace-nowrap"
                    style={{ color: filterMode === m ? 'rgb(var(--accent-color))' : 'rgb(113,113,122)' }}
                  >
                    {m}
                    {filterMode === m && (
                      <span className="w-1 h-1 rounded-full ml-2 flex-shrink-0" style={{ background: 'rgb(var(--accent-color))' }} />
                    )}
                  </button>
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
                      <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1">
                        <Shield size={10} /> {room.min_rank} - {room.max_rank === 'ALL' ? '∞' : room.max_rank}
                      </span>
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
        {rooms.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center text-zinc-500 uppercase font-black tracking-widest opacity-20">{t('noRooms')}</div>
        )}
      </div>

      <CreateRoomModal
        isOpen={isCreateRoomModalOpen}
        onClose={() => setIsCreateRoomModalOpen(false)}
        initialMode={filterMode}
        onSubmit={handleCreateRoomSubmit}
        isLoading={loading}
        modes={modes.filter(m => m !== 'ALL')}
        ranks={modalRanks}
      />
    </div>
  );
}