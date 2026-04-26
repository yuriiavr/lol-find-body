"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogIn, LogOut, User as UserIcon, MessageSquare, Compass, Globe, ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useParams } from "next/navigation";
import { createClient } from "@/src/utils/supabase/client";
import { ProfileButton } from "./ui/ProfileButton";
import { useToast } from "@/src/components/ToastProvider";
import { useTranslations } from "next-intl";

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
  const [discoveryHref, setDiscoveryHref] = useState(`/${currentLocale}/league`);
  const t = useTranslations('Navbar');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
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
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('target_id', userId)
      .eq('status', 'PENDING');
    setPendingCount(pCount || 0);
  }, []);
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (!user) {
      setPendingCount(0);
      return;
    }

    fetchNotifications(user.id);

    const channel = supabase
      .channel(`navbar-realtime-${Math.random()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, (payload) => {
        fetchNotifications(user.id);
        if (payload.eventType === 'INSERT' && payload.new.target_id === user.id) {
          showToast(t('notifications.newRequest'), "success");
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, pathname, fetchNotifications, showToast]);
  useEffect(() => {
    const lastTab = localStorage.getItem('lastDiscoveryTab');
    if (lastTab) {
      setDiscoveryHref(`/${currentLocale}/${lastTab}`);
    }
  }, [pathname, currentLocale]);
  const handleLogin = async () => {
    const redirectTo = typeof window !== 'undefined' 
      ? `${window.location.origin}/auth/callback`
      : undefined;

    await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo },
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsMenuOpen(false);
    router.push("/");
  };

  const handleLanguageChange = (newLocale: string) => {
    if (!pathname) return;
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  };

  const navLinks = [
    { id: "discovery", label: t('discovery'), href: discoveryHref, icon: Compass },
    { id: "matches", label: t('matches'), href: `/${currentLocale}/matches`, icon: MessageSquare },
  ];

  return (
    <nav className={`w-full border-b border-white/5 bg-[rgb(var(--bg-secondary)/0.8)] sticky top-0 z-[100] px-6 ${
      pathname === "/" ? "" : "backdrop-blur-lg"
    }`}>
      <div className="max-w-[1600px] mx-auto h-20 flex justify-between items-center">
        <div className="flex items-center gap-10">
          <Link href="/">
            <h1 className="text-2xl font-black bg-gradient-to-r from-[rgb(var(--accent-color))] to-zinc-800 bg-clip-text text-transparent tracking-tighter italic hover:opacity-80 transition-opacity cursor-pointer">
              ReMatch
            </h1>
          </Link>
          <div className="hidden md:flex gap-8 text-xs font-bold uppercase tracking-widest text-slate-400">
            {navLinks.map((link) => (
              (!user && link.id === 'matches') ? null : (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className={`transition-colors hover:text-white ${ 
                    (link.id === 'discovery' && (pathname.startsWith('/league') || pathname.startsWith('/tft') || pathname.startsWith('/valorant'))) || pathname === link.href
                      ? "text-white border-b-2 border-[rgb(var(--accent-color))] pb-1" 
                      : ""
                  }`}
                >
                  {link.label}
                  {link.id === 'matches' && pendingCount > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-[rgb(var(--accent-color))] text-white text-[9px] rounded-full animate-pulse inline-flex items-center justify-center min-w-[18px]">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              )
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative" ref={langRef}>
            <button 
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-3 py-1.5 text-slate-400 hover:text-white transition-all group hover:bg-white/10"
            >
              <Globe size={14} className="group-hover:text-[rgb(var(--accent-color))] transition-colors" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {LANGUAGES.find(l => l.code === currentLocale)?.label}
              </span>
              <ChevronDown size={12} className={`transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isLangOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-24 bg-[#111111] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-[110]"
                >
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        handleLanguageChange(lang.code);
                        setIsLangOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-left transition-colors flex items-center justify-between ${
                        currentLocale === lang.code 
                          ? 'text-[rgb(var(--accent-color))] bg-[rgb(var(--accent-color)/0.05)]' 
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {lang.label}
                      {currentLocale === lang.code && <div className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--accent-color))] shadow-[0_0_8px_rgb(var(--accent-color))]" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {user ? (
            <>
              <ProfileButton user={user} className="hidden md:flex">
                {user.user_metadata.full_name}
              </ProfileButton>
              <button 
                onClick={handleSignOut}
                className="hidden cursor-pointer md:flex items-center gap-2 p-2.5 text-slate-400 hover:text-red-500 transition-colors bg-white/5 rounded-xl border border-white/5 hover:bg-red-500/10 hover:border-red-500/20"
                title={t('logout')}
              >
                <LogOut size={18} />
              </button>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </>
          ) : (
            <button onClick={handleLogin} className="btn-modern py-2.5 px-6">
              <LogIn size={18} /> <span className="hidden sm:inline">{t('login')}</span>
            </button>
          )}
        </div>
      </div>
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/5 overflow-hidden bg-[rgb(var(--bg-secondary))]"
          >
            <div className="flex flex-col p-6 gap-4">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-4 p-4 rounded-xl text-sm font-bold uppercase tracking-widest ${
                    (link.id === 'discovery' && (pathname.startsWith('/league') || pathname.startsWith('/tft') || pathname.startsWith('/valorant'))) || pathname === link.href
                      ? "bg-[rgb(var(--accent-color)/0.1)] text-[rgb(var(--accent-color))]" : "text-slate-400"
                  }`}
                >
                  <link.icon size={20} />
                  {link.label}
                  {link.id === 'matches' && pendingCount > 0 && (
                    <span className="ml-auto px-2 py-0.5 bg-[rgb(var(--accent-color))] text-white text-[10px] rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              ))}
              <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-xl text-sm font-bold uppercase tracking-widest text-slate-400">
                <UserIcon size={20} />
                {t('profile')}
              </Link>
              <button 
                onClick={handleSignOut}
                className="flex items-center gap-4 p-4 rounded-xl text-sm font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/5 transition-colors text-left"
              >
                <LogOut size={20} /> {t('logout')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}