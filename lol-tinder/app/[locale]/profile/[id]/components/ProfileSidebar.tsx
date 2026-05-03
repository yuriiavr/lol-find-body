'use client'

import { memo, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { User, MicOff, Sword, Languages, Gamepad, Copy, Check, UserPlus } from 'lucide-react'
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
  activeGame: 'LOL' | 'TFT' | 'VALORANT' | 'CS2' | null
  setActiveGame: (game: 'LOL' | 'TFT' | 'VALORANT' | 'CS2') => void
  enabledGamesList: ('LOL' | 'TFT' | 'VALORANT' | 'CS2')[]
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
  const [copiedFriendCode, setCopiedFriendCode] = useState(false)
  const t = useTranslations()

  const gameKey = (activeGame?.toLowerCase() ?? 'lol') as GameKey

  const displayGameName = activeGame === 'CS2'
    ? (profile?.steam_username ?? getGameName(profile, gameKey))
    : getGameName(profile, gameKey)
  const displayTagLine  = activeGame === 'CS2' ? '' : getTagLine(profile, gameKey)
  const displayRole     = getRole(profile, gameKey)
  const language        = profile?.language ?? ''

  const queues = getQueues(profile, gameKey)

  const cs2FriendCode = activeGame === 'CS2'
    ? (profile?.friend_code ?? '')
    : ''

  const handleCopy = useCallback(() => {
    const text = `${displayGameName}#${displayTagLine}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [displayGameName, displayTagLine])

  const handleCopyFriendCode = useCallback(() => {
    if (!cs2FriendCode) return
    navigator.clipboard.writeText(cs2FriendCode)
    setCopiedFriendCode(true)
    setTimeout(() => setCopiedFriendCode(false), 2000)
  }, [cs2FriendCode])

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
            <Sword size={14} /> {t(`Common.roles.${displayRole.toLowerCase()}`)}
          </div>
        )}
        {language && (
          <div className="px-4 py-2 bg-white/5 rounded-full border border-white/5 text-xs font-bold text-[rgb(var(--accent-color))] uppercase tracking-widest flex items-center gap-2">
            <Languages size={14} /> {language.replace(/,/g, ', ')}
          </div>
        )}
      </div>

      {/* ── Ranks ─────────────────────────────────────────────────────── */}
      <div className="mt-10 w-full space-y-4">
        {/* CS2 friend code — big prominent button */}
        {activeGame === 'CS2' && cs2FriendCode && (
          <button
            onClick={handleCopyFriendCode}
            className="w-full flex items-center gap-5 px-6 py-5 rounded-2xl border-2 border-orange-500/50 bg-gradient-to-br from-orange-500/20 to-orange-900/10 hover:from-orange-500/30 hover:border-orange-500/70 transition-all group shadow-lg shadow-orange-900/20"
          >
            <div className="p-3 rounded-xl bg-orange-500/20 border border-orange-500/30 shrink-0">
              <UserPlus size={22} className="text-orange-400" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-1">
                {t('ProfilePage.cs2.friendCode')}
              </p>
              <p className="text-lg font-black text-white font-mono tracking-widest truncate">
                {cs2FriendCode}
              </p>
            </div>
            <div className="shrink-0 p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400/70 group-hover:text-orange-300 group-hover:bg-orange-500/20 transition-all">
              {copiedFriendCode
                ? <Check size={20} className="text-emerald-400" />
                : <Copy size={20} />
              }
            </div>
          </button>
        )}

        {/* LOL */}
        {activeGame === 'LOL' && (
          <>
            <RankBox
              title={t('ProfilePage.ranks.solo')}
              rank={riotStats?.solo || getRank(profile, 'lol')}
              active={queues.includes('Solo/Duo')}
              stats={{
                wins:   riotStats?.solo_wins   ?? getExtra(profile, 'lol', 'solo_wins')   ?? 0,
                losses: riotStats?.solo_losses ?? getExtra(profile, 'lol', 'solo_losses') ?? 0,
              }}
              isMain={true}
            />
            <RankBox
              title={t('ProfilePage.ranks.flex')}
              rank={riotStats?.flex || getExtra(profile, 'lol', 'flex_rank') || t('ProfilePage.ranks.unranked')}
              active={queues.includes('Flex')}
              stats={{
                wins:   riotStats?.flex_wins   ?? getExtra(profile, 'lol', 'flex_wins')   ?? 0,
                losses: riotStats?.flex_losses ?? getExtra(profile, 'lol', 'flex_losses') ?? 0,
              }}
            />
          </>
        )}
        {/* TFT */}
        {activeGame === 'TFT' && (
          <RankBox
            title={t('ProfilePage.ranks.tft')}
            rank={tftStats?.rank || getRank(profile, 'tft') || t('ProfilePage.ranks.unranked')}
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
        {/* VALORANT */}
        {activeGame === 'VALORANT' && (
          <RankBox
            title={t('ProfilePage.ranks.val')}
            rank={valStats?.rankName || getRank(profile, 'valorant') || t('ProfilePage.ranks.unranked')}
            active={true}
            stats={{
              wins:   valStats?.wins   ?? getExtra(profile, 'valorant', 'wins')   ?? 0,
              losses: valStats?.losses ?? getExtra(profile, 'valorant', 'losses') ?? 0,
            }}
            colorClass="text-red-400"
            isMain={true}
          />
        )}
        {/* CS2 rank (without friend code — already shown above) */}
        {activeGame === 'CS2' && (
          <RankBox
            title={t('ProfilePage.ranks.cs2')}
            rank={getRank(profile, 'cs2' as GameKey) || t('ProfilePage.ranks.unranked')}
            active={true}
            stats={null}
            colorClass="text-orange-400"
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
  const t = useTranslations()
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
        {rank || t('ProfilePage.ranks.unranked')}
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