"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, Shield, Sword, Zap, User, LogIn, Filter, Activity } from "lucide-react";
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
    await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const activePlayer = players[currentIndex];

  const handleSwipe = (direction: "left" | "right") => {
    setLastDirection(direction);
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setLastDirection(null);
    }, 200);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <Zap className="animate-pulse text-blue-500" size={48} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white overflow-hidden p-4">
      {/* Header */}
      <header className="fixed top-0 w-full p-6 flex justify-between items-center max-w-md">
        <h1 className="text-2xl font-black italic tracking-tighter text-blue-500">LoLMatch.UA</h1>
        <div className="bg-slate-800 p-2 rounded-full">
          {user ? (
            <Link href="/profile">
              <img src={user.user_metadata.avatar_url} className="w-6 h-6 rounded-full hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer" alt="avatar" />
            </Link>
          ) : (
            <User size={20} onClick={handleLogin} className="cursor-pointer" />
          )}
        </div>
      </header>

      {!user ? (
        <main className="flex flex-col items-center gap-6 text-center">
          <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center shadow-xl shadow-blue-500/20">
            <Zap size={48} fill="white" />
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight">Знайди свою команду в LoL</h2>
          <p className="text-slate-400 max-w-[280px]">Авторизуйся через Discord, щоб почати пошук гравців з України.</p>
          <button 
            onClick={handleLogin}
            className="flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-4 px-8 rounded-2xl transition-all scale-105 active:scale-95"
          >
            <LogIn size={20} />
            Увійти через Discord
          </button>
        </main>
      ) : (
        <>
          {/* Filter Bar */}
          <div className="w-full max-w-md mb-4 flex flex-col gap-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-all"
            >
              <Filter size={16} /> {showFilters ? "Приховати фільтри" : "Показати фільтри"}
            </button>
            
            {showFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-wrap gap-4"
              >
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-blue-500 uppercase">Роль</label>
                  <select 
                    value={filterRole} 
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="bg-slate-800 border-none rounded-lg text-sm p-2 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">Всі ролі</option>
                    <option value="TOP">TOP</option>
                    <option value="JUNGLE">JUNGLE</option>
                    <option value="MID">MID</option>
                    <option value="ADC">ADC</option>
                    <option value="SUPPORT">SUPPORT</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-blue-500 uppercase">Ранг (Solo)</label>
                  <select 
                    value={filterRank} 
                    onChange={(e) => setFilterRank(e.target.value)}
                    className="bg-slate-800 border-none rounded-lg text-sm p-2 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">Всі ранги</option>
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

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-blue-500 uppercase">Статус</label>
                  <button 
                    onClick={() => setOnlyOnline(!onlyOnline)}
                    className={`flex items-center gap-2 text-sm p-2 rounded-lg transition-all ${onlyOnline ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                  >
                    <Activity size={14} /> Тільки онлайн
                  </button>
                </div>
              </motion.div>
            )}
          </div>

      <main className="relative w-full max-w-sm aspect-[3/4] mt-10">
        <AnimatePresence>
          {activePlayer ? (
            <motion.div
              key={activePlayer.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ 
                x: lastDirection === "right" ? 500 : lastDirection === "left" ? -500 : 0,
                opacity: 0,
                rotate: lastDirection === "right" ? 25 : -25
              }}
              className="absolute inset-0 bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Card Image/Header */}
              <div className="h-2/3 bg-gradient-to-b from-blue-600/20 to-slate-900 flex items-center justify-center relative">
                <div className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/50">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-400">Solo: {activePlayer.solo_rank}</span>
                    <span className="text-[10px] text-slate-400">Flex: {activePlayer.flex_rank}</span>
                  </div>
                </div>
                {new Date(activePlayer.last_seen).getTime() > Date.now() - 10 * 60 * 1000 && (
                  <div className="absolute top-4 left-4 flex items-center gap-1 bg-emerald-500/20 px-2 py-1 rounded-full border border-emerald-500/50">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-500 uppercase">Online</span>
                  </div>
                )}
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full bg-slate-800 border-4 border-blue-500 flex items-center justify-center mb-4">
                    <Zap size={60} className="text-blue-400" />
                  </div>
                  <h2 className="text-3xl font-bold">{activePlayer.game_name}</h2>
                  <p className="text-blue-400 font-medium flex items-center gap-2">
                    {activePlayer.main_role}
                  </p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col">
                <p className="text-slate-300 text-sm italic mb-4">"{activePlayer.bio}"</p>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <h2 className="text-2xl font-bold mb-2">Гравці закінчилися!</h2>
              <p className="text-slate-400">Спробуйте змінити фільтри або повернутися пізніше.</p>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Controls */}
      <div className="flex gap-6 mt-8">
        <button onClick={() => handleSwipe("left")} className="p-5 bg-slate-800 rounded-full text-red-500 hover:bg-slate-700 transition shadow-lg border border-red-500/20">
          <X size={32} />
        </button>
        <button onClick={() => handleSwipe("right")} className="p-5 bg-slate-800 rounded-full text-emerald-500 hover:bg-slate-700 transition shadow-lg border border-emerald-500/20">
          <Heart size={32} />
        </button>
      </div>
        </>
      )}
    </div>
  );
}
