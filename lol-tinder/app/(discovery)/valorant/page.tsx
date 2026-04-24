"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion"
import { Sword, Zap, User, Filter, Activity, Search, Trophy, Loader2, MicOff } from "lucide-react"
import { createClient } from "@/src/utils/supabase/client";
import Link from "next/link";

const POPULAR_LANGUAGES = [
  "Ukrainian", "English", "Polish", "German", "French", 
  "Spanish", "Italian", "Romanian", "Dutch", "Hungarian", "Czech"
];

const supabase = createClient();

export default function ValorantDiscovery() {
  const [user, setUser] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // Фільтри
  const [filterRegion, setFilterRegion] = useState<string>("EUW");
  const [filterRole, setFilterRole] = useState<string>("ALL");
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
        .eq('val_region', filterRegion)
        .ilike('enabled_games', '%VALORANT%');

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

      if (filterRole !== "ALL") {
        query = query.eq('val_main_role', filterRole);
      }

      if (filterRank !== "ALL") {
        query = query.ilike('val_rank', `%${filterRank}%`);
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
      if (!error && data) setPlayers(data);
      setIsFetching(false);
    };

    fetchPlayers();
  }, [user, isLoading, filterRegion, filterRole, filterRank, filterLangs, onlyOnline]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-red-500" size={48} />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <aside className="w-full lg:w-80 space-y-6">
        <div className="modern-panel p-6">
          <div className="flex items-center gap-3 mb-8 border-b border-zinc-800 pb-4">
            <Filter size={18} className="text-red-400" />
            <h3 className="font-bold uppercase tracking-[0.2em] text-[10px] text-zinc-500">Valorant Filters</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Region</label>
              <select 
                value={filterRegion} 
                onChange={(e) => setFilterRegion(e.target.value)}
                className="w-full bg-zinc-950/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-red-500/50 transition-all cursor-pointer appearance-none"
              >
                <option value="EUW">Europe</option>
                <option value="NA">North America</option>
                <option value="KR">Korea</option>
                <option value="LATAM">LATAM</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Agent Role</label>
              <select 
                value={filterRole} 
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full bg-zinc-950/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-red-500/50 transition-all cursor-pointer appearance-none"
              >
                <option value="ALL">All Roles</option>
                <option value="DUELIST">DUELIST</option>
                <option value="INITIATOR">INITIATOR</option>
                <option value="CONTROLLER">CONTROLLER</option>
                <option value="SENTINEL">SENTINEL</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Rank</label>
              <select 
                value={filterRank} 
                onChange={(e) => setFilterRank(e.target.value)}
                className="w-full bg-zinc-950/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-red-500/50 transition-all cursor-pointer appearance-none"
              >
                <option value="ALL">All Ranks</option>
                <option value="IRON">Iron</option>
                <option value="BRONZE">Bronze</option>
                <option value="SILVER">Silver</option>
                <option value="GOLD">Gold</option>
                <option value="PLATINUM">Platinum</option>
                <option value="DIAMOND">Diamond</option>
                <option value="ASCENDANT">Ascendant</option>
                <option value="IMMORTAL">Immortal</option>
                <option value="RADIANT">Radiant</option>
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
                        ? 'bg-red-500/20 border-red-500 text-red-300'
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
              className={`flex items-center justify-between w-full p-4 rounded-xl border transition-all ${onlyOnline ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-zinc-800 bg-zinc-900/50 text-zinc-500'}`}
            >
              <span className="text-xs font-bold uppercase">Live Online</span>
              <Activity size={16} />
            </button>
          </div>
        </div>
      </aside>
      
      <div className="flex-1">
        {isFetching ? (
          <div className="w-full h-96 flex items-center justify-center">
            <Loader2 className="animate-spin text-red-500/50" size={32} />
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
                    className="modern-panel p-6 group flex flex-col h-full border-red-500/5 hover:border-red-500/20"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex gap-4">
                        <div className="relative group/avatar">
                          <div className="w-14 h-14 rounded-xl bg-zinc-800 p-[1px] group-hover/avatar:bg-red-500/50 transition-colors">
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
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors">
                            {player.val_game_name || player.game_name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Trophy size={12} className="text-red-400" />
                            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-tighter">
                              {player.val_rank || 'Unranked'}
                            </span>
                            {player.language && (
                              <>
                                <span className="text-zinc-800">•</span>
                                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-tighter">{player.language.split(',')[0]}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="bg-red-500/10 px-2 py-1 rounded text-[10px] font-bold text-red-400 border border-red-500/20">
                        {player.val_main_role || 'AGENT'}
                      </div>
                    </div>

                    <div className="flex-1 bg-black/20 rounded-lg p-4 mb-6 border border-white/[0.02]">
                      <p className="text-sm text-zinc-400 italic leading-relaxed line-clamp-3">
                        "{player.val_bio || player.bio || "No tactical briefing provided."}"
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/profile/${player.id}?game=VALORANT`} className="flex-1">
                        <button className="btn-modern w-full text-[10px] py-3 bg-red-600/10 border-red-600/20 hover:bg-red-600/20 text-red-400">
                          View Agent
                        </button>
                      </Link>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-40 flex flex-col items-center gap-4 text-slate-600">
                  <Search size={64} className="opacity-10" />
                  <p className="font-bold uppercase tracking-widest text-sm">No agents found in this sector</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}