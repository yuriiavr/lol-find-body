'use client'

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/src/utils/supabase/client";
import { Loader2, Users, Check, X, Trophy, Sword, MessageCircle, MessageSquare } from "lucide-react";
import Link from "next/link";
import { getMatches, updateMatchStatus } from "./actions";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/src/components/ToastProvider";
import { ViewProfileButton } from "@/src/components/ui/ProfileButton";

// Виносимо клієнт за межі компонента для стабільності
const supabase = createClient();

export default function MatchesPage() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [matches, setMatches] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'TEAM' | 'PENDING'>('TEAM');
    const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
    const { showToast } = useToast();

    const fetchMatches = useCallback(async (userId?: string) => {
        const { data, error } = await getMatches();
        if (!error && data) {
            setMatches(data);
            
            const currentUserId = userId || user?.id;
            if (currentUserId) {
                const matchIds = data.filter((m: any) => m.status === 'ACCEPTED').map((m: any) => m.id);
                if (matchIds.length > 0) {
                    const { data: unreadData } = await supabase
                        .from('messages')
                        .select('match_id')
                        .in('match_id', matchIds)
                        .eq('is_read', false)
                        .neq('sender_id', currentUserId);
                    
                    const counts: Record<string, number> = {};
                    unreadData?.forEach((msg: any) => {
                        counts[msg.match_id] = (counts[msg.match_id] || 0) + 1;
                    });
                    setUnreadMap(counts);
                }
            }
        }
    }, [user?.id]);

    useEffect(() => {
        // Створюємо канал синхронно з унікальною назвою
        const channel = supabase.channel(`matches-page-${Math.random()}`);

        const init = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            setUser(authUser);
            if (authUser) {
                await fetchMatches(authUser.id);

                channel
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
                        fetchMatches();
                    })
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
                        fetchMatches(); // Це оновить "останнє повідомлення" автоматично
                    })
                    .subscribe();
            }
            setLoading(false);
        };
        init();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchMatches]);

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
                                            {unreadMap[m.id] > 0 && (
                                                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-zinc-900 z-10 shadow-lg">
                                                    {unreadMap[m.id] > 9 ? '9+' : unreadMap[m.id]}
                                                </div>
                                            )}
                                            {m.profile.last_seen && new Date(m.profile.last_seen).getTime() > Date.now() - 10 * 60 * 1000 && (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-zinc-900 rounded-full shadow-lg shadow-emerald-500/50" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-lg font-bold text-white group-hover:text-[rgb(var(--accent-color))] transition-colors truncate">
                                              {m.profile.display_name || m.profile.game_name} 
                                              {!m.profile.display_name && (
                                                <span className="text-zinc-600 text-sm font-medium ml-1">
                                                  #{m.profile.tag_line}
                                                </span>
                                              )}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">{m.profile.region}</span>
                                                {m.profile.language && (
                                                    <>
                                                        <span className="text-zinc-800">•</span>
                                                        <span className="text-[10px] font-bold text-zinc-500 truncate">{m.profile.language.split(',')[0]}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-6 h-12">
                                    <p className="text-[11px] text-zinc-500 italic line-clamp-2 leading-relaxed">
                                        {m.profile.bio || "No biography added."}
                                    </p>
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
                                    <div className="space-y-4">
                                        <ViewProfileButton profileId={m.profile.id} className="w-full" />
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