"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  LogIn,
  Zap,
  Users,
  Globe,
  ChevronRight,
  Gamepad,
  ShieldCheck,
  Search,
  Trophy,
  MessageCircle,
  Star,
  Filter,
  Bell,
  CheckCircle,
  ArrowRight,
  Swords,
  Crown,
  Target,
  Mic,
  Eye,
  ChevronDown,
} from "lucide-react";
import { createClient } from "@/src/utils/supabase/client";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";

/* ─────────────────────────── types ─────────────────────────── */
interface StatProps {
  value: string;
  label: string;
}
interface StepProps {
  n: string;
  title: string;
  desc: string;
}
interface MockPlayerProps {
  name: string;
  tag: string;
  rank: string;
  role: string;
  lang: string[];
  queue: string;
  avatar: string;
  color: string;
}

/* ─────────────────────────── data ─────────────────────────── */
const MOCK_PLAYERS: MockPlayerProps[] = [
  {
    name: "ShadowBlade",
    tag: "#NA1",
    rank: "PLATINUM III",
    role: "JUNGLE",
    lang: ["English", "Spanish"],
    queue: "Solo/Duo",
    avatar: "🐉",
    color: "#1a9e6e",
  },
  {
    name: "CyberWiz",
    tag: "#EUW",
    rank: "GOLD III",
    role: "FILL",
    lang: ["English", "German"],
    queue: "Solo/Duo",
    avatar: "🔮",
    color: "#c9a227",
  },
  {
    name: "IronWall",
    tag: "#KR1",
    rank: "BRONZE I",
    role: "SUPPORT",
    lang: ["English"],
    queue: "Flex",
    avatar: "🛡️",
    color: "#7c6f9e",
  },
  {
    name: "StormRider",
    tag: "#EUNE",
    rank: "DIAMOND IV",
    role: "ADC",
    lang: ["English", "French"],
    queue: "Solo/Duo",
    avatar: "⚡",
    color: "#4fa0d6",
  },
];

const MOCK_MATCHES = [
  {
    name: "MysticRaven",
    tag: "#MOON",
    region: "EUW",
    lang: "English",
    avatar: "🎯",
  },
  {
    name: "FrostBite",
    tag: "#ICE",
    region: "NA",
    lang: "English",
    avatar: "🐺",
  },
  {
    name: "NeonSamurai",
    tag: "#2077",
    region: "EUW",
    lang: "English",
    avatar: "🎮",
  },
  {
    name: "SolarFlare",
    tag: "#SUN",
    region: "OCE",
    lang: "English",
    avatar: "🔥",
  },
  {
    name: "VoidWalker",
    tag: "#NULL",
    region: "EUNE",
    lang: "English",
    avatar: "⚔️",
  },
];

const GAMES = [
  { id: "lol", label: "League of Legends", icon: "", color: "200 155 60" }, // #C89B3C
  { id: "tft", label: "Teamfight Tactics", icon: "", color: "11 196 227" }, // #0BC4E3
  { id: "valorant", label: "Valorant", icon: "", color: "255 70 85" }, // #FF4655
];

const TOP_CHAMPS_DATA = [
  {
    name: "Aatrox",
    img: "https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/Aatrox.png",
    pts: "764K",
  },
  {
    name: "LeeSin",
    img: "https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/LeeSin.png",
    pts: "514K",
  },
  {
    name: "Yasuo",
    img: "https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/Yasuo.png",
    pts: "248K",
  },
  {
    name: "Thresh",
    img: "https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/Thresh.png",
    pts: "378K",
  },
  {
    name: "Kaisa",
    img: "https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/Kaisa.png",
    pts: "182K",
  },
  {
    name: "Yone",
    img: "https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/Yone.png",
    pts: "131K",
  },
  {
    name: "Sylas",
    img: "https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/Sylas.png",
    pts: "121K",
  },
  {
    name: "Ezreal",
    img: "https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/Ezreal.png",
    pts: "84K",
  },
  {
    name: "Viego",
    img: "https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/Viego.png",
    pts: "94K",
  },
];

/* ─────────────────────────── component ─────────────────────────── */
export default function LandingPage() {
  const t = useTranslations('LandingPage');
  const locale = useLocale();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeGame, setActiveGame] = useState("lol");
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, [supabase]);

  // Sync with global theme system
  useEffect(() => {
    document.documentElement.setAttribute("data-game-theme", activeGame);
  }, [activeGame]);

  const handleLogin = async () => {
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/api/auth/callback?next=${window.location.pathname}`
        : undefined;
    await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo },
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-50 overflow-x-hidden font-sans">
      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <span className="text-[rgb(var(--accent-color))] font-black text-2xl tracking-tight italic">
          ReMatch
        </span>
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-400">
          <a href="#discovery" className="hover:text-white transition-colors">
            {t('nav.discovery')}
          </a>
          <a href="#matches" className="hover:text-white transition-colors">
            {t('nav.matchCenter')}
          </a>
          <a href="#profile" className="hover:text-white transition-colors">
            {t('nav.profile')}
          </a>
          <a href="#player" className="hover:text-white transition-colors">
            {t('nav.playerPage')}
          </a>
          <a href="#messages" className="hover:text-white transition-colors">
            {t('nav.messages')}
          </a>
        </div>
        {!loading &&
          (user ? (
            <Link href={`/${locale}/league`}>
              <button className="btn-modern px-5 py-2 text-sm">
                {t('nav.openApp')} →
              </button>
            </Link>
          ) : (
            <button
              onClick={handleLogin}
              className="btn-modern px-5 py-2 text-sm flex items-center gap-2"
            >
              <LogIn size={16} /> {t('nav.login')}
            </button>
          ))}
      </nav>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(var(--accent-color)/0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--accent-color)/0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[rgb(var(--accent-color))] opacity-[0.06] blur-[120px] pointer-events-none" />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 text-center max-w-5xl mx-auto"
        >
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[rgb(var(--accent-color)/0.12)] border border-[rgb(var(--accent-color)/0.25)] text-[rgb(var(--accent-color))] text-[10px] font-black uppercase tracking-[0.3em] mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--accent-color))] animate-pulse" />
            {t('hero.badge')}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="text-6xl md:text-[clamp(4rem,10vw,8rem)] font-black tracking-tighter leading-[0.85] uppercase mb-8"
          >
            {t('hero.title.line1')}
            <br />
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-[rgb(var(--accent-color))] via-white to-[rgb(var(--accent-color))] bg-clip-text text-transparent">
                {t('hero.title.line2')}
              </span>
              <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-[rgb(var(--accent-color))] to-transparent rounded-full opacity-60" />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            {t('hero.description')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {!loading &&
              (user ? (
                <>
                  <Link href={`/${locale}/registration`}>
                    <button className="btn-modern px-10 py-4 text-base flex items-center gap-2">
                      <Swords size={18} /> {t('hero.buttons.findTeammates')}
                    </button>
                  </Link>
                  <Link href={`/${locale}/league`}>
                    <button className="btn-modern-ghost px-10 py-4 text-base flex items-center gap-2">
                      <Users size={18} /> {t('hero.buttons.seeWhoIsLooking')}
                    </button>
                  </Link>
                </>
              ) : (
                <button
                  onClick={handleLogin}
                  className="btn-modern px-12 py-5 text-lg flex items-center gap-3 scale-105 shadow-[0_0_40px_rgb(var(--accent-color)/0.3)]"
                >
                  <LogIn size={22} /> {t('hero.buttons.loginWithDiscord')}
                </button>
              ))}
          </motion.div>

          
        </motion.div>

        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-600"
        >
          <ChevronDown size={24} />
        </motion.div>
      </section>

      {/* ── STATS BAR ───────────────────────────────────────── */}
      <div className="border-y border-white/5 bg-white/[0.02] py-10 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {(
            [
              { value: t('stats.alpha.value'), label: t('stats.alpha.label') },
              { value: t('stats.profiles.value'), label: t('stats.profiles.label') },
              { value: t('stats.regions.value'), label: t('stats.regions.label') },
              { value: t('stats.toxicity.value'), label: t('stats.toxicity.label') },
            ] as StatProps[]
          ).map((s, idx) => (
            <div key={idx}>
              <div className="text-3xl md:text-4xl font-black text-[rgb(var(--accent-color))] mb-1">
                {s.value}
              </div>
              <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DISCOVERY ───────────────────────────────────────── */}
      <section
        id="discovery"
        className="relative py-28 px-6 max-w-[1300px] mx-auto overflow-hidden"
      >
        <SectionHeader
          tag={t('discovery.header.tag')}
          title={t('discovery.header.title')}
          sub={t('discovery.header.description')}
        />

        <div className="relative z-10 flex gap-4 mb-10">
          {GAMES.map((g) => (
            <button
              key={g.id}
              onClick={() => setActiveGame(g.id)}
              className={`px-5 py-2 rounded-full text-sm font-bold border transition-all ${activeGame === g.id ? "border-[rgb(var(--accent-color))] bg-[rgb(var(--accent-color)/0.12)] text-[rgb(var(--accent-color))]" : "border-white/10 text-slate-500 hover:text-white"}`}
            >
              {g.icon} {t(`games.${g.id}`)}
            </button>
          ))}
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* filter */}
          <div className="modern-panel p-6 h-fit">
            <div className="flex items-center gap-2 text-[rgb(var(--accent-color))] font-bold mb-6 text-sm uppercase tracking-widest">
              <Filter size={14} /> {t('discovery.filters.title')}
            </div>
            {[
              { label: t('discovery.filters.region.label'), value: t('discovery.filters.region.value') },
              { label: t('discovery.filters.role.label'), value: t('discovery.filters.role.value') },
              { label: t('discovery.filters.rank.label'), value: t('discovery.filters.rank.value') },
              { label: t('discovery.filters.queue.label'), value: t('discovery.filters.queue.value') },
            ].map((f) => (
              <div key={f.label} className="mb-5">
                <div className="text-[10px] uppercase tracking-widest text-slate-600 mb-1.5 font-semibold">
                  {f.label}
                </div>
                <div className="w-full bg-[#1a1a1a] border border-white/5 rounded-lg px-4 py-2.5 text-sm text-slate-300 flex items-center justify-between cursor-pointer hover:border-white/10 transition-colors">
                  {f.value} <ChevronDown size={14} className="text-slate-600" />
                </div>
              </div>
            ))}
            <div className="mb-5">
              <div className="text-[10px] uppercase tracking-widest text-slate-600 mb-2 font-semibold">
                {t('discovery.filters.language.label')}
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  "English",
                  "Spanish",
                  "German",
                  "French",
                  "Polish",
                  "Ukrainian",
                ].map((l, i) => (
                  <span
                    key={l}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border cursor-pointer transition-all ${i < 2 ? "bg-[rgb(var(--accent-color)/0.15)] border-[rgb(var(--accent-color)/0.4)] text-[rgb(var(--accent-color))]" : "border-white/5 text-slate-500 hover:border-white/15"}`}
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
              <span className="text-xs text-slate-500 font-semibold">
                {t('discovery.filters.liveOnline')}
              </span>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
            <div className="mt-5 p-4 rounded-xl bg-[rgb(var(--accent-color)/0.05)] border border-[rgb(var(--accent-color)/0.1)] group/info hover:border-[rgb(var(--accent-color)/0.2)] transition-all">
              <div className="flex items-center gap-2 text-[rgb(var(--accent-color))] font-bold text-[10px] uppercase tracking-widest mb-2">
                <Zap size={12} className="fill-current" /> {t('discovery.timeSaver.badge')}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed group-hover/info:text-slate-400 transition-colors">
                {t.rich('discovery.timeSaver.description', { b: (chunks) => <b>{chunks}</b> })}
              </p>
            </div>
          </div>

          {/* cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {MOCK_PLAYERS.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className="modern-panel p-5 hover:bg-white/[0.04] transition-colors group cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{
                        background: `${p.color}22`,
                        border: `1px solid ${p.color}44`,
                      }}
                    >
                      {p.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">
                        {p.name}{" "}
                        <span className="text-slate-600 font-normal">
                          {p.tag}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Trophy
                          size={10}
                          className="text-[rgb(var(--accent-color))]"
                        />{" "}
                        {p.rank}
                      </div>
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full"
                    style={{
                      background: `${p.color}22`,
                      color: p.color,
                      border: `1px solid ${p.color}44`,
                    }}
                  >
                    {p.role}
                  </span>
                </div>
                <div className="flex gap-2 mb-4 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-1 rounded bg-white/5 text-slate-400 uppercase tracking-wide">
                    {p.queue}
                  </span>
                  {p.lang.map((l) => (
                    <span
                      key={l}
                      className="text-[10px] font-bold px-2 py-1 rounded bg-white/5 text-slate-400 flex items-center gap-1"
                    >
                      <Globe size={9} /> {l}
                    </span>
                  ))}
                </div>
                <button className="w-full py-2.5 rounded-lg bg-[rgb(var(--accent-color))] text-black font-black text-xs uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">
                  {t('discovery.buttons.viewProfile')}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MATCH CENTER ────────────────────────────────────── */}
      <section
        id="matches"
        className="py-28 px-6 border-y border-white/5 bg-[#0d0d0d]"
      >
        <div className="max-w-[1300px] mx-auto">
          <SectionHeader
            tag={t('matchCenter.header.tag')}
            title={t('matchCenter.header.title')}
            sub={t('matchCenter.header.description')}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {MOCK_MATCHES.map((m, i) => (
              <motion.div
                key={m.name}
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.07 }}
                viewport={{ once: true }}
                className="modern-panel p-5 hover:bg-white/[0.04] transition-colors text-center group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl mx-auto mb-3 border border-white/5 group-hover:border-white/10 transition-colors">
                  {m.avatar}
                </div>
                <div className="font-bold text-sm text-white mb-0.5">
                  {m.name}
                </div>
                <div className="text-[10px] text-slate-600 mb-1">{m.tag}</div>
                <div className="text-[10px] text-slate-500 mb-3">
                  {m.region} · {m.lang}
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 rounded-lg bg-[rgb(var(--accent-color))] text-black font-black text-[10px] uppercase tracking-wide opacity-70 group-hover:opacity-100 transition-opacity">
                    {t('matchCenter.buttons.profile')}
                  </button>
                  <button className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                    <MessageCircle size={14} className="text-slate-400" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-10 p-5 modern-panel flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[rgb(var(--accent-color)/0.15)] flex items-center justify-center">
                <Bell size={18} className="text-[rgb(var(--accent-color))]" />
              </div>
              <div>
                <div className="font-bold text-sm text-white mb-0.5">
                  {t('matchCenter.requests.title')}
                </div>
                <div className="text-xs text-slate-500">
                  {t('matchCenter.requests.description')}
                </div>
              </div>
            </div>
            <span className="px-4 py-1.5 rounded-full bg-[rgb(var(--accent-color)/0.1)] border border-[rgb(var(--accent-color)/0.2)] text-[rgb(var(--accent-color))] text-xs font-bold">
              {t('matchCenter.requests.count', { count: 0 })}
            </span>
          </div>
        </div>
      </section>

      {/* ── PROFILE EDITOR ──────────────────────────────────── */}
      <section id="profile" className="py-28 px-6 max-w-[1300px] mx-auto">
        <SectionHeader
          tag={t('profileEditor.header.tag')}
          title={t('profileEditor.header.title')}
          sub={t('profileEditor.header.description')}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="modern-panel p-8"
          >
            <div className="flex items-start gap-6 mb-8">
              <div className="w-24 h-24 rounded-2xl bg-[rgb(var(--accent-color)/0.15)] flex items-center justify-center text-4xl border border-[rgb(var(--accent-color)/0.3)] relative">
                🧝
                <span className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-[rgb(var(--accent-color))] flex items-center justify-center">
                  <Trophy size={12} className="text-black" />
                </span>
              </div>
              <div>
                <div className="text-xs text-[rgb(var(--accent-color))] font-bold uppercase tracking-widest mb-1">
                  ● {t('games.lol')}
                </div>
                <div className="font-black text-2xl uppercase italic tracking-tight mb-1">
                  AlphaOne
                </div>
                <div className="text-sm text-[rgb(var(--accent-color))] font-bold mb-2">
                  #NA1
                </div>
                <span className="text-[10px] px-2 py-1 rounded bg-white/5 text-slate-500 font-bold">
                  🇺🇸 {t('languages.english')}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                {
                  label: "Solo Queue",
                  rank: "PLATINUM III",
                  wr: "43% WR",
                  games: "42 games",
                  color: "#1a9e6e",
                },
                {
                  label: "Flex Queue",
                  rank: "SILVER I",
                  wr: "29% WR",
                  games: "14 games",
                  color: "#7c6f9e",
                },
              ].map((q) => (
                <div
                  key={q.label}
                  className="p-4 rounded-xl bg-white/[0.03] border border-white/5"
                >
                  <div className="text-[10px] uppercase tracking-widest text-slate-600 mb-1 font-bold">
                    {q.label}
                  </div>
                  <div className="font-black text-sm italic mb-1">{q.rank}</div>
                  <div className="text-xs font-bold" style={{ color: q.color }}>
                    {q.wr} · {q.games}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <Target size={14} className="text-[rgb(var(--accent-color))]" />
              <span className="text-xs font-bold text-slate-400">
                {t('profileEditor.preview.position')}: <span className="text-white">TOP</span>
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="modern-panel p-8"
          >
            <div className="text-xs uppercase tracking-widest text-[rgb(var(--accent-color))] font-bold mb-6 flex items-center gap-2">
              <ShieldCheck size={14} /> {t('profileEditor.settings.title')}
            </div>
            <div className="space-y-5">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-slate-600 mb-2 font-bold">
                  {t('profileEditor.settings.displayName.label')}
                </div>
                <div className="w-full bg-[#1a1a1a] border border-white/5 rounded-lg px-4 py-3 text-sm text-slate-300">
                  AlphaOne
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-slate-600 mb-2 font-bold">
                  {t('profileEditor.settings.languages.label')}
                </div>
                <div className="flex flex-wrap gap-2">
                  {["English", "Spanish", "French", "German"].map((l, i) => (
                    <span
                      key={l}
                      className={`px-3 py-1 rounded-full text-xs font-bold border cursor-pointer ${i === 0 ? "bg-[rgb(var(--accent-color)/0.15)] border-[rgb(var(--accent-color)/0.4)] text-[rgb(var(--accent-color))]" : "border-white/5 text-slate-500 hover:border-white/10"}`}
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="flex items-center gap-3">
                  <Mic size={16} className="text-[rgb(var(--accent-color))]" />
                  <span className="text-sm font-semibold text-slate-300">
                    {t('profileEditor.settings.voice.label')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-6 rounded-full bg-[rgb(var(--accent-color))] flex items-center justify-end pr-0.5 cursor-pointer">
                    <div className="w-5 h-5 rounded-full bg-black" />
                  </div>
                  <span className="text-xs text-slate-400">
                    {t('profileEditor.settings.voice.status')}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-slate-600 mb-2 font-bold">
                  {t('profileEditor.settings.games.label')}
                </div>
                <div className="flex gap-2">
                  {GAMES.map((g) => (
                    <button
                      key={g.id}
                      className={`px-4 py-2 rounded-lg text-xs font-bold border ${g.id === "lol" ? "border-[rgb(var(--accent-color)/0.4)] text-[rgb(var(--accent-color))] bg-[rgb(var(--accent-color)/0.1)]" : "border-white/5 text-slate-500"}`}
                    >
                      {g.icon} {t(`games.${g.id}`).toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PLAYER PROFILE PAGE ─────────────────────────────── */}
      <section
        id="player"
        className="py-28 px-6 border-y border-white/5 bg-[#0d0d0d]"
      >
        <div className="max-w-[1300px] mx-auto">
          <SectionHeader
            tag={t('playerProfile.header.tag')}
            title={t('playerProfile.header.title')}
            sub={t('playerProfile.header.description')}
          />

          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 max-w-5xl mx-auto">
            {/* left panel */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="modern-panel p-8 bg-[#111111]"
            >
              <div className="relative w-36 h-36 mx-auto mb-6">
                <div className="w-36 h-36 rounded-2xl bg-gradient-to-br from-[rgb(var(--accent-color)/0.3)] to-[rgb(var(--accent-color)/0.05)] flex items-center justify-center text-6xl border-2 border-[rgb(var(--accent-color)/0.4)]">
                  🧑
                </div>
                <div className="absolute -bottom-3 -right-3 w-9 h-9 rounded-full bg-[rgb(var(--accent-color))] flex items-center justify-center shadow-lg">
                  <Trophy size={16} className="text-black" />
                </div>
              </div>

              <div className="text-center mb-6">
                <div className="font-black text-3xl uppercase italic tracking-tight mb-1">
                  PhantomCarry
                </div>
                <div className="text-[rgb(var(--accent-color))] font-bold text-sm mb-4">
                  #VOID
                </div>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs font-bold text-slate-300">
                    🗡️ {t('roles.top')}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs font-bold text-slate-300">
                    🌐 {t('languages.english')}
                  </span>
                </div>
              </div>

              <div className="flex rounded-xl overflow-hidden border border-white/5 mb-6">
                <button className="flex-1 py-2.5 text-xs font-bold text-slate-500 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                  {t('games.tft')}
                </button>
                <button className="flex-1 py-2.5 text-xs font-bold bg-[rgb(var(--accent-color))] text-black">
                  {t('games.lol')}
                </button>
              </div>

              {[
                {
                  label: "Solo Queue",
                  rank: "PLATINUM III",
                  wr: "54% WR",
                  games: "63 games",
                  color: "#1a9e6e",
                },
                {
                  label: "Flex Queue",
                  rank: "PLATINUM IV",
                  wr: "46% WR",
                  games: "23 games",
                  color: "#1a9e6e",
                },
              ].map((q) => (
                <div
                  key={q.label}
                  className="p-4 rounded-xl bg-white/[0.03] border border-white/5 mb-3"
                >
                  <div className="text-[10px] uppercase tracking-widest text-slate-600 mb-1 font-bold">
                    {q.label}
                  </div>
                  <div className="font-black text-lg italic mb-0.5">
                    {q.rank}
                  </div>
                  <div className="text-xs font-bold" style={{ color: q.color }}>
                    {q.wr} · {q.games}
                  </div>
                </div>
              ))}
            </motion.div>

            {/* right panel */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex flex-col gap-5"
            >
              {/* bio */}
              <div className="modern-panel p-6 bg-[#111111]">
                <div className="text-[10px] uppercase tracking-widest text-[rgb(var(--accent-color))] font-black mb-4">
                  {t('playerProfile.intel.tag')}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-slate-600 font-bold mb-2">
                  {t('playerProfile.intel.bioLabel')}
                </div>
                <div className="text-xl font-black italic text-white/80">
                  {t('playerProfile.intel.bio')}
                </div>
              </div>

              {/* champion mastery */}
              <div className="modern-panel p-6 bg-[#111111]">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[10px] uppercase tracking-widest text-slate-600 font-black">
                    {t('playerProfile.mastery.title')}
                  </div>
                  <button className="text-[10px] px-3 py-1.5 rounded-lg border border-[#4fa0d6]/40 text-[#4fa0d6] font-bold hover:bg-[#4fa0d6]/10 transition-colors flex items-center gap-1.5">
                    ↗ {t('playerProfile.mastery.opgg')}
                  </button>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {TOP_CHAMPS_DATA.map((champ, i) => (
                    <div
                      key={champ.name}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <div
                        className={`w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center border ${i < 2 ? "border-[rgb(var(--accent-color)/0.5)]" : "border-white/5"}`}
                      >
                        <img
                          src={champ.img}
                          alt={champ.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[9px] font-bold text-slate-500">
                        {champ.pts}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* cta + reviews */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="modern-panel p-6 bg-[#111111] flex flex-col justify-between gap-4">
                  <div>
                    <div className="text-sm font-black text-white mb-1">
                      {t('playerProfile.cta.title')}
                    </div>
                    <div className="text-xs text-slate-500">
                      {t('playerProfile.cta.description')}
                    </div>
                  </div>
                  <button className="w-full py-3 rounded-xl bg-[rgb(var(--accent-color))] text-black font-black text-sm uppercase tracking-wider hover:opacity-90 transition-opacity">
                    {t('playerProfile.cta.button')}
                  </button>
                </div>
                {/* <div className="modern-panel p-6 bg-[#111111]">
                  <div className="text-[10px] uppercase tracking-widest text-slate-600 font-black mb-4">
                    {t('playerProfile.reviews.title')}
                  </div>
                  <div className="flex flex-col items-center justify-center h-20 text-center">
                    <MessageCircle size={24} className="text-slate-700 mb-2" />
                    <div className="text-xs text-slate-600 font-bold uppercase tracking-widest">
                      {t('playerProfile.reviews.empty.title')}
                    </div>
                    <div className="text-[10px] text-slate-700 mt-1">
                      {t('playerProfile.reviews.empty.description')}
                    </div>
                  </div>
                </div> */}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── MESSAGES ────────────────────────────────────────── */}
      <section id="messages" className="py-28 px-6 max-w-[1300px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <SectionHeaderLeft
              tag={t('messages.header.tag')}
              title={t('messages.header.title')}
              sub={t('messages.header.description')}
            />
            <div className="space-y-3 mt-8">
              {[
                {
                  label: t('messages.features.connecting.title'),
                  desc: t('messages.features.connecting.description'),
                },
                {
                  label: t('messages.features.notifications.title'),
                  desc: t('messages.features.notifications.description'),
                },
                {
                  label: t('messages.features.organized.title'),
                  desc: t('messages.features.organized.description'),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors"
                >
                  <div className="font-bold text-sm text-white mb-1">
                    {item.label}
                  </div>
                  <div className="text-xs text-slate-500 leading-relaxed">
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="modern-panel p-0 overflow-hidden max-w-sm mx-auto lg:mx-0 w-full"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <span className="font-black text-sm text-white uppercase tracking-wide">
                {t('messages.preview.title')}
              </span>
              <span className="text-slate-600 text-lg cursor-pointer hover:text-white transition-colors">
                ×
              </span>
            </div>
            <div className="divide-y divide-white/5">
              {MOCK_MATCHES.slice(0, 4).map((m, i) => (
                <div
                  key={m.name}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.03] transition-colors cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-lg flex-shrink-0 border border-white/5">
                    {m.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-white mb-0.5">
                      {m.name}
                    </div>
                    <div
                      className={`text-xs truncate ${i === 1 ? "text-[rgb(var(--accent-color))]" : "text-slate-600"}`}
                    >
                      {
                        [
                          "Wanna play some ranked?",
                          "New message from teammate",
                          "GG WP!",
                          "Let's climb!",
                        ][i]
                      }
                    </div>
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-slate-700 group-hover:text-slate-400 transition-colors flex-shrink-0"
                  />
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-white/5 flex justify-end">
              <div className="w-11 h-11 rounded-full bg-[rgb(var(--accent-color))] flex items-center justify-center shadow-lg cursor-pointer hover:opacity-80 transition-opacity">
                <MessageCircle size={20} className="text-black" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section className="py-28 px-6 border-y border-white/5 bg-[#0d0d0d]">
        <div className="max-w-[1300px] mx-auto">
          <SectionHeader
            tag={t('howItWorks.header.tag')}
            title={t('howItWorks.header.title')}
            sub={t('howItWorks.header.description')}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="absolute top-8 left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] h-px bg-gradient-to-r from-white/5 via-[rgb(var(--accent-color)/0.3)] to-white/5 hidden md:block" />
            {(
              [
                {
                  n: "01",
                  title: t('howItWorks.steps.step1.title'),
                  desc: t('howItWorks.steps.step1.description'),
                },
                {
                  n: "02",
                  title: t('howItWorks.steps.step2.title'),
                  desc: t('howItWorks.steps.step2.description'),
                },
                {
                  n: "03",
                  title: t('howItWorks.steps.step3.title'),
                  desc: t('howItWorks.steps.step3.description'),
                },
              ] as StepProps[]
            ).map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className="relative modern-panel p-8 hover:bg-white/[0.04] transition-colors"
              >
                <div className="text-6xl font-black text-white/[0.04] absolute top-4 right-4 leading-none select-none">
                  {s.n}
                </div>
                <div className="w-12 h-12 rounded-xl bg-[rgb(var(--accent-color)/0.15)] border border-[rgb(var(--accent-color)/0.3)] flex items-center justify-center mb-6">
                  <span className="text-[rgb(var(--accent-color))] font-black text-lg">
                    {s.n}
                  </span>
                </div>
                <h4 className="text-lg font-black uppercase italic tracking-tight mb-3 text-white">
                  {s.title}
                </h4>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[rgb(var(--accent-color)/0.04)] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-[rgb(var(--accent-color))] opacity-[0.05] blur-[100px] pointer-events-none" />
        <div className="relative max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-6 leading-[0.9]">
              {t('cta.title.line1')}
              <br />
              <span className="text-[rgb(var(--accent-color))]">{t('cta.title.line2')}</span>
            </h2>
            <p className="text-slate-400 text-lg mb-10">
              {t.rich('cta.description', { b: (chunks) => <b>{chunks}</b> })}
            </p>
            {!loading &&
              (user ? (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/league">
                    <button className="btn-modern px-10 py-4 text-base flex items-center gap-2 mx-auto">
                      <Swords size={18} /> {t('cta.buttons.findTeammates')}
                    </button>
                  </Link>
                  <Link href="/tft">
                    <button className="btn-modern-ghost px-10 py-4 text-base flex items-center gap-2 mx-auto">
                      <Gamepad size={18} /> {t('cta.buttons.seeWhoIsLooking')}
                    </button>
                  </Link>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="btn-modern px-14 py-5 text-xl flex items-center gap-3 mx-auto shadow-[0_0_60px_rgb(var(--accent-color)/0.3)] hover:shadow-[0_0_80px_rgb(var(--accent-color)/0.4)] transition-shadow"
                >
                  <LogIn size={24} /> {t('cta.buttons.loginWithDiscord')}
                </button>
              ))}
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-[1300px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <span className="font-black text-lg text-[rgb(var(--accent-color))] italic">
            ReMatch
          </span>
          <span>
            {t('footer.disclaimer')}
          </span>
          <div className="flex gap-6">
            <a href="/privacy" className="hover:text-white transition-colors">
              {t('footer.links.privacy')}
            </a>
            <a href="/terms" className="hover:text-white transition-colors">
              {t('footer.links.terms')}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─────────────────────────── helpers ─────────────────────────── */
function SectionHeader({
  tag,
  title,
  sub,
}: {
  tag: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="text-center mb-16">
      <span className="text-[10px] uppercase tracking-[0.3em] text-[rgb(var(--accent-color))] font-black mb-4 block">
        {tag}
      </span>
      <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-4">
        {title}
      </h2>
      <p className="text-slate-500 max-w-xl mx-auto text-base leading-relaxed">
        {sub}
      </p>
    </div>
  );
}

function SectionHeaderLeft({
  tag,
  title,
  sub,
}: {
  tag: string;
  title: string;
  sub: string;
}) {
  return (
    <div>
      <span className="text-[10px] uppercase tracking-[0.3em] text-[rgb(var(--accent-color))] font-black mb-4 block">
        {tag}
      </span>
      <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-4">
        {title}
      </h2>
      <p className="text-slate-500 max-w-xl text-base leading-relaxed">{sub}</p>
    </div>
  );
}
