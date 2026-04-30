'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, Home, Compass } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useGameTheme } from '@/src/context/GameThemeContext'
import { GAME_URL_SLUG } from '@/src/components/GameSelector'

export default function NotFoundPage() {
  const t = useTranslations('NotFoundPage')
  const params = useParams()
  const locale = params?.locale || 'en'
  const { activeGame } = useGameTheme()

  const gameSlug = GAME_URL_SLUG[activeGame];
  const discoveryPath = `/${locale}/${gameSlug}`;

  return (
    <div className="min-h-[80vh] bg-[rgb(var(--bg-primary))] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-10">
        {/* Animated Icon Container */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="relative inline-block"
        >
          <div className="absolute inset-0 bg-[rgb(var(--accent-color))] blur-[60px] opacity-20 animate-pulse" />
          <div className="relative p-8 bg-zinc-900/50 border border-white/10 rounded-[2.5rem] backdrop-blur-xl shadow-2xl">
            <AlertTriangle size={64} className="text-[rgb(var(--accent-color))]" />
          </div>
        </motion.div>

        {/* Text Content */}
        <div className="space-y-4">
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white leading-none">
            {t('title')}
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-[320px] mx-auto">
            {t('description')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-4">
          <Link href={`/${locale}`} className="btn-modern w-full flex items-center justify-center gap-3 py-4 bg-[rgb(var(--accent-color))] text-white">
            <Home size={18} />
            <span className="text-[11px] font-black uppercase tracking-widest">{t('home')}</span>
          </Link>

          <Link href={discoveryPath} className="w-full px-8 py-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-3">
            <Compass size={16} />
            {t('discovery')}
          </Link>
        </div>
      </div>
    </div>
  )
}