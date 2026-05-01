"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, LogIn, LogOut, User as UserIcon,
  MessageSquare, Compass, Globe, ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useParams } from "next/navigation";
import { createClient } from "@/src/utils/supabase/client";
import { useToast } from "@/src/components/ToastProvider";
import { useTranslations } from "next-intl";
import { useGameTheme } from "@/src/context/GameThemeContext";
import GameSelector, { GAME_URL_SLUG } from "@/src/components/GameSelector";

const supabase = createClient();

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "uk", label: "UA" },
];

export function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const params = useParams();
  const currentLocale = (params?.locale as string) || "en";
  const router = useRouter();
  const { activeGame } = useGameTheme();
  const t = useTranslations("Navbar");

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [pendingCount, setPendingCount] = useState(0);
  const { showToast } = useToast();

  const fetchNotifications = useCallback(async (userId: string) => {
    const { count: pCount } = await supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .eq("target_id", userId)
      .eq("status", "PENDING");
    setPendingCount(pCount || 0);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setPendingCount(0); return; }
    fetchNotifications(user.id);
    const channel = supabase
      .channel(`navbar-${Math.random()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, (payload) => {
        fetchNotifications(user.id);
        if (payload.eventType === "INSERT" && payload.new.target_id === user.id) {
          showToast(t("notifications.newRequest"), "success");
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, pathname, fetchNotifications, showToast]);

  const gameSlug = GAME_URL_SLUG[activeGame];
  const discoveryPath = `/${currentLocale}/${gameSlug}`;
  const roomsPath = `/${currentLocale}/rooms/${gameSlug}`;

  const handleLogin = useCallback(async () => {
    const redirectTo = typeof window !== "undefined"
      ? `${window.location.origin}/api/auth/callback?next=${window.location.pathname}`
      : undefined;
    await supabase.auth.signInWithOAuth({ provider: "discord", options: { redirectTo } });
  }, [pathname]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setIsMenuOpen(false);
    window.location.href = "/";
  }, []);

  const handleLanguageChange = useCallback((newLocale: string) => {
    if (!pathname) return;
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  }, [pathname, router]);

  const navLinks = useMemo(() => [
    { id: "discovery", label: t("discovery"), href: discoveryPath,              icon: Compass },
    { id: "rooms",     label: t("rooms"),     href: roomsPath,                   icon: UserIcon },
    { id: "matches",   label: t("matches"),   href: `/${currentLocale}/matches`, icon: MessageSquare },
  ], [discoveryPath, roomsPath, currentLocale, t]);

  const isActive = (link: (typeof navLinks)[0]) =>
    (link.id === "discovery" &&
      !pathname.includes("/rooms/") &&
      (pathname.includes("/league") || pathname.includes("/tft") || pathname.includes("/valorant"))) ||
    (link.id === "rooms" && pathname.includes("/rooms/")) ||
    pathname === link.href;

  const avatarUrl = user?.user_metadata?.avatar_url;
  const fullName  = user?.user_metadata?.full_name ?? "";
  const displayName = fullName || user?.email?.split("@")[0] || "";

  return (
    <>
      <style>{`
        @keyframes badge-ping {
          0%   { box-shadow: 0 0 0 0   rgba(var(--accent-color), 0.6); }
          70%  { box-shadow: 0 0 0 6px rgba(var(--accent-color), 0); }
          100% { box-shadow: 0 0 0 0   rgba(var(--accent-color), 0); }
        }
        .nav-link-item { position: relative; }
        .nav-link-item::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 50%;
          transform: translateX(-50%) scaleX(0);
          width: 100%;
          height: 1px;
          background: rgb(var(--accent-color));
          transition: transform 0.2s ease;
          transform-origin: center;
        }
        .nav-link-item:hover::after,
        .nav-link-item.is-active::after { transform: translateX(-50%) scaleX(1); }
        .nav-link-item.is-active { color: #fff !important; }
      `}</style>

      <nav
        className="w-full sticky top-0 z-[100] border-b border-white/[0.06]"
        style={{ background: "#000" }}
      >
        <div className="max-w-[1600px] mx-auto h-[60px] flex items-center justify-between px-6">

          {/* ── LEFT ── */}
          <div className="flex items-center gap-10">

            {/* Original logo — italic gradient */}
            <Link href="/" className="select-none group">
              <h1
                className="text-2xl font-black italic tracking-tighter bg-clip-text text-transparent transition-opacity duration-200 group-hover:opacity-75"
                style={{
                  backgroundImage: "linear-gradient(90deg, rgb(var(--accent-color)), #52525b)",
                }}
              >
                ReMatch
              </h1>
            </Link>

            {/* Nav links — desktop */}
            <div className="hidden md:flex items-center">
              {navLinks.map((link) =>
                !user && link.id === "matches" ? null : (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`nav-link-item flex items-center gap-2 px-4 h-[60px] text-[11px] font-semibold uppercase tracking-[1.8px] transition-colors duration-150 ${
                      isActive(link)
                        ? "is-active text-white"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <link.icon size={13} strokeWidth={2} className="opacity-60" />
                    {link.label}
                    {link.id === "matches" && pendingCount > 0 && (
                      <span
                        className="flex items-center justify-center min-w-[16px] h-[16px] rounded-full text-[9px] font-black px-1"
                        style={{
                          background: "rgb(var(--accent-color))",
                          color: "#000",
                          animation: "badge-ping 1.5s ease-out infinite",
                        }}
                      >
                        {pendingCount}
                      </span>
                    )}
                  </Link>
                )
              )}
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="flex items-center gap-2">

            {/* Game selector — завжди видимий, userId може бути null для гостей */}
            <GameSelector userId={user?.id ?? null} />

            {/* Language */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[10px] font-bold uppercase tracking-[1.5px] text-zinc-500 hover:text-zinc-300 transition-colors duration-150 border border-white/[0.06] hover:border-white/[0.12]"
              >
                <Globe size={12} strokeWidth={1.5} />
                {LANGUAGES.find((l) => l.code === currentLocale)?.label}
                <ChevronDown
                  size={10}
                  strokeWidth={2}
                  style={{
                    transform: isLangOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.18s",
                  }}
                />
              </button>

              <AnimatePresence>
                {isLangOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-[calc(100%+6px)] w-[72px] rounded-lg overflow-hidden z-[110]"
                    style={{
                      background: "#0a0a0a",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => { handleLanguageChange(lang.code); setIsLangOpen(false); }}
                        className="w-full px-3 py-2.5 text-[10px] font-bold uppercase tracking-[1.5px] text-left transition-colors flex items-center justify-between"
                        style={{
                          color: currentLocale === lang.code
                            ? "rgb(var(--accent-color))"
                            : "rgb(113,113,122)",
                        }}
                      >
                        {lang.label}
                        {currentLocale === lang.code && (
                          <span
                            className="w-1 h-1 rounded-full"
                            style={{ background: "rgb(var(--accent-color))" }}
                          />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Separator */}
            <div className="hidden md:block w-px h-4 bg-white/[0.08] mx-1" />

            {user ? (
              <>
                {/* Avatar + name */}
                <Link
                  href={`/${currentLocale}/profile`}
                  className="hidden md:flex items-center gap-2.5 h-8 pl-1.5 pr-3 rounded-md border border-white/[0.07] hover:border-white/[0.15] transition-colors duration-150 group"
                >
                  <div
                    className="w-6 h-6 rounded-[5px] overflow-hidden flex-shrink-0 flex items-center justify-center text-[10px] font-black"
                    style={{
                      background: avatarUrl ? "transparent" : "rgba(var(--accent-color),0.15)",
                      color: "rgb(var(--accent-color))",
                    }}
                  >
                    {avatarUrl
                      ? <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                      : displayName.slice(0, 2).toUpperCase() || <UserIcon size={11} />
                    }
                  </div>
                  <span className="text-[12px] font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors max-w-[90px] truncate">
                    {displayName}
                  </span>
                </Link>

                {/* Sign out */}
                <button
                  onClick={handleSignOut}
                  title={t("logout")}
                  className="hidden md:flex items-center justify-center w-8 h-8 rounded-md text-zinc-600 hover:text-red-400 border border-white/[0.06] hover:border-red-500/20 hover:bg-red-500/[0.05] transition-all duration-150 cursor-pointer"
                >
                  <LogOut size={14} strokeWidth={1.75} />
                </button>

                {/* Mobile burger */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="md:hidden flex items-center justify-center w-8 h-8 text-zinc-500 hover:text-white transition-colors"
                >
                  {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
              </>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center gap-2 h-8 px-4 rounded-md text-[11px] font-bold uppercase tracking-[1.5px] transition-opacity duration-150 hover:opacity-85"
                style={{
                  background: "rgb(var(--accent-color))",
                  color: "#000",
                }}
              >
                <LogIn size={13} strokeWidth={2} />
                <span className="hidden sm:inline">{t("login")}</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Mobile menu ── */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="md:hidden overflow-hidden border-t border-white/[0.06]"
              style={{ background: "#000" }}
            >
              <div className="flex flex-col p-3 gap-0.5">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-[11px] font-semibold uppercase tracking-[1.5px] transition-colors"
                    style={{
                      color: isActive(link) ? "rgb(var(--accent-color))" : "rgb(113,113,122)",
                      background: isActive(link) ? "rgba(var(--accent-color),0.06)" : "transparent",
                    }}
                  >
                    <link.icon size={15} strokeWidth={1.75} />
                    {link.label}
                    {link.id === "matches" && pendingCount > 0 && (
                      <span
                        className="ml-auto flex items-center justify-center min-w-[16px] h-[16px] rounded-full text-[9px] font-black px-1"
                        style={{ background: "rgb(var(--accent-color))", color: "#000" }}
                      >
                        {pendingCount}
                      </span>
                    )}
                  </Link>
                ))}
                <Link
                  href={`/${currentLocale}/profile`}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-[11px] font-semibold uppercase tracking-[1.5px] text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  <UserIcon size={15} strokeWidth={1.75} />
                  {t("profile")}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-[11px] font-semibold uppercase tracking-[1.5px] text-red-500/60 hover:text-red-400 transition-colors text-left"
                >
                  <LogOut size={15} strokeWidth={1.75} />
                  {t("logout")}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}