"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogIn, LogOut, User as UserIcon, Trophy, MessageSquare, Compass } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/src/utils/supabase/client";

const supabase = createClient();

export function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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
    { name: "Discovery", href: "/league", icon: Compass },
    { name: "Matches", href: "/matches", icon: MessageSquare },
  ];

  return (
    <nav className="w-full border-b border-white/5 bg-[#121212]/80 backdrop-blur-lg sticky top-0 z-[100] px-6">
      <div className="max-w-[1600px] mx-auto h-20 flex justify-between items-center">
        <div className="flex items-center gap-10">
          <Link href="/">
            <h1 className="text-2xl font-black bg-gradient-to-r from-orange-500 to-zinc-800 bg-clip-text text-transparent tracking-tighter italic hover:opacity-80 transition-opacity cursor-pointer">
              LoLMatch
            </h1>
          </Link>
          
          {/* Desktop Links */}
          {user && (
            <div className="hidden md:flex gap-8 text-xs font-bold uppercase tracking-widest text-slate-400">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className={`transition-colors hover:text-white ${pathname === link.href ? "text-white border-b-2 border-orange-500 pb-1" : ""}`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/profile" className="hidden md:flex items-center gap-3 p-1.5 pr-5 bg-zinc-900 rounded-full hover:bg-zinc-800 border border-white/5 transition-all">
                <img src={user.user_metadata.avatar_url} className="w-8 h-8 rounded-full border border-orange-500/30" alt="avatar" />
                <span className="text-sm font-bold">{user.user_metadata.full_name}</span>
              </Link>
              
              {/* Mobile Menu Toggle */}
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

      {/* Mobile Dropdown */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/5 overflow-hidden bg-[#121212]"
          >
            <div className="flex flex-col p-6 gap-4">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-4 p-4 rounded-xl text-sm font-bold uppercase tracking-widest ${pathname === link.href ? "bg-orange-500/10 text-orange-500" : "text-slate-400"}`}
                >
                  <link.icon size={20} />
                  {link.name}
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