'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Gamepad } from 'lucide-react';

export default function DiscoveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<'league' | 'tft'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('lastDiscoveryTab') as 'league' | 'tft') || 'league';
    }
    return 'league';
  });

  useEffect(() => {
    if (pathname.startsWith('/league')) {
      setActiveTab('league');
      localStorage.setItem('lastDiscoveryTab', 'league');
    } else if (pathname.startsWith('/tft')) {
      setActiveTab('tft');
      localStorage.setItem('lastDiscoveryTab', 'tft');
    }
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-50 flex flex-col">
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-6 md:p-10">
        {/* Secondary Navigation for Discovery */}
        <div className="mb-12">
          <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-8 bg-gradient-to-r from-orange-500 to-zinc-700 bg-clip-text text-transparent">Discovery</h2>
          
          <div className="flex gap-8 border-b border-white/5">
            <Link href="/league">
              <button
                className={`pb-4 text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'league' ? 'text-orange-400 border-b-2 border-orange-500' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <Compass size={14} /> League of Legends
              </button>
            </Link>
            <Link href="/tft">
              <button
                className={`pb-4 text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'tft' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <Gamepad size={14} /> Teamfight Tactics
              </button>
            </Link>
          </div>
        </div>

        {/* Children (League or TFT page content) */}
        {children}
      </main>
    </div>
  );
}