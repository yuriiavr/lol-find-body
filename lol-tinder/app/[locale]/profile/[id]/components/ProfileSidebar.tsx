'use client'

import { memo, useState, useCallback } from 'react'
import { User, Trophy, MicOff, Sword, Languages, Gamepad, Copy, Check } from 'lucide-react'
import {
  getGameName,
  getTagLine,
  getRegion,
  getRank,
  getRole,
  getExtra,
  getQueues,
  type GameKey,
} from '@/src/lib/profile'

interface ProfileSidebarProps {
  profile: any
  activeGame: 'LOL' | 'TFT' | 'VALORANT' | null
  setActiveGame: (game: 'LOL' | 'TFT' | 'VALORANT') => void
  enabledGamesList: ('LOL' | 'TFT' | 'VALORANT')[]
  riotStats: any
  tftStats: any
  valStats: any
}

export const ProfileSidebar = memo(({
  profile,
  activeGame,
  setActiveGame,
  enabledGamesList,
  riotStats,
  tftStats,
  valStats,
}: ProfileSidebarProps) => {
  const [copied, setCopied] = useState(false)

  const gameKey = (activeGame?.toLowerCase() ?? 'lol') as GameKey

  // Riot ID для відображення — завжди з lol (спільний для lol/tft)
  const displayGameName = getGameName(profile, gameKey)
  const displayTagLine  = getTagLine(profile, gameKey)
  const displayRole     = getRole(profile, gameKey)
  const language        = profile?.language ?? ''

  // Черги для визначення активного RankBox
  const queues = getQueues(profile, gameKey)

  const handleCopy = useCallback(() => {
    const text = `${displayGameName}#${displayTagLine}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [displayGameName, displayTagLine])

  return (
    <section className="w-full lg:w-96 flex flex-col items-center lg:items-start text-center lg:text-left">
      <div className="relative mb-10 group">
        <div className="w-56 h-56 rounded-[2.5rem] bg-[rgb(var(--accent-color))] p-1 shadow-2xl shadow-[rgb(var(--accent-color)/0.2)]">
          <div className="w-full h-full rounded-[2.3rem] bg-zinc-950 flex items-center justify-center overflow-hidden">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} className="w-full h-full object-cover opacity-90" alt="" />
            ) : (
              <User size={120} className="text-slate-800" />
            )}
          </div>
        </div>
        <div className="absolute -bottom-4 -right-4 bg-slate-900 p-4 rounded-2xl border border-white/10 shadow-xl">
          <Trophy size={24} className="text-[rgb(var(--accent-color))]" />
        </div>
        {profile.has_mic === false && (
          <div className="absolute -top-4 -left-4 bg-red-500/10 p-3 rounded-full border border-red-500/30 text-red-500 backdrop-blur-sm shadow-xl shadow-red-900/20">
            <MicOff size={24} />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-3 justify-center lg:justify-start group/name">
          <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
            {displayGameName || profile.display_name}
            {displayTagLine && (
              <span className="text-slate-600 block text-2xl mt-1">#{displayTagLine}</span>
            )}
          </h1>
          {displayGameName && displayTagLine && (
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl cursor-pointer text-zinc-500 hover:text-[rgb(var(--accent-color))] hover:border-[rgb(var(--accent-color)/0.2)] transition-all opacity-0 group-hover/name:opacity-100 mt-2"
              title="Copy Riot ID"
            >
              {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mt-6 justify-center lg:justify-start">
        {displayRole && (
          <div className="px-4 py-2 bg-white/5 rounded-full border border-white/5 text-xs font-bold text-[rgb(var(--accent-color))] uppercase tracking-widest flex items-center gap-2">
            <Sword size={14} /> {displayRole}
          </div>
        )}
        {language && (
          <div className="px-4 py-2 bg-white/5 rounded-full border border-white/5 text-xs font-bold text-[rgb(var(--accent-color))] uppercase tracking-widest flex items-center gap-2">
            <Languages size={14} /> {language.replace(/,/g, ', ')}
          </div>
        )}
      </div>

      {enabledGamesList.length > 1 && (
        <div className="mt-10 w-full flex bg-zinc-950 rounded-2xl p-1 border border-white/5">
          {enabledGamesList.map((game) => (
            <button
              key={game}
              onClick={() => {
                setActiveGame(game)
                localStorage.setItem('lastProfileGame', game)
              }}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeGame === game
                  ? 'bg-[rgb(var(--accent-color))] text-white shadow-lg'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {game === 'LOL' ? 'League' : game}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 w-full space-y-4">
        {activeGame === 'LOL' && (
          <>
            <RankBox
              title="Solo Queue"
              rank={riotStats?.solo || getRank(profile, 'lol')}
              active={queues.includes('Solo/Duo')}
              stats={{
                wins:   riotStats?.solo_wins   ?? getExtra(profile, 'lol', 'solo_wins')   ?? 0,
                losses: riotStats?.solo_losses ?? getExtra(profile, 'lol', 'solo_losses') ?? 0,
              }}
              icon={<Trophy size={12} className="text-[rgb(var(--accent-color))]" />}
              isMain={true}
            />
            <RankBox
              title="Flex Queue"
              rank={riotStats?.flex || getExtra(profile, 'lol', 'flex_rank') || 'Unranked'}
              active={queues.includes('Flex')}
              stats={{
                wins:   riotStats?.flex_wins   ?? getExtra(profile, 'lol', 'flex_wins')   ?? 0,
                losses: riotStats?.flex_losses ?? getExtra(profile, 'lol', 'flex_losses') ?? 0,
              }}
            />
          </>
        )}
        {activeGame === 'TFT' && (
          <RankBox
            title="TFT Ranked"
            rank={tftStats?.rank || getRank(profile, 'tft') || 'Unranked'}
            active={true}
            stats={{
              wins:   tftStats?.wins   ?? getExtra(profile, 'tft', 'wins')   ?? 0,
              losses: tftStats?.losses ?? getExtra(profile, 'tft', 'losses') ?? 0,
            }}
            icon={<Gamepad size={12} className="text-blue-400" />}
            colorClass="text-blue-400"
            isMain={true}
          />
        )}
        {activeGame === 'VALORANT' && (
          <RankBox
            title="Valorant Rank"
            rank={valStats?.rankName || getRank(profile, 'valorant') || 'Unranked'}
            active={true}
            stats={{
              wins:   valStats?.wins   ?? getExtra(profile, 'valorant', 'wins')   ?? 0,
              losses: valStats?.losses ?? getExtra(profile, 'valorant', 'losses') ?? 0,
            }}
            icon={<Trophy size={12} className="text-red-400" />}
            colorClass="text-red-400"
            isMain={true}
          />
        )}
      </div>
    </section>
  )
})

const RankBox = ({
  title,
  rank,
  active,
  stats,
  icon,
  colorClass = "text-zinc-500",
  isMain = false,
}: any) => {
  const winNum  = Number(stats?.wins ?? 0)
  const lossNum = Number(stats?.losses ?? 0)
  const total   = winNum + lossNum
  const winRate = total > 0 ? Math.round((winNum / total) * 100) : 0

  return (
    <div className={`modern-panel p-5 transition-all ${active ? 'bg-[rgb(var(--accent-color)/0.1)] border-[rgb(var(--accent-color)/0.4)]' : 'bg-white/5 opacity-60'}`}>
      <div className="flex justify-between items-center mb-1">
        <span className={`text-[10px] font-black uppercase tracking-widest ${colorClass}`}>{title}</span>
        {icon}
      </div>
      <p className={`${isMain ? 'text-3xl' : 'text-2xl'} font-bold text-white uppercase italic`}>
        {rank || 'Unranked'}
      </p>
      {total > 0 && (
        <div className="flex gap-2 mt-1 text-[10px] font-bold">
          <span className="text-emerald-500">{winRate}% WR</span>
          <span className="text-slate-500">({total} games)</span>
        </div>
      )}
    </div>
  )
}