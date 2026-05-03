'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { ExternalLink, Loader2, Check } from 'lucide-react'
import { getBio, getGameName, getTagLine, getRegion, type GameKey } from '@/src/lib/profile'

interface ProfileIntelProps {
  profile: any
  activeGame: 'LOL' | 'TFT' | 'VALORANT' | 'CS2'| null
  topChamps: any[]
  isLoadingChamps?: boolean
  isMatched: boolean
  isRequesting: boolean
  requestSent: boolean
  handleMatch: () => void
}

export const ProfileIntel = memo(({
  profile,
  activeGame,
  topChamps,
  isLoadingChamps = false,
  isMatched,
  isRequesting,
  requestSent,
  handleMatch,
}: ProfileIntelProps) => {
  const t = useTranslations('ProfilePage.intel')
  const gameKey = (activeGame?.toLowerCase() ?? 'lol') as GameKey

  const bio      = getBio(profile, gameKey) || `${t('noBio')}`
  const gameName = getGameName(profile, 'lol')
  const tagLine  = getTagLine(profile, 'lol')
  const region   = getRegion(profile, 'lol')

  const showChampsSection = activeGame === 'LOL' && (isLoadingChamps || topChamps.length > 0)

  return (
    <>
      <style>{`
        @keyframes scan {
          0%   { left: -30%; }
          100% { left: 130%; }
        }
      `}</style>

      <div className="modern-panel p-8 bg-slate-900/20">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-8 border-b border-white/5 pb-4">
          {t('gamerCard')}
        </h3>

        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
            {t('bio')}
          </p>
          <p className="text-2xl text-slate-200 leading-relaxed italic font-medium">{bio}</p>
        </div>

        {showChampsSection && (
          <div className="mt-10 border-t border-white/5 pt-8">
            <div className="flex items-center justify-between mb-6">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {t('topChamps')}
              </p>
              {!isLoadingChamps && gameName && tagLine && (
                <a
                  href={`https://www.op.gg/summoners/${region.toLowerCase()}/${encodeURIComponent(gameName)}-${encodeURIComponent(tagLine)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-[#5383e8] hover:bg-[#4066b8] text-white rounded-lg text-[10px] font-black uppercase transition-all shadow-lg shadow-blue-500/10"
                >
                  <ExternalLink size={12} /> View on OP.GG
                </a>
              )}
            </div>

            {isLoadingChamps ? (
              /* Сканнуюча полоска */
              <div className="relative h-[2px] w-full overflow-hidden rounded-full bg-white/5">
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    width: '30%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgb(var(--accent-color)), transparent)',
                    animation: 'scan 1.2s ease-in-out infinite',
                  }}
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {topChamps.map((champ) => (
                  <div
                    key={champ.id}
                    className="group relative flex flex-col items-center"
                    title={`${champ.name}: ${champ.points.toLocaleString()} pts`}
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-white/10 group-hover:border-[rgb(var(--accent-color)/0.5)] transition-all shadow-lg">
                      <img src={champ.icon} alt={champ.name} />
                    </div>
                    <div className="absolute -bottom-2 bg-zinc-950/90 backdrop-blur-sm text-[rgb(var(--accent-color))] text-[8px] font-black px-2 py-0.5 rounded-full border border-[rgb(var(--accent-color)/0.3)] shadow-sm flex flex-col items-center min-w-[28px]">
                      <span>
                        {new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(champ.points)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="pt-10 flex flex-wrap gap-4">
          {!isMatched && (
            <button
              onClick={handleMatch}
              disabled={isRequesting || requestSent}
              className={`btn-modern px-12 py-5 text-base transition-all ${requestSent ? 'opacity-50 border-emerald-500 text-emerald-400' : ''}`}
            >
              {isRequesting ? <Loader2 className="animate-spin" /> : requestSent ? (
                <span className="flex items-center gap-2">
                  <Check size={20} /> {t('requestSent')}
                </span>
              ) : (
                t('sendTeamRequest')
              )}
            </button>
          )}
        </div>
      </div>
    </>
  )
})