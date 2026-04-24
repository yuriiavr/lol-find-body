'use client'

import React, { useState, useEffect } from "react";
import { createClient } from "@/src/utils/supabase/client";
import { Loader2, Users, Check, X, Trophy, Sword, MessageCircle, MessageSquare } from "lucide-react";
import Link from "next/link";
import { getMatches, updateMatchStatus } from "./actions";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/src/components/ToastProvider";
import { ViewProfileButton } from "@/src/components/ui/ProfileButton";

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

    const openGlobalChat = (m: any) => {
      window.dispatchEvent(new CustomEvent('open-global-chat', { detail: m }));
    };

    if (loading) return (
        <div className="min-h-screen bg-[rgb(var(--bg-primary))] flex items-center justify-center">
            <Loader2 className="animate-spin text-[rgb(var(--accent-color))]" size={48} />
        </div>
    );

    const teamMatches = matches.filter(m => m.status === 'ACCEPTED');
    const pendingMatches = matches.filter(m => m.status === 'PENDING' && m.isIncoming);

    return (
        <div className="min-h-screen bg-[rgb(var(--bg-primary))] text-slate-50 flex flex-col">

            <main className="flex-1 w-full max-w-[1600px] mx-auto p-6 md:p-10">
                <div className="mb-12">
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-8 bg-gradient-to-r from-[rgb(var(--accent-color))] to-zinc-700 bg-clip-text text-transparent">Match Center</h2>
                    
                    <div className="flex gap-8 border-b border-white/5">
                        <button 
                            onClick={() => setActiveTab('TEAM')}
                            className={`pb-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'TEAM' ? 'text-[rgb(var(--accent-color))] border-b-2 border-[rgb(var(--accent-color))]' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Confirmed Team ({teamMatches.length})
                        </button>
                        <button 
                            onClick={() => setActiveTab('PENDING')}
                            className={`pb-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'PENDING' ? 'text-[rgb(var(--accent-color))] border-b-2 border-[rgb(var(--accent-color))]' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Incoming Requests ({pendingMatches.length})
                        </button>
                    </div>
                </div>

                <div className="w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                                {/* Card Content (same as before) */}
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex gap-4">
                                        <div className="relative">
                                            <div className="w-16 h-16 rounded-2xl bg-zinc-800 p-[1px] overflow-hidden">
                                                 <img src={m.profile.avatar_url} className="w-full h-full object-cover rounded-[15px]" alt="" />
                                            </div>
                                            {m.profile.last_seen && new Date(m.profile.last_seen).getTime() > Date.now() - 10 * 60 * 1000 && (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-zinc-900 rounded-full shadow-lg shadow-emerald-500/50" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-white group-hover:text-[rgb(var(--accent-color))] transition-colors">
                                              {m.profile.game_name}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Trophy size={12} className="text-[rgb(var(--accent-color))]" />
                                                <span className="text-[10px] font-black uppercase text-zinc-500">{m.profile.solo_rank || 'Unranked'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 items-end">
                                      <div className="bg-[rgb(var(--accent-color)/0.1)] px-2 py-1 rounded text-[10px] font-bold text-[rgb(var(--accent-color))] border border-[rgb(var(--accent-color)/0.2)] uppercase">
                                        {m.profile.main_role}
                                      </div>
                                    </div>
                                </div>

                                {activeTab === 'TEAM' ? (
                                    <div className="flex gap-2">
                                        <ViewProfileButton profileId={m.profile.id} className="flex-1" />
                                        <button
                                          onClick={() => openGlobalChat(m)}
                                          className="px-4 bg-[rgb(var(--accent-color)/0.1)] rounded-xl border border-[rgb(var(--accent-color)/0.2)] hover:bg-[rgb(var(--accent-color)/0.2)] transition-colors"
                                        >
                                            <MessageCircle size={18} className="text-[rgb(var(--accent-color))]" />
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
            </div>
            </main>
        </div>
    );
}