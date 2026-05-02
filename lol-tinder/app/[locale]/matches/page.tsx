'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/src/utils/supabase/client";
import { Loader2, Check, X, MessageCircle, Users, Bell } from "lucide-react";
import { getMatches, updateMatchStatus } from "./actions";
import { getGameName, getTagLine, type GameKey } from "@/src/lib/profile";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/src/components/ToastProvider";
import { ViewProfileButton } from "@/src/components/ui/ProfileButton";
import { useTranslations } from "next-intl";

const supabase = createClient();

// ─── Tab switcher з гумковою анімацією ──────────────────────────────────────
//
// Трюк: керуємо left і right краями окремо.
// При переході вправо → right одразу стрибає до нової кнопки (розтягується),
// потім через 120ms left підтягується. При переході вліво — навпаки.
//
function TabSwitcher({
    activeTab, onSwitch, teamCount, pendingCount, t,
}: {
    activeTab: 'TEAM' | 'PENDING';
    onSwitch: (tab: 'TEAM' | 'PENDING') => void;
    teamCount: number;
    pendingCount: number;
    t: (key: string, opts?: any) => string;
}) {
    const tabs = [
        { id: 'TEAM'    as const, label: t('tabs.confirmed', { count: teamCount }),    alert: false,            count: teamCount    },
        { id: 'PENDING' as const, label: t('tabs.incoming',  { count: pendingCount }), alert: pendingCount > 0, count: pendingCount },
    ];

    const containerRef = useRef<HTMLDivElement>(null);
    const btnRefs      = useRef<Record<string, HTMLButtonElement | null>>({});
    const prevTabRef   = useRef<'TEAM' | 'PENDING'>(activeTab);
    const [bar, setBar] = useState({ left: 0, right: 0 });
    const [isStretching, setIsStretching] = useState(false);

    const getEdges = (id: string) => {
        const btn = btnRefs.current[id];
        const con = containerRef.current;
        if (!btn || !con) return null;
        const b = btn.getBoundingClientRect();
        const c = con.getBoundingClientRect();
        return { left: b.left - c.left, right: c.right - b.right };
    };

    // Ініціалізація
    useEffect(() => {
        const r = getEdges(activeTab);
        if (r) setBar(r);
    }, []);

    useEffect(() => {
        const prev = prevTabRef.current;
        if (prev === activeTab) return;

        const rPrev = getEdges(prev);
        const rNext = getEdges(activeTab);
        if (!rPrev || !rNext) return;

        const tabIds = tabs.map(t => t.id);
        const goingRight = tabIds.indexOf(activeTab) > tabIds.indexOf(prev);

        // Фаза 1: розтягнутись — один край стрибає до нової кнопки
        setIsStretching(true);
        if (goingRight) {
            setBar({ left: rPrev.left, right: rNext.right });
        } else {
            setBar({ left: rNext.left, right: rPrev.right });
        }

        // Фаза 2: скоротитись — другий край підтягується
        const id = setTimeout(() => {
            const r = getEdges(activeTab);
            if (r) setBar(r);
            setIsStretching(false);
        }, 130);

        prevTabRef.current = activeTab;
        return () => clearTimeout(id);
    }, [activeTab]);

    const spring = { type: 'spring' as const, stiffness: 460, damping: 36 };

    return (
        <div ref={containerRef} className="relative flex items-center">
            <motion.span
                className="absolute bottom-0 h-[2px] rounded-full pointer-events-none"
                style={{ background: 'rgb(var(--accent-color))' }}
                animate={{ left: bar.left, right: bar.right }}
                transition={spring}
            />

            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        ref={el => { btnRefs.current[tab.id] = el; }}
                        onClick={() => { if (tab.id !== activeTab) onSwitch(tab.id); }}
                        className="relative flex items-center gap-2 px-5 py-3 text-[11px] font-bold uppercase tracking-[1.4px] transition-colors duration-200 select-none"
                        style={{ color: isActive ? 'rgb(var(--accent-color))' : 'rgb(90,90,105)' }}
                    >
                        {tab.label}

                        {tab.alert && (
                            <span
                                className="flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[9px] font-black px-1"
                                style={{ background: 'rgb(var(--accent-color))', color: '#000' }}
                            >
                                {tab.count > 9 ? '9+' : tab.count}
                            </span>
                        )}

                        {tab.alert && !isActive && (
                            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'rgb(var(--accent-color))' }} />
                                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'rgb(var(--accent-color))' }} />
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

// ─── Match card ──────────────────────────────────────────────────────────────
//
// Концепція: фото на весь блок як фон з темним overlay.
// Весь контент поверх фото — статуси зверху, ім'я + ігри + кнопки знизу.
//
function MatchCard({
    m, activeTab, unread, onAccept, onDecline, onChat, t,
}: {
    m: any;
    activeTab: 'TEAM' | 'PENDING';
    unread: number;
    onAccept: () => void;
    onDecline: () => void;
    onChat: () => void;
    t: (key: string) => string;
}) {
    const enabledGame = (m.profile.enabled_games?.[0] ?? 'lol').toLowerCase() as GameKey;
    const name        = m.profile.display_name || getGameName(m.profile, enabledGame);
    const tag         = !m.profile.display_name ? getTagLine(m.profile, enabledGame) : null;
    const games: string[] = typeof m.profile.enabled_games === 'string'
        ? m.profile.enabled_games.split(',').filter(Boolean)
        : Array.isArray(m.profile.enabled_games)
        ? m.profile.enabled_games
        : [];
    const isOnline = m.profile.last_seen &&
        new Date(m.profile.last_seen).getTime() > Date.now() - 10 * 60 * 1000;

    return (
        <div
            className="group relative overflow-hidden rounded-2xl"
            style={{ aspectRatio: '3 / 4', boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}
        >
            {/* Фото */}
            <img
                src={m.profile.avatar_url}
                alt={name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            />

            {/* Overlay */}
            <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0.1) 100%)' }}
            />

            {/* ── Верхній рядок: онлайн + badge ── */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 pt-3">
                {isOnline ? (
                    <span
                        className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[8px] font-bold uppercase tracking-wider"
                        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', color: '#34d399' }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        online
                    </span>
                ) : <span />}

                {unread > 0 ? (
                    <span
                        className="min-w-[20px] h-5 rounded-full flex items-center justify-center text-[9px] font-black px-1.5"
                        style={{ background: 'rgb(var(--accent-color))', color: '#000' }}
                    >
                        {unread > 9 ? '9+' : unread}
                    </span>
                ) : activeTab === 'PENDING' ? (
                    <span
                        className="px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-wider"
                        style={{ background: 'rgba(var(--accent-color), 0.9)', backdropFilter: 'blur(6px)', color: '#000' }}
                    >
                        new
                    </span>
                ) : null}
            </div>

            {/* ── Нижній блок ── */}
            <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 flex flex-col gap-2">
                <div>
                    <p className="text-[15px] font-black text-white leading-tight truncate drop-shadow-md">
                        {name}
                        {tag && <span className="text-white/30 text-[11px] font-normal ml-1">#{tag}</span>}
                    </p>

                    {games.length > 0 && (
                        <div className="flex flex-wrap gap-1 py-1.5 mt-1.5">
                            {games.slice(0, 3).map((g: string) => (
                                <span
                                    key={g}
                                    className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider"
                                    style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        backdropFilter: 'blur(4px)',
                                        color: 'rgba(255,255,255,0.7)',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                    }}
                                >
                                    {g}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Кнопки */}
                {activeTab === 'TEAM' ? (
                    <div className="flex gap-2 items-center">
                        <ViewProfileButton
                            profileId={m.profile.id}
                            className="flex-[2] !text-[10px] !rounded-xl"
                        >
                            {t('buttons.viewProfile')}
                        </ViewProfileButton>
                        {/* Чат — вужчий, тільки іконка */}
                        <button
                            onClick={onChat}
                            className="flex-1 flex items-center justify-center rounded-xl py-3 transition-all duration-200"
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                backdropFilter: 'blur(8px)',
                                color: '#fff',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                        >
                            <MessageCircle size={20} strokeWidth={1.5} />
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <ViewProfileButton
                            profileId={m.profile.id}
                            className="flex-[2] !text-[10px] !rounded-xl"
                        >
                            {t('buttons.viewProfile')}
                        </ViewProfileButton>
                        <button
                            onClick={onAccept}
                            className="flex-1 flex items-center justify-center rounded-xl py-2 transition-all duration-200"
                            style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.35)', backdropFilter: 'blur(8px)', color: '#34d399' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.38)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.2)')}
                        >
                            <Check size={13} strokeWidth={2.5} />
                        </button>
                        <button
                            onClick={onDecline}
                            className="flex-1 flex items-center justify-center rounded-xl py-2 transition-all duration-200"
                            style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.35)', backdropFilter: 'blur(8px)', color: '#f87171' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.38)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.2)')}
                        >
                            <X size={13} strokeWidth={2.5} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function MatchesPage() {
    const t = useTranslations('MatchesPage');
    const [loading, setLoading]     = useState(true);
    const [user, setUser]           = useState<any>(null);
    const [matches, setMatches]     = useState<any[]>([]);
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
                        .from('messages').select('match_id')
                        .in('match_id', matchIds).eq('is_read', false).neq('sender_id', currentUserId);
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
        const channel = supabase.channel(`matches-page-${Math.random()}`);
        const init = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            setUser(authUser);
            if (authUser) {
                await fetchMatches(authUser.id);
                channel
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => fetchMatches())
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => fetchMatches())
                    .subscribe();
            }
            setLoading(false);
        };
        init();
        return () => { supabase.removeChannel(channel); };
    }, [fetchMatches]);

    const handleStatusUpdate = useCallback(async (matchId: string, status: 'ACCEPTED' | 'DECLINED') => {
        const result = await updateMatchStatus(matchId, status);
        if (result.success) {
            await fetchMatches();
            showToast(status === 'ACCEPTED' ? t('toasts.accepted') : t('toasts.declined'), 'success');
        } else {
            showToast(result.error || t('toasts.error'), 'error');
        }
    }, [fetchMatches, showToast, t]);

    const openGlobalChat = useCallback((m: any) => {
        window.dispatchEvent(new CustomEvent('open-global-chat', { detail: m }));
    }, []);

    const teamMatches    = useMemo(() => matches.filter(m => m.status === 'ACCEPTED'), [matches]);
    const pendingMatches = useMemo(() => matches.filter(m => m.status === 'PENDING' && m.isIncoming), [matches]);
    const activeList     = activeTab === 'TEAM' ? teamMatches : pendingMatches;

    if (loading) return (
        <div className="min-h-screen bg-[rgb(var(--bg-primary))] flex items-center justify-center">
            <Loader2 className="animate-spin text-[rgb(var(--accent-color))]" size={32} />
        </div>
    );

    return (
        <div className="min-h-screen bg-[rgb(var(--bg-primary))] text-slate-50">
            <main className="w-full max-w-[1600px] mx-auto px-6 py-10 md:px-10">

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                    <h1
                        className="text-4xl font-black tracking-tighter bg-clip-text text-transparent"
                        style={{ backgroundColor: 'rgb(var(--accent-color))' }}
                    >
                        {t('title')}
                    </h1>

                    <TabSwitcher
                        activeTab={activeTab}
                        onSwitch={setActiveTab}
                        teamCount={teamMatches.length}
                        pendingCount={pendingMatches.length}
                        t={t}
                    />
                </div>

                {activeList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-3">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center opacity-20"
                            style={{ background: 'rgb(var(--bg-secondary))' }}
                        >
                            {activeTab === 'TEAM' ? <Users size={20} strokeWidth={1.5} /> : <Bell size={20} strokeWidth={1.5} />}
                        </div>
                        <span className="text-[11px] uppercase tracking-[2px] font-semibold text-zinc-700">
                            {activeTab === 'TEAM' ? t('empty.team') : t('empty.pending')}
                        </span>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        <AnimatePresence mode="popLayout">
                            {activeList.map((m) => (
                                <motion.div
                                    key={m.id}
                                    layout
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.17 }}
                                >
                                    <MatchCard
                                        m={m}
                                        activeTab={activeTab}
                                        unread={unreadMap[m.id] ?? 0}
                                        onAccept={() => handleStatusUpdate(m.id, 'ACCEPTED')}
                                        onDecline={() => handleStatusUpdate(m.id, 'DECLINED')}
                                        onChat={() => openGlobalChat(m)}
                                        t={t}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </div>
    );
}