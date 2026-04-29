'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Gamepad, Zap, Users } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useGameTheme } from '@/src/context/GameThemeContext';

export default function RoomsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const t = useTranslations('Rooms');
  const locale = useLocale();
  const { activeGame, setActiveGame } = useGameTheme();
  
  // Перевіряємо, чи ми на сторінці конкретної кімнати
  const isRoomPage = pathname.includes('/room/');

  const activeTab = pathname.includes('/tft') 
    ? 'tft' 
    : pathname.includes('/valorant') 
      ? 'valorant' 
      : 'league';

  useEffect(() => {
    if (isRoomPage) return; // Не змінюємо тему автоматично на сторінці кімнати (там вона береться з даних кімнати)
    setActiveGame(activeTab === 'league' ? 'lol' : activeTab as any);
  }, [activeTab, setActiveGame, isRoomPage]);

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))] text-slate-50 flex flex-col">
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-6 md:p-10">
        {!isRoomPage && (
        <div className="mb-12">
          <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-8 bg-gradient-to-r from-[rgb(var(--accent-color))] to-zinc-700 bg-clip-text text-transparent">
            {t('title')}
          </h2>
          <div className="flex gap-8 border-b border-white/5">
            <Link 
              href={`/${locale}/rooms/league`}
              className={`pb-4 text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeGame === 'lol' ? 'text-[rgb(var(--accent-color))] border-b-2 border-[rgb(var(--accent-color))]' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              League of Legends
            </Link>
            <Link 
              href={`/${locale}/rooms/tft`}
              className={`pb-4 text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'tft' ? 'text-[rgb(var(--accent-color))] border-b-2 border-[rgb(var(--accent-color))]' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Gamepad size={14} /> TFT
            </Link>
            <Link 
              href={`/${locale}/rooms/valorant`}
              className={`pb-4 text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'valorant' ? 'text-[rgb(var(--accent-color))] border-b-2 border-[rgb(var(--accent-color))]' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Zap size={14} /> Valorant
            </Link>
          </div>
        </div>
        )}
        {children}
      </main>
    </div>
  );
}
