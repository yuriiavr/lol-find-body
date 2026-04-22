'use client'

import React, { useState, useEffect } from "react";
import { createClient } from "@/src/utils/supabase/client";
import { Loader2, Users, Check, X, Trophy, Sword, MessageCircle } from "lucide-react";
import Link from "next/link";
import { getMatches, updateMatchStatus } from "./actions";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/src/components/ToastProvider";

export default function MatchesPage() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [matches, setMatches] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'TEAM' | 'PENDING'>('TEAM');
    const { showToast } = useToast();
    const supabase = createClient();

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) {
                await fetchMatches();
            }
            setLoading(false);
        };
        init();
    }, []);

    const fetchMatches = async () => {
        const { data, error } = await getMatches();
        if (!error && data) {
            setMatches(data);
        }
    };

    const handleStatusUpdate = async (matchId: string, status: 'ACCEPTED' | 'DECLINED') => {
        const result = await updateMatchStatus(matchId, status);
        if (result.success) {
            await fetchMatches();
            showToast(status === 'ACCEPTED' ? 'Match accepted!' : 'Request declined', 'success');
        } else {
            showToast(result.error || 'Failed to update status', 'error');
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
            <Loader2 className="animate-spin text-orange-500" size={48} />
        </div>
    );

    const teamMatches = matches.filter(m => m.status === 'ACCEPTED');
    const pendingMatches = matches.filter(m => m.status === 'PENDING' && m.isIncoming);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-slate-50 flex flex-col">
            <nav className="w-full border-b border-white/5 bg-[#121212]/80 backdrop-blur-lg sticky top-0 z-50 px-6">
                <div className="max-w-[1600px] mx-auto h-20 flex justify-between items-center">
                    <Link href="/">
                        <h1 className="text-2xl font-black bg-gradient-to-r from-orange-500 to-zinc-800 bg-clip-text text-transparent tracking-tighter italic hover:opacity-80 transition-opacity cursor-pointer">LoLMatch</h1>
                    </Link>
                    <div className="flex gap-6 text-xs font-bold uppercase tracking-widest text-slate-400">
                        <Link href="/league" className="hover:text-white transition-colors">Discovery</Link>
                        <Link href="/matches" className="text-white border-b-2 border-orange-500 pb-1">Matches</Link>
                    </div>
                    {user && (
                         <Link href="/profile" className="flex items-center gap-3 p-1.5 pr-5 bg-zinc-900 rounded-full border border-white/5 transition-all hover:bg-zinc-800">
                            <img src={user.user_metadata.avatar_url} className="w-8 h-8 rounded-full border border-orange-500/30" alt="avatar" />
                            <span className="text-sm font-bold">{user.user_metadata.full_name}</span>
                        </Link>
                    )}
                </div>
            </nav>

            <main className="flex-1 w-full max-w-[1600px] mx-auto p-6 md:p-10">
                <div className="mb-12">
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-8 bg-gradient-to-r from-orange-500 to-zinc-700 bg-clip-text text-transparent">Match Center</h2>
                    
                    <div className="flex gap-8 border-b border-white/5">
                        <button 
                            onClick={() => setActiveTab('TEAM')}
                            className={`pb-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'TEAM' ? 'text-orange-400 border-b-2 border-orange-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Confirmed Team ({teamMatches.length})
                        </button>
                        <button 
                            onClick={() => setActiveTab('PENDING')}
                            className={`pb-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'PENDING' ? 'text-orange-400 border-b-2 border-orange-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Incoming Requests ({pendingMatches.length})
                        </button>
                    </div>
                </div>

                <div className="main-grid">
                    <AnimatePresence mode="popLayout">
                        {(activeTab === 'TEAM' ? teamMatches : pendingMatches).map((m) => (
                            <motion.div
                                key={m.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="modern-panel p-6 group"
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-zinc-800 p-[1px] overflow-hidden">
                                             <img src={m.profile.avatar_url} className="w-full h-full object-cover rounded-[15px]" alt="" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors">{m.profile.game_name}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Trophy size={12} className="text-orange-400" />
                                                <span className="text-[10px] font-black uppercase text-zinc-500">{m.profile.solo_rank || 'Unranked'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-blue-500/10 px-2 py-1 rounded text-[10px] font-bold text-blue-400 border border-blue-500/20 uppercase">
                                        {m.profile.main_role}
                                    </div>
                                </div>

                                {activeTab === 'TEAM' ? (
                                    <div className="flex gap-2">
                                        <Link href={`/profile/${m.profile.id}`} className="flex-1">
                                            <button className="btn-modern w-full py-3 text-[10px]">View Profile</button>
                                        </Link>
                                        <button className="px-4 bg-zinc-800 rounded-xl border border-white/5 hover:bg-zinc-700 transition-colors">
                                            <MessageCircle size={18} className="text-orange-400" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2 pt-4 border-t border-white/5">
                                        <button 
                                            onClick={() => handleStatusUpdate(m.id, 'ACCEPTED')}
                                            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 py-3 rounded-xl text-[10px] font-black uppercase transition-all"
                                        >
                                            <Check size={16} /> Accept
                                        </button>
                                        <button 
                                            onClick={() => handleStatusUpdate(m.id, 'DECLINED')}
                                            className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-3 rounded-xl text-[10px] font-black uppercase transition-all"
                                        >
                                            <X size={16} /> Decline
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}