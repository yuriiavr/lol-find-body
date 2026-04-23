"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion"
import { User, Filter, Activity, Search, Trophy, Loader2, MicOff, Gamepad } from "lucide-react"
import { createClient } from "@/src/utils/supabase/client";
import Link from "next/link";

const POPULAR_LANGUAGES = [
  "Ukrainian", "English", "Polish", "German", "French", 
  "Spanish", "Italian", "Romanian", "Dutch", "Hungarian", "Czech"
];

const supabase = createClient();

export default function TFTDiscoveryPage() {
  const [user, setUser] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [filterRegion, setFilterRegion] = useState<string>("EUW");
  const [filterRank, setFilterRank] = useState<string>("ALL");
  const [filterLangs, setFilterLangs] = useState<string[]>([]);
  const [onlyOnline, setOnlyOnline] = useState<boolean>(false);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setIsLoading(false);
    };
    getUser();
  }, []);

  useEffect(() => {
    const fetchPlayers = async () => {
      if (isLoading) return;
      setIsFetching(true);
      
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('is_paused', false)
        .eq('region', filterRegion)
        .ilike('enabled_games', '%TFT%');

      if (user) {
        const { data: existingMatches } = await supabase
          .from('matches')
          .select('user_id, target_id')
          .or(`user_id.eq.${user.id},target_id.eq.${user.id}`);

        const excludedIds = [user.id];
        if (existingMatches) {
          existingMatches.forEach(m => {
            excludedIds.push(m.user_id === user.id ? m.target_id : m.user_id);
          });
        }
        query = query.not('id', 'in', `(${excludedIds.join(',')})`);
      }

      if (filterRank !== "ALL") {
        query = query.ilike('tft_rank', `%${filterRank}%`);
      }

      if (filterLangs.length > 0) {
        const orConditions = filterLangs.map(lang => `language.ilike.%${lang}%`).join(',');
        query = query.or(orConditions);
      }

      if (onlyOnline) {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        query = query.gt('last_seen', tenMinutesAgo);
      }

      const { data, error } = await query.limit(20);
      if (!error && data) {
        setPlayers(data);
      }
      setIsFetching(false);
    };

    fetchPlayers();
  }, [user, isLoading, filterRegion, filterRank, filterLangs, onlyOnline]);

  if (isLoading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
      <Loader2 className="animate-spin text-blue-500" size={48} />
    </div>
  );

  return ( // The main div and main tag are now provided by the (discovery) layout
    <div className="flex flex-col lg:flex-row gap-8">
      <aside className="w-full lg:w-80 space-y-6">
            <div className="modern-panel p-6 border-blue-500/20">
              <div className="flex items-center gap-3 mb-8 border-b border-zinc-800 pb-4">
                <Gamepad size={18} className="text-blue-400" />
                <h3 className="font-bold uppercase tracking-[0.2em] text-[10px] text-zinc-500">TFT Strategists</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Region</label>
                  <select 
                    value={filterRegion} 
                    onChange={(e) => setFilterRegion(e.target.value)}
                    className="w-full bg-zinc-950/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-500/50"
                  >
                    <option value="EUW">Europe West</option>
                    <option value="EUNE">Europe Nordic & East</option>
                    <option value="NA">North America</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Rank</label>
                  <select 
                    value={filterRank} 
                    onChange={(e) => setFilterRank(e.target.value)}
                    className="w-full bg-zinc-950/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-500/50"
                  >
                    <option value="ALL">All Ranks</option>
                    <option value="DIAMOND">Diamond</option>
                    <option value="MASTER">Master+</option>
                    <option value="PLATINUM">Platinum</option>
                    <option value="GOLD">Gold</option>
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
                          filterLangs.includes(lang) ? 'bg-blue-500/20 border-blue-500 text-blue-300' : 'bg-slate-900 border-white/5 text-slate-600'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => setOnlyOnline(!onlyOnline)}
                  className={`flex items-center justify-between w-full p-4 rounded-xl border transition-all ${onlyOnline ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-zinc-800 bg-zinc-900/50 text-zinc-500'}`}
                >
                  <span className="text-xs font-bold uppercase">Online Now</span>
                  <Activity size={16} />
                </button>
              </div>
            </div>
          </aside>

      <div className="flex-1">
            {isFetching ? (
              <div className="w-full h-96 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-500/50" size={32} />
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
                        className="modern-panel p-6 group flex flex-col h-full border-blue-500/10"
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex gap-4">
                            <div className="relative">
                              <div className="w-14 h-14 rounded-xl bg-zinc-800 p-[1px] group-hover:bg-blue-500/50 transition-colors">
                                <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center overflow-hidden">
                                  {player.avatar_url ? (
                                    <img src={player.avatar_url} className="w-full h-full object-cover" alt="" />
                                  ) : (
                                    <User size={28} className="text-slate-700" />
                                  )}
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{player.game_name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Trophy size={12} className="text-blue-400" />
                                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-tighter">
                                  {player.tft_rank || 'UNRANKED'}
                                </span>
                                <span className="text-zinc-800">•</span>
                                <span className="text-[10px] font-bold text-blue-400/60 uppercase">TFT</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 bg-black/20 rounded-lg p-4 mb-6 border border-white/[0.02]">
                          <p className="text-sm text-zinc-400 italic leading-relaxed">
                            "{player.bio || "Жодної інформації не додано."}"
                          </p>
                        </div>

                        <Link href={`/profile/${player.id}?game=TFT`} className="w-full">
                          <button className="btn-modern w-full text-xs py-3 border-blue-500/20 hover:bg-blue-500/10">
                            View Tactician
                          </button>
                        </Link>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full py-40 flex flex-col items-center gap-4 text-slate-600">
                      <Search size={64} className="opacity-10" />
                      <p className="font-bold uppercase tracking-widest text-sm">No tacticians found</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            )}
      </div>
    </div>
  );
}