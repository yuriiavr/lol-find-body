'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Gamepad, Zap } from 'lucide-react';

export default function DiscoveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Derive activeTab from pathname to ensure consistency between server and client during hydration
  const activeTab = pathname.startsWith('/tft') 
    ? 'tft' 
    : pathname.startsWith('/valorant') 
      ? 'valorant' 
      : 'league';

  useEffect(() => {
    localStorage.setItem('lastDiscoveryTab', activeTab);
    const theme = activeTab === 'league' ? 'LOL' : activeTab.toUpperCase();
    localStorage.setItem('site-game-theme', theme);
    document.documentElement.setAttribute('data-game-theme', activeTab === 'league' ? 'lol' : activeTab);
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))] text-slate-50 flex flex-col">
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-6 md:p-10">
        {/* Secondary Navigation for Discovery */}
        <div className="mb-12">
          <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-8 bg-gradient-to-r from-[rgb(var(--accent-color))] to-zinc-700 bg-clip-text text-transparent transition-all duration-500">Discovery</h2>
          
          <div className="flex gap-8 border-b border-white/5">
            <Link 
              href="/league"
              className={`pb-4 text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'league' ? 'text-[rgb(var(--accent-color))] border-b-2 border-[rgb(var(--accent-color))]' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Compass size={14} /> League of Legends
            </Link>
            <Link 
              href="/tft"
              className={`pb-4 text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'tft' ? 'text-[rgb(var(--accent-color))] border-b-2 border-[rgb(var(--accent-color))]' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Gamepad size={14} /> Teamfight Tactics
            </Link>
            <Link 
              href="/valorant"
              className={`pb-4 text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'valorant' ? 'text-[rgb(var(--accent-color))] border-b-2 border-[rgb(var(--accent-color))]' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Zap size={14} /> Valorant
            </Link>
          </div>
        </div>

        {/* Children (League or TFT page content) */}
        {children}
      </main>
    </div>
  );
}