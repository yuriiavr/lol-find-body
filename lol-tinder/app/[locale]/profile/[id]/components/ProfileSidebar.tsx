'use client'

import { memo, useState, useCallback } from 'react'
import { User, Trophy, MicOff, ShieldCheck, Sword, Languages, Star, Gamepad, Copy, Check } from 'lucide-react'
import { StarRating } from '@/src/components/StarRating'

interface ProfileSidebarProps {
  profile: any
  activeGame: 'LOL' | 'TFT' | 'VALORANT' | null
  setActiveGame: (game: 'LOL' | 'TFT' | 'VALORANT') => void
  enabledGamesList: ('LOL' | 'TFT' | 'VALORANT')[]
  riotStats: any
  tftStats: any
  valStats: any
  // avgBehavior: number
  // avgSkill: number
  // totalReviews: number
}

export const ProfileSidebar = memo(({
  profile,
  activeGame,
  setActiveGame,
  enabledGamesList,
  riotStats,
  tftStats,
  valStats,
  // avgBehavior,
  // avgSkill,
  // totalReviews
}: ProfileSidebarProps) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    const text = `${profile.game_name}#${profile.tag_line}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [profile.game_name, profile.tag_line])

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
            {profile.game_name}
            <span className="text-slate-600 block text-2xl mt-1">#{profile.tag_line}</span>
          </h1>
          <button 
            onClick={handleCopy}
            className="p-2 rounded-xl cursor-pointer text-zinc-500 hover:text-[rgb(var(--accent-color))] hover:border-[rgb(var(--accent-color)/0.2)] transition-all opacity-0 group-hover/name:opacity-100 mt-2"
            title="Copy Riot ID"
          >
            {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
          </button>
        </div>

        {/* {totalAvg > 4.5 && totalReviews >= 1 && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[rgb(var(--accent-color)/0.1)] border border-[rgb(var(--accent-color)/0.2)] rounded-full w-fit mx-auto lg:mx-0 mt-4">
            <ShieldCheck size={14} className="text-[rgb(var(--accent-color))]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[rgb(var(--accent-color))]">Verified Teammate</span>
          </div>
        )} */}
      </div>

      <div className="flex flex-wrap gap-4 mt-6 justify-center lg:justify-start">
        <div className="px-4 py-2 bg-white/5 rounded-full border border-white/5 text-xs font-bold text-[rgb(var(--accent-color))] uppercase tracking-widest flex items-center gap-2">
          <Sword size={14} /> {activeGame === 'LOL' ? profile.main_role : activeGame === 'TFT' ? profile.tft_main_role : profile.val_main_role}
        </div>
        {profile.language && (
          <div className="px-4 py-2 bg-white/5 rounded-full border border-white/5 text-xs font-bold text-[rgb(var(--accent-color))] uppercase tracking-widest flex items-center gap-2">
            <Languages size={14} /> {profile.language.replace(/,/g, ', ')}
          </div>
        )}
      </div>

      {/* {totalReviews > 0 && (
        <div className="mt-10 w-full flex flex-col gap-2">
          <div className="flex items-center justify-between bg-zinc-900/40 px-5 py-4 rounded-2xl border border-white/5">
            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Behavior</span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-[rgb(var(--accent-color))] leading-none">{avgBehavior.toFixed(1)}</span>
              <StarRating rating={avgBehavior} size={12} />
            </div>
          </div>
          <div className="flex items-center justify-between bg-zinc-900/40 px-5 py-4 rounded-2xl border border-white/5">
            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Skill</span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-[rgb(var(--accent-color))] leading-none">{avgSkill.toFixed(1)}</span>
              <StarRating rating={avgSkill} size={12} />
            </div>
          </div>
        </div>
      )} */}

      {enabledGamesList.length > 1 && (
        <div className="mt-10 w-full flex bg-zinc-950 rounded-2xl p-1 border border-white/5">
          {enabledGamesList.map((game) => (
            <button
              key={game}
              onClick={() => {
                setActiveGame(game)
                localStorage.setItem('lastProfileGame', game)
              }}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeGame === game ? 'bg-[rgb(var(--accent-color))] text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
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
              rank={riotStats?.solo || profile.solo_rank}
              active={profile.preferred_queue?.includes('Solo/Duo')}
            stats={{
              wins: riotStats?.solo_wins ?? profile.solo_wins,
              losses: riotStats?.solo_losses ?? profile.solo_losses,
            }}
              icon={<Star size={12} className="text-[rgb(var(--accent-color))]" />}
            isMain={true}
            />
            <RankBox
              title="Flex Queue"
              rank={riotStats?.flex || profile.flex_rank}
              active={profile.preferred_queue?.includes('Flex')}
            stats={{
              wins: riotStats?.flex_wins ?? profile.flex_wins,
              losses: riotStats?.flex_losses ?? profile.flex_losses,
            }}
            />
          </>
        )}
        {activeGame === 'TFT' && (
          <RankBox 
            title="TFT Ranked" 
            rank={tftStats?.rank || profile.tft_rank || 'Unranked'} 
            active={true} 
            stats={{ 
              wins: tftStats?.wins ?? profile.tft_wins, 
              losses: tftStats?.losses ?? profile.tft_losses 
            }}
            icon={<Gamepad size={12} className="text-blue-400" />}
            colorClass="text-blue-400"
            isMain={true}
          />
        )}
        {activeGame === 'VALORANT' && (
          <RankBox 
            title="Valorant Rank" 
            rank={valStats?.rankName || profile.val_rank || 'Unranked'} 
            active={true} 
            stats={{ 
              wins: valStats?.wins ?? profile.val_wins, 
              losses: valStats?.losses ?? profile.val_losses 
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

const RankBox = ({ title, rank, active, stats, icon, colorClass = "text-zinc-500", isMain = false }: any) => {
  const winNum = Number(stats?.wins ?? 0)
  const lossNum = Number(stats?.losses ?? 0)
  const total = winNum + lossNum
  const winRate = total > 0 ? Math.round((winNum / total) * 100) : 0

  return (
    <div className={`modern-panel p-5 transition-all ${active ? 'bg-[rgb(var(--accent-color)/0.1)] border-[rgb(var(--accent-color)/0.4)]' : 'bg-white/5 opacity-60'}`}>
      <div className="flex justify-between items-center mb-1">
        <span className={`text-[10px] font-black uppercase tracking-widest ${colorClass}`}>{title}</span>
        {icon}
      </div>
      <p className={`${isMain ? 'text-3xl' : 'text-2xl'} font-bold text-white uppercase italic`}>{rank || 'Unranked'}</p>
      {total > 0 && (
        <div className="flex gap-2 mt-1 text-[10px] font-bold">
          <span className="text-emerald-500">{winRate}% WR</span>
          <span className="text-slate-500">({total} games)</span>
        </div>
      )}
    </div>
  )
}