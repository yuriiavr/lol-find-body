"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion"
import { Heart, Sword, Zap, User, LogIn, Filter, Activity, Search, Globe, Trophy, ExternalLink, Languages, LayoutGrid, Loader2, MicOff } from "lucide-react"
import { createClient } from "@/src/utils/supabase/client";
import Link from "next/link";

const POPULAR_LANGUAGES = [
  "Ukrainian", "English", "Polish", "German", "French", 
  "Spanish", "Italian", "Romanian", "Dutch", "Hungarian", "Czech"
];

// Виносимо створення клієнта Supabase за межі компонента
// Це гарантує, що він створюється лише один раз і є стабільним
const supabase = createClient();

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastDirection, setLastDirection] = useState<string | null>(null);

  // Фільтри
  const [filterRegion, setFilterRegion] = useState<string>("EUW");
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [filterRank, setFilterRank] = useState<string>("ALL");
  const [filterLangs, setFilterLangs] = useState<string[]>([]);
  const [filterQueue, setFilterQueue] = useState<string>("ALL");
  const [onlyOnline, setOnlyOnline] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setIsLoading(false);
    };
    getUser(); // supabase більше не є залежністю, оскільки він стабільний
  }, [supabase]);

  // Load filters from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('lol-match-filters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.region) setFilterRegion(parsed.region);
        if (parsed.role) setFilterRole(parsed.role);
        if (parsed.rank) setFilterRank(parsed.rank);
        if (parsed.langs) setFilterLangs(parsed.langs);
        if (parsed.queue) setFilterQueue(parsed.queue);
        if (parsed.online !== undefined) setOnlyOnline(parsed.online);
      } catch (e) {
        console.error("Failed to parse filters from localStorage", e);
      }
    }
  }, []);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    const filters = {
      region: filterRegion,
      role: filterRole,
      rank: filterRank,
      langs: filterLangs,
      queue: filterQueue,
      online: onlyOnline
    };
    localStorage.setItem('lol-match-filters', JSON.stringify(filters));
  }, [filterRegion, filterRole, filterRank, filterLangs, filterQueue, onlyOnline]);

  // Завантаження гравців з бази
  useEffect(() => {
    const fetchPlayers = async () => {
      // Чекаємо, поки завантажиться інформація про юзера, щоб уникнути показу власної картки
      if (isLoading) return;

      setIsFetching(true);
      
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('is_paused', false)
        .eq('region', filterRegion)
        .ilike('enabled_games', '%LOL%');

      if (user) {
        // Отримуємо всі ID користувачів, з якими вже є запис у таблиці matches
        const { data: existingMatches } = await supabase
          .from('matches')
          .select('user_id, target_id')
          .or(`user_id.eq.${user.id},target_id.eq.${user.id}`);

        const excludedIds = [user.id]; // Починаємо з себе

        if (existingMatches) {
          existingMatches.forEach(m => {
            excludedIds.push(m.user_id === user.id ? m.target_id : m.user_id);
          });
        }

        // Виключаємо всіх знайдених користувачів одним фільтром
        query = query.not('id', 'in', `(${excludedIds.join(',')})`);
      }

      if (filterRole !== "ALL") {
        query = query.eq('main_role', filterRole);
      }

      if (filterRank !== "ALL") {
        // Пошук за підстрокою в ранзі (наприклад 'PLATINUM')
        query = query.ilike('solo_rank', `%${filterRank}%`);
      }

      if (filterLangs.length > 0) {
        // Логіка OR: шукаємо гравців, у яких в полі language є хоча б одна з обраних мов
        const orConditions = filterLangs.map(lang => `language.ilike.%${lang}%`).join(',');
        query = query.or(orConditions);
      }

      if (filterQueue !== "ALL") {
        query = query.eq('preferred_queue', filterQueue);
      }

      if (onlyOnline) {
        // Вважаємо онлайн, якщо активність була в останні 10 хвилин
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        query = query.gt('last_seen', tenMinutesAgo);
      }

      const { data, error } = await query.limit(20);
      
      if (!error && data) {
        setPlayers(data);
        setCurrentIndex(0);
      }
      setIsFetching(false);
    };

    fetchPlayers();

    // Оновлюємо статус "last_seen" для поточного користувача
    if (user) {
      supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', user.id).then();
    }
  }, [user, isLoading, filterRegion, filterRole, filterRank, filterLangs, filterQueue, onlyOnline, supabase]);

  const handleLogin = async () => {
    const redirectTo = typeof window !== 'undefined' 
      ? `${window.location.origin}/auth/callback`
      : undefined;

    await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo },
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="animate-spin text-orange-500" size={48} />
      </div>
    );
  }

  return ( // The main div and main tag are now provided by the (discovery) layout
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left Filter Sidebar */}
      <aside className="w-full lg:w-80 space-y-6">
              <div className="modern-panel p-6">
                <div className="flex items-center gap-3 mb-8 border-b border-zinc-800 pb-4">
                  <Filter size={18} className="text-orange-400" />
                  <h3 className="font-bold uppercase tracking-[0.2em] text-[10px] text-zinc-500">Filter Rift</h3>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Region / Server</label>
                    <select 
                      value={filterRegion} 
                      onChange={(e) => setFilterRegion(e.target.value)}
                      className="w-full bg-zinc-950/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all cursor-pointer appearance-none hover:border-white/10"
                    >
                      <option value="EUW">Europe West</option>
                      <option value="EUNE">Europe Nordic & East</option>
                      <option value="NA">North America</option>
                      <option value="KR">Korea</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Main Role</label>
                    <select 
                      value={filterRole} 
                      onChange={(e) => setFilterRole(e.target.value)}
                      className="w-full bg-zinc-950/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all cursor-pointer appearance-none hover:border-white/10"
                    >
                      <option value="ALL">All Positions</option>
                      <option value="TOP">TOP LANE</option>
                      <option value="JUNGLE">JUNGLE</option>
                      <option value="MID">MID LANE</option>
                      <option value="ADC">ADC / BOTTOM</option>
                      <option value="SUPPORT">SUPPORT</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tier Rank</label>
                    <select 
                      value={filterRank} 
                      onChange={(e) => setFilterRank(e.target.value)}
                      className="w-full bg-zinc-950/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all cursor-pointer appearance-none hover:border-white/10"
                    >
                      <option value="ALL">All Ranks</option>
                      <option value="IRON">Iron</option>
                      <option value="BRONZE">Bronze</option>
                      <option value="SILVER">Silver</option>
                      <option value="GOLD">Gold</option>
                      <option value="PLATINUM">Platinum</option>
                      <option value="EMERALD">Emerald</option>
                      <option value="DIAMOND">Diamond</option>
                      <option value="MASTER">Master+</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Queue Type</label>
                    <select 
                      value={filterQueue} 
                      onChange={(e) => setFilterQueue(e.target.value)}
                      className="w-full bg-zinc-950/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all cursor-pointer appearance-none hover:border-white/10"
                    >
                      <option value="ALL">All Queues</option>
                      <option value="SOLO">SOLO / DUO</option>
                      <option value="FLEX">FLEX QUEUE</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Language</label>
                    <div className="flex flex-wrap gap-1">
                      {POPULAR_LANGUAGES.map(lang => (
                        <button
                          key={lang}
                          onClick={() => setFilterLangs(prev => 
                            prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
                          )}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-all ${
                            filterLangs.includes(lang)
                              ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                              : 'bg-slate-900 border-white/5 text-slate-600'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => setOnlyOnline(!onlyOnline)}
                    className={`flex items-center justify-between w-full p-4 rounded-xl border transition-all ${onlyOnline ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-zinc-800 bg-zinc-900/50 text-zinc-500'}`}
                  >
                    <span className="text-xs font-bold uppercase">Live Online</span>
                    <Activity size={16} />
                  </button>
                </div>
              </div>
            </aside>
      
      {/* Discovery Grid */}
      <div className="flex-1">
              {isFetching ? (
                <div className="w-full h-96 flex items-center justify-center">
                  <Loader2 className="animate-spin text-orange-500/50" size={32} />
                </div>
              ) : (
                <div className="main-grid">
                <AnimatePresence mode="popLayout">
                  {players.length > 0 ? (
                    players.map((player) => (
                      <motion.div
                        key={player.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="modern-panel p-6 group flex flex-col h-full"
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex gap-4">
                            <div className="relative group/avatar">
                              <div className="w-14 h-14 rounded-xl bg-zinc-800 p-[1px] group-hover/avatar:bg-orange-500/50 transition-colors">
                                <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center overflow-hidden">
                                  {player.avatar_url ? (
                                    <img src={player.avatar_url} className="w-full h-full object-cover" alt="" />
                                  ) : (
                                    <User size={28} className="text-slate-700" />
                                  )}
                                </div>
                              </div>
                              {new Date(player.last_seen).getTime() > Date.now() - 10 * 60 * 1000 && (
                                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-lg shadow-emerald-500/50" />
                              )}
                              {player.has_mic === false && (
                                <div className="absolute -bottom-1 -left-1 text-red-500 bg-[#0a0a0a] rounded-full p-0.5"><MicOff size={14} /></div>
                              )}
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors">{player.game_name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Trophy size={12} className="text-orange-400" />
                                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-tighter">
                                  {player.preferred_queue === 'FLEX' ? player.flex_rank : player.solo_rank}
                                </span>
                                <span className="text-zinc-800">•</span>
                                <span className="text-[10px] font-bold text-orange-400/60 uppercase">{player.preferred_queue === 'FLEX' ? 'Flex' : 'Solo'}</span>
                                {player.language && (
                                  <>
                                    <span className="text-zinc-800">•</span>
                                    <span className="text-[10px] font-black uppercase text-zinc-500 tracking-tighter">{player.language}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="bg-blue-500/10 px-2 py-1 rounded text-[10px] font-bold text-blue-400 border border-blue-500/20">
                            {player.main_role}
                          </div>
                        </div>

                        <div className="flex-1 bg-black/20 rounded-lg p-4 mb-6 border border-white/[0.02]">
                          <p className="text-sm text-zinc-400 italic leading-relaxed">
                            "{player.bio || "Жодної інформації не додано."}"
                          </p>
                        </div>

                        <Link href={`/profile/${player.id}`} className="w-full">
                          <button className="btn-modern w-full text-xs py-3">
                            View Profile
                          </button>
                        </Link>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full py-40 flex flex-col items-center gap-4 text-slate-600">
                      <Search size={64} className="opacity-10" />
                      <p className="font-bold uppercase tracking-widest text-sm">No players found with current filters</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
              )}
      </div>
    </div>
  );
}
