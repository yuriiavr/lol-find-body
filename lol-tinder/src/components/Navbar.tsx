"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogIn, LogOut, User as UserIcon, MessageSquare, Compass } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/src/utils/supabase/client";
import { ProfileButton } from "./ui/ProfileButton";
import { useToast } from "@/src/components/ToastProvider";

const supabase = createClient();

export function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [discoveryHref, setDiscoveryHref] = useState("/league");
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
          showToast("New team request received!", "success");
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
      setDiscoveryHref(`/${lastTab}`);
    }
  }, [pathname]);
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

  const navLinks = [
    { name: "Discovery", href: discoveryHref, icon: Compass },
    { name: "Matches", href: "/matches", icon: MessageSquare },
  ];

  return (
    <nav className="w-full border-b border-white/5 bg-[rgb(var(--bg-secondary)/0.8)] backdrop-blur-lg sticky top-0 z-[100] px-6">
      <div className="max-w-[1600px] mx-auto h-20 flex justify-between items-center">
        <div className="flex items-center gap-10">
          <Link href="/">
            <h1 className="text-2xl font-black bg-gradient-to-r from-[rgb(var(--accent-color))] to-zinc-800 bg-clip-text text-transparent tracking-tighter italic hover:opacity-80 transition-opacity cursor-pointer">
              LoLMatch
            </h1>
          </Link>
          {user && (
            <div className="hidden md:flex gap-8 text-xs font-bold uppercase tracking-widest text-slate-400">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className={`transition-colors hover:text-white ${ 
                    (link.name === 'Discovery' && (pathname.startsWith('/league') || pathname.startsWith('/tft') || pathname.startsWith('/valorant'))) || pathname === link.href
                      ? "text-white border-b-2 border-[rgb(var(--accent-color))] pb-1" 
                      : ""
                  }`}
                >
                  {link.name}
                  {link.name === 'Matches' && pendingCount > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-[rgb(var(--accent-color))] text-white text-[9px] rounded-full animate-pulse inline-flex items-center justify-center min-w-[18px]">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <ProfileButton user={user} className="hidden md:flex" />
              <button 
                onClick={handleSignOut}
                className="hidden cursor-pointer md:flex items-center gap-2 p-2.5 text-slate-400 hover:text-red-500 transition-colors bg-white/5 rounded-xl border border-white/5 hover:bg-red-500/10 hover:border-red-500/20"
                title="Logout"
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
              <LogIn size={18} /> <span className="hidden sm:inline">Login</span>
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
                    (link.name === 'Discovery' && (pathname.startsWith('/league') || pathname.startsWith('/tft') || pathname.startsWith('/valorant'))) || pathname === link.href
                      ? "bg-[rgb(var(--accent-color)/0.1)] text-[rgb(var(--accent-color))]" : "text-slate-400"
                  }`}
                >
                  <link.icon size={20} />
                  {link.name}
                  {link.name === 'Matches' && pendingCount > 0 && (
                    <span className="ml-auto px-2 py-0.5 bg-[rgb(var(--accent-color))] text-white text-[10px] rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              ))}
              <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-xl text-sm font-bold uppercase tracking-widest text-slate-400">
                <UserIcon size={20} />
                My Profile
              </Link>
              <button 
                onClick={handleSignOut}
                className="flex items-center gap-4 p-4 rounded-xl text-sm font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/5 transition-colors text-left"
              >
                <LogOut size={20} /> Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}