'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/src/utils/supabase/client';
import { Users, LogOut, Trash2, Send, Copy, ShieldAlert, Crown, UserPlus, Info, Ban } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Chat } from '@/src/components/Chat';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/src/components/ToastProvider';
import { useGameTheme } from '@/src/context/GameThemeContext';
import { getRank, getGameName, getTagLine, type GameKey } from '@/src/lib/profile';

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

  const gameTypeRef = useRef<string>('lol');
  const currentUserIdRef = useRef<string | null>(null);
  const roomIdRef = useRef<string>('');

  const isOwner = room?.owner_id === currentUser?.id;
  const roomId = (Array.isArray(id) ? id[0] : id) as string;

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  const getBackPath = (gameType?: string) => {
    const type = gameType || gameTypeRef.current || activeGame;
    const slug = type === 'lol' ? 'league' : type;
    return `/${locale}/rooms/${slug}`;
  };

  // ─── FIX: fetchParticipants без фільтра по room_id в realtime ─────────────
  // Supabase не гарантує передачу фільтрованих полів у DELETE payload,
  // тому завжди робимо явний запит до БД.
  const fetchParticipants = useCallback(async (rId?: string) => {
    const targetRoomId = rId || roomIdRef.current;
    if (!targetRoomId) return;

    const { data } = await supabase
      .from('room_participants')
      .select('*, profiles!user_id (*)')
      .eq('room_id', targetRoomId);

    const list = data || [];
    setParticipants(list);

    // Авто-видалення кімнати якщо пуста
    if (list.length === 0) {
      await supabase.from('rooms').delete().eq('id', targetRoomId);
      router.push(getBackPath());
      return;
    }

    // Якщо поточного юзера немає в списку → його кікнули або він вийшов
    if (currentUserIdRef.current && !list.some((p: any) => p.user_id === currentUserIdRef.current)) {
      router.push(getBackPath());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!roomId) return;

    const init = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return router.push(getBackPath());
      setCurrentUser(user);
      currentUserIdRef.current = user.id;

      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError || !roomData) return router.push(getBackPath());
      setRoom(roomData);
      gameTypeRef.current = roomData.game_type;
      setActiveGame(roomData.game_type);

      // Перевірка бану
      const { data: banData } = await supabase
        .from('room_bans')
        .select('id')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .single();

      if (banData) {
        showToast(t('banned'), 'error');
        return router.push(getBackPath(roomData.game_type));
      }

      // Перевірка рангу
      if ((roomData.min_rank && roomData.min_rank !== 'ALL') || (roomData.max_rank && roomData.max_rank !== 'ALL')) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        const rankOrder = roomData.game_type === 'valorant'
          ? ['UNRANKED', 'IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'ASCENDANT', 'IMMORTAL', 'RADIANT']
          : ['UNRANKED', 'IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];
        const userRankBase = getRank(profile, roomData.game_type as GameKey).split(' ')[0].toUpperCase();
        const minIdx = (!roomData.min_rank || roomData.min_rank === 'ALL') ? 0 : rankOrder.indexOf(roomData.min_rank.replace('+', '').toUpperCase());
        const maxIdx = (!roomData.max_rank || roomData.max_rank === 'ALL') ? rankOrder.length - 1 : rankOrder.indexOf(roomData.max_rank.replace('+', '').toUpperCase());
        const userIdx = rankOrder.indexOf(userRankBase);
        if (userIdx < minIdx) return router.push(`${getBackPath(roomData.game_type)}?error=rank_low`);
        if (userIdx > maxIdx) return router.push(`${getBackPath(roomData.game_type)}?error=rank_high`);
      }

      // 1 юзер = 1 кімната: виходимо з усіх інших кімнат
      const { data: existingRooms } = await supabase
        .from('room_participants')
        .select('room_id')
        .eq('user_id', user.id)
        .neq('room_id', roomId);

      if (existingRooms && existingRooms.length > 0) {
        for (const er of existingRooms) {
          await supabase
            .from('room_participants')
            .delete()
            .eq('room_id', er.room_id)
            .eq('user_id', user.id);

          const { data: remaining } = await supabase
            .from('room_participants')
            .select('id')
            .eq('room_id', er.room_id);

          if (!remaining || remaining.length === 0) {
            await supabase.from('rooms').delete().eq('id', er.room_id);
          }
        }
      }

      // Вступаємо в поточну кімнату
      await supabase
        .from('room_participants')
        .upsert({ room_id: roomId, user_id: user.id }, { onConflict: 'room_id,user_id' });

      await fetchParticipants(roomId);
      setLoading(false);
    };

    init();

    // ─── FIX: Realtime через broadcast канал ──────────────────────────────
    // Замість ненадійних postgres_changes з фільтрами для DELETE,
    // використовуємо broadcast повідомлення які надсилаємо після кожної дії.
    // Postgres_changes залишаємо тільки для INSERT (вони надійні).
    const channel = supabase.channel(`room:${roomId}`, {
      config: { broadcast: { self: true } }
    })
      // INSERT учасника — надійно працює з фільтром
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'room_participants',
        filter: `room_id=eq.${roomId}`
      }, () => fetchParticipants(roomId))

      // FIX: Broadcast "refresh" — надсилається після kick/ban/leave
      // Всі клієнти в каналі отримують і оновлюють список
      .on('broadcast', { event: 'participants_changed' }, () => {
        fetchParticipants(roomId);
      })

      // Кімнату видалено → редірект для всіх
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${roomId}`
      }, () => {
        showToast(t('roomClosed'), 'error');
        router.push(getBackPath());
      })

      // Бан вставлено
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'room_bans',
        filter: `room_id=eq.${roomId}`
      }, async (payload) => {
        if (currentUserIdRef.current && (payload.new as any)?.user_id === currentUserIdRef.current) {
          showToast(t('banned'), 'error');
          router.push(getBackPath());
        }
        // FIX: Не робимо fetchParticipants тут — він прийде через broadcast нижче
      })
      .subscribe();

    // Зберігаємо канал у ref щоб використовувати для broadcast
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // Ref для доступу до каналу в обробниках
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ─── FIX: broadcastRefresh — надсилає всім сигнал оновити список ─────────
  const broadcastRefresh = useCallback(async () => {
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'participants_changed',
        payload: {}
      });
    }
  }, []);

  // ─── Вийти з кімнати ──────────────────────────────────────────────────────
  const leaveRoom = async () => {
    if (!currentUser) return;

    await supabase
      .from('room_participants')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', currentUser.id);

    // FIX: Broadcast щоб інші оновили список одразу
    await broadcastRefresh();

    const { data: remaining } = await supabase
      .from('room_participants')
      .select('id')
      .eq('room_id', roomId);

    if (!remaining || remaining.length === 0) {
      await supabase.from('rooms').delete().eq('id', roomId);
    }

    router.push(getBackPath(room?.game_type));
  };

  // ─── Закрити кімнату (власник) ────────────────────────────────────────────
  const closeRoom = async () => {
    showToast(t('close') + '?', 'error', {
      label: t('close'),
      onClick: async () => {
        await supabase.from('rooms').delete().eq('id', roomId);
        router.push(getBackPath(room?.game_type));
      }
    }, 10000);
  };

  // ─── Кікнути гравця ───────────────────────────────────────────────────────
  const kickPlayer = async (userId: string, userName: string) => {
    showToast(`${t('kick')} ${userName}?`, 'error', {
      label: t('kick'),
      onClick: async () => {
        // FIX: Видаляємо з БД
        const { error } = await supabase
          .from('room_participants')
          .delete()
          .eq('room_id', roomId)
          .eq('user_id', userId);

        if (error) {
          showToast('Error kicking player', 'error');
          return;
        }

        // FIX: Broadcast → всі (включно з власником) оновлять список
        await broadcastRefresh();

        showToast(`${userName} ${t('kickedSuccess')}`, 'success');
      }
    }, 8000);
  };

  // ─── Забанити гравця ──────────────────────────────────────────────────────
  const banPlayer = async (userId: string, userName: string) => {
    showToast(`${t('ban')} ${userName}?`, 'error', {
      label: t('ban'),
      onClick: async () => {
        // Спочатку бан → realtime відправить забаненого геть через postgres_changes
        await supabase.from('room_bans').upsert(
          { room_id: roomId, user_id: userId },
          { onConflict: 'room_id,user_id' }
        );

        // Потім видаляємо з кімнати
        await supabase
          .from('room_participants')
          .delete()
          .eq('room_id', roomId)
          .eq('user_id', userId);

        // FIX: Broadcast щоб власник і всі інші оновили список
        await broadcastRefresh();

        showToast(`${userName} ${t('bannedSuccess')}`, 'success');
      }
    }, 8000);
  };

  const copyNickname = (nick: string) => {
    navigator.clipboard.writeText(nick);
    showToast('ID Copied!', 'success');
  };

  if (loading) return null;

  const getNick = (profile: any) => {
    if (!profile) return 'Summoner';
    const game = room?.game_type as GameKey;
    const name = getGameName(profile, game) || profile.display_name;
    const tag = getTagLine(profile, game);
    if (name && tag) return `${name}#${tag}`;
    return profile.display_name || 'Summoner';
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
            <button onClick={closeRoom} className="flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[10px] font-bold uppercase tracking-[1.5px] transition-colors duration-150 border border-red-500/30 hover:border-red-500/50 text-red-500 hover:text-red-400">
              <Trash2 size={10} strokeWidth={2} /> {t('close')}
            </button>
          ) : (
            <button onClick={leaveRoom} className="flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[10px] font-bold uppercase tracking-[1.5px] text-zinc-500 hover:text-zinc-300 transition-colors duration-150 border border-white/[0.06] hover:border-white/[0.12]">
              <LogOut size={10} strokeWidth={2} /> {t('leave')}
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
                        <p className="text-base font-black text-white truncate group-hover:text-[rgb(var(--accent-color))] transition-colors mb-0.5 tracking-tight">
                          {getNick(p.profiles)}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.1em]">
                            {p.user_id === room.owner_id ? t('roomOwner') : 'Member'}
                          </p>
                          {(() => {
                            const rank = getRank(p.profiles, room.game_type as GameKey);
                            const isUnranked = !rank || rank === 'Unranked';
                            if (isUnranked) return (
                              <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Unranked</span>
                            );
                            const tier = rank.split(' ')[0]?.toUpperCase();
                            const rankColors: Record<string, string> = {
                              IRON: 'text-zinc-400', BRONZE: 'text-amber-700', SILVER: 'text-slate-300',
                              GOLD: 'text-yellow-400', PLATINUM: 'text-teal-400', EMERALD: 'text-emerald-400',
                              DIAMOND: 'text-blue-400', MASTER: 'text-purple-400', GRANDMASTER: 'text-red-400',
                              CHALLENGER: 'text-yellow-300', ASCENDANT: 'text-green-400',
                              IMMORTAL: 'text-red-500', RADIANT: 'text-yellow-200',
                            };
                            return (
                              <span className={`text-[9px] font-black uppercase tracking-widest ${rankColors[tier] ?? 'text-zinc-400'}`}>
                                {rank}
                              </span>
                            );
                          })()}
                        </div>

                        <div className="mt-2.5 flex gap-1.5">
                          <button
                            onClick={() => copyNickname(getNick(p.profiles))}
                            className="flex items-center gap-1.5 h-7 px-2 rounded-md text-[9px] font-bold uppercase tracking-[1.5px] text-zinc-500 hover:text-zinc-300 transition-colors duration-150 border border-white/[0.06] hover:border-white/[0.12]"
                          >
                            <Copy size={9} strokeWidth={2} /> ID
                          </button>
                          {isOwner && p.user_id !== currentUser.id && (
                            <>
                              <button
                                onClick={() => kickPlayer(p.user_id, getNick(p.profiles))}
                                className="flex items-center gap-1.5 h-7 px-2 rounded-md text-[9px] font-bold uppercase tracking-[1.5px] transition-colors duration-150 border border-red-500/30 hover:border-red-500/50 text-red-500 hover:text-red-400"
                              >
                                <ShieldAlert size={9} strokeWidth={2} /> {t('kick')}
                              </button>
                              <button
                                onClick={() => banPlayer(p.user_id, getNick(p.profiles))}
                                className="flex items-center gap-1.5 h-7 px-2 rounded-md text-[9px] font-bold uppercase tracking-[1.5px] transition-colors duration-150 border border-orange-500/30 hover:border-orange-500/50 text-orange-500 hover:text-orange-400"
                              >
                                <Ban size={9} strokeWidth={2} /> {t('ban')}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
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