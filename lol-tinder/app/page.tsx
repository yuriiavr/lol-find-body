"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion"
import { Heart, Sword, Zap, User, LogIn, Filter, Activity, Search, Globe, Trophy, ExternalLink } from "lucide-react"
import { createClient } from "@/src/utils/supabase/client";
import Link from "next/link";

export default function Home() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastDirection, setLastDirection] = useState<string | null>(null);

  // Фільтри
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [filterRank, setFilterRank] = useState<string>("ALL");
  const [onlyOnline, setOnlyOnline] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setIsLoading(false);
    };
    getUser();
  }, [supabase]);

  // Завантаження гравців з бази
  useEffect(() => {
    const fetchPlayers = async () => {
      if (!user) return;
      setIsLoading(true);
      
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id); // Не показувати самого себе

      if (filterRole !== "ALL") {
        query = query.eq('main_role', filterRole);
      }

      if (filterRank !== "ALL") {
        // Пошук за підстрокою в ранзі (наприклад 'PLATINUM')
        query = query.ilike('solo_rank', `%${filterRank}%`);
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
      setIsLoading(false);
    };

    fetchPlayers();

    // Оновлюємо статус "last_seen" для поточного користувача
    if (user) {
      supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', user.id).then();
    }
  }, [user, filterRole, filterRank, onlyOnline, supabase]);

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
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <Zap className="animate-bounce text-violet-500" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-slate-50 flex flex-col">
      {/* Desktop Navbar */}
      <nav className="w-full border-b border-white/5 bg-slate-900/20 backdrop-blur-lg sticky top-0 z-50 px-6">
        <div className="max-w-[1600px] mx-auto h-20 flex justify-between items-center">
          <div className="flex items-center gap-10">
            <h1 className="text-2xl font-black text-tech-gradient tracking-tighter italic">LoLMatch</h1>
            {user && (
              <div className="hidden md:flex gap-6 text-xs font-bold uppercase tracking-widest text-slate-400">
                <Link href="/" className="text-white border-b-2 border-violet-500 pb-1">Discovery</Link>
                <Link href="/matches" className="hover:text-white transition-colors">Matches</Link>
              </div>
            )}
          </div>
          
          <div>
            {user ? (
              <Link href="/profile" className="flex items-center gap-3 p-1.5 pr-5 bg-slate-800/40 rounded-full hover:bg-slate-700/50 border border-white/5 transition-all">
                <img src={user.user_metadata.avatar_url} className="w-8 h-8 rounded-full border border-violet-500/50" alt="avatar" />
                <span className="text-sm font-bold">{user.user_metadata.full_name}</span>
              </Link>
            ) : (
              <button onClick={handleLogin} className="btn-modern py-2.5">
                <LogIn size={18} /> Login
              </button>
            )}
          </div>
        </div>
      </nav>

      {!user ? (
        <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-600/10 blur-[150px] rounded-full -z-10" />
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <h2 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-none uppercase">
              Find Your <br/> <span className="text-tech-gradient">Perfect Duo</span>
            </h2>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Професійна платформа для пошуку тіммейтів в League of Legends. <br className="hidden md:block" />
              Об'єднуйся з гравцями твого рівня та перемагай разом.
            </p>
            <button onClick={handleLogin} className="btn-modern px-14 py-5 text-lg scale-110 shadow-violet-600/30">
              <LogIn size={24} /> Get Started
            </button>
          </motion.div>
        </main>
      ) : (
        <main className="flex-1 w-full max-w-[1600px] mx-auto p-6 md:p-10">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Filter Sidebar */}
            <aside className="w-full lg:w-80 space-y-6">
              <div className="modern-panel p-6">
                <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-4">
                  <Filter size={18} className="text-violet-400" />
                  <h3 className="font-bold uppercase tracking-[0.2em] text-[10px] text-slate-500">Filter Rift</h3>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Main Role</label>
                    <select 
                      value={filterRole} 
                      onChange={(e) => setFilterRole(e.target.value)}
                      className="modern-input text-sm"
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
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tier Rank</label>
                    <select 
                      value={filterRank} 
                      onChange={(e) => setFilterRank(e.target.value)}
                      className="modern-input text-sm"
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

                  <button 
                    onClick={() => setOnlyOnline(!onlyOnline)}
                    className={`flex items-center justify-between w-full p-4 rounded-xl border-2 transition-all ${onlyOnline ? 'border-violet-500 bg-violet-500/10 text-violet-400' : 'border-white/5 bg-slate-800/30 text-slate-500'}`}
                  >
                    <span className="text-xs font-black uppercase">Live Online</span>
                    <Activity size={16} />
                  </button>
                </div>
              </div>
            </aside>

            {/* Discovery Grid */}
            <div className="flex-1">
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
                            <div className="relative">
                              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 p-[2px]">
                                <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center overflow-hidden">
                                  <User size={28} className="text-slate-700" />
                                </div>
                              </div>
                              {new Date(player.last_seen).getTime() > Date.now() - 10 * 60 * 1000 && (
                                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-lg shadow-emerald-500/50" />
                              )}
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-white group-hover:text-violet-400 transition-colors">{player.game_name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Trophy size={12} className="text-violet-400" />
                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">{player.solo_rank}</span>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white/5 px-2 py-1 rounded text-[10px] font-bold text-cyan-400 border border-white/5">
                            {player.main_role}
                          </div>
                        </div>

                        <div className="flex-1 bg-slate-950/30 rounded-xl p-4 mb-6 border border-white/5">
                          <p className="text-sm text-slate-400 italic leading-relaxed">
                            "{player.bio || "Жодної інформації не додано."}"
                          </p>
                        </div>

                        <button className="btn-modern w-full text-xs py-3">
                          Connect Profile
                        </button>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full py-40 flex flex-col items-center gap-4 text-slate-600">
                      <Search size={64} className="opacity-10" />
                      <p className="font-bold uppercase tracking-widest text-sm">No players found in this sector</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
