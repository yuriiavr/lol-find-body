'use client';

import React from "react";
import { motion } from "framer-motion";
import { User, Trophy, MicOff, Globe } from "lucide-react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";

const RANK_PRIORITY = ['CHALLENGER', 'GRANDMASTER', 'MASTER', 'DIAMOND', 'EMERALD', 'PLATINUM', 'GOLD', 'SILVER', 'BRONZE', 'IRON', 'UNRANKED'];
const getRankWeight = (r: string | null) => {
  if (!r) return 100;
  const tier = r.split(' ')[0].toUpperCase();
  const idx = RANK_PRIORITY.indexOf(tier);
  return idx === -1 ? 100 : idx;
};

interface DiscoveryPlayerCardProps {
  player: any;
  game: 'LOL' | 'TFT' | 'VALORANT';
  accentColor: 'orange' | 'blue' | 'red';
  filterQueue?: string;
}

export function DiscoveryPlayerCard({ player, game, accentColor, filterQueue = 'ALL' }: DiscoveryPlayerCardProps) {
  const t = useTranslations('Discovery.card');
  const locale = useLocale();

  const borderColors = { 
    orange: 'hover:border-orange-500/20', 
    blue: 'border-blue-500/10', 
    red: 'border-red-500/5 hover:border-red-500/20' 
  };
  // Вказуємо повні назви класів для коректної роботи Tailwind JIT
  const textColors = { 
    orange: 'text-orange-400 group-hover:text-orange-400', 
    blue: 'text-blue-400 group-hover:text-blue-400', 
    red: 'text-red-400 group-hover:text-red-400' 
  };
  const iconColors = {
    orange: 'text-orange-400',
    blue: 'text-blue-400',
    red: 'text-red-400'
  };
  const avatarHover = { orange: 'group-hover/avatar:bg-orange-500/50', blue: 'group-hover:bg-blue-500/50', red: 'group-hover/avatar:bg-red-500/50' };

  let displayedRank = 'UNRANKED';
  let queueLabel = '';
  let displayName = player.display_name || player.game_name;
  let role = '';
  let bio = player.bio;
  let profileUrl = `/${locale}/profile/${player.id}`;
  let winRate = null;

  if (game === 'LOL') {
    const soloWeight = getRankWeight(player.solo_rank);
    const flexWeight = getRankWeight(player.flex_rank);
    displayedRank = player.solo_rank || 'UNRANKED';
    queueLabel = 'Solo';
    if (filterQueue === 'Flex' || (filterQueue === 'ALL' && flexWeight < soloWeight)) {
      displayedRank = player.flex_rank || 'UNRANKED';
      queueLabel = 'Flex';
    }
    role = player.main_role;
  } else if (game === 'TFT') {
    displayedRank = player.tft_rank || 'UNRANKED';
    queueLabel = 'Ranked';
    profileUrl = `/${locale}/profile/${player.id}?game=TFT`;
  } else if (game === 'VALORANT') {
    displayName = player.val_game_name || player.game_name;
    displayedRank = player.val_rank || 'Unranked';
    queueLabel = 'Competitive';
    role = player.val_main_role || 'AGENT';
    bio = player.val_bio || player.bio;
    profileUrl = `/${locale}/profile/${player.id}?game=VALORANT`;
    if (player.val_wins > 0) winRate = Math.round((player.val_wins / (player.val_wins + player.val_losses)) * 100);
  }

  const langs = player.language ? player.language.split(',').filter(Boolean) : [];
  const queueField = game === 'LOL' ? 'preferred_queue' : game === 'TFT' ? 'tft_preferred_queue' : 'val_preferred_queue';
  const queues = player[queueField] ? player[queueField].split(',').filter(Boolean) : [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`modern-panel p-6 group flex flex-col h-full transition-all ${borderColors[accentColor]}`}
    >
      <div className="relative flex justify-between items-start mb-4">
        <div className="flex gap-4 overflow-hidden pr-20">
          <div className="relative flex-shrink-0 group/avatar">
            <div className={`w-14 h-14 rounded-xl bg-zinc-800 p-[1px] transition-colors ${avatarHover[accentColor]}`}>
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center overflow-hidden">
                {player.avatar_url ? <img src={player.avatar_url} className="w-full h-full object-cover" alt="" /> : <User size={28} className="text-slate-700" />}
              </div>
            </div>
            {new Date(player.last_seen).getTime() > Date.now() - 10 * 60 * 1000 && (
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-lg shadow-emerald-500/50" />
            )}
            {player.has_mic === false && (
              <div className="absolute -bottom-1 -left-1 text-red-500 bg-[#0a0a0a] rounded-full p-0.5 shadow-lg border border-red-500/20"><MicOff size={14} /></div>
            )}
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            <h4 className={`text-lg font-black text-white ${textColors[accentColor]} transition-colors truncate`}>
              {displayName}
              {player.tag_line && <span className="text-zinc-600 text-sm font-medium ml-1">#{player.tag_line}</span>}
            </h4>
            <div className="flex flex-col mt-0.5">
              <div className="flex items-center gap-1.5">
                <Trophy size={12} className={iconColors[accentColor]} />
                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-tighter">{displayedRank}</span>
                <span className="text-zinc-800 text-[10px]">•</span>
                <span className={`text-[10px] font-bold uppercase opacity-60 ${iconColors[accentColor]}`}>{queueLabel}</span>
              </div>
              {winRate !== null && <div className="text-[10px] font-bold text-emerald-500 mt-0.5">{winRate}% WR</div>}
            </div>
          </div>
        </div>
        {role && (
          <div className={`absolute top-0 right-0 ${accentColor === 'orange' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : accentColor === 'red' ? 'bg-red-500/10 text-red-400 border-red-500/20' : ''} px-2 py-1 rounded text-[9px] font-black border uppercase tracking-widest`}>
            {role}
          </div>
        )}
      </div>

      <div className="flex-1 bg-black/20 rounded-xl p-4 mb-5 border border-white/[0.02] flex flex-col">
        <p className="text-sm text-zinc-400 italic leading-relaxed line-clamp-3">
          {bio || t(`noInfo.${game.toLowerCase()}`)}
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {queues.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {queues.map((q: string) => (
              <span key={q} className={`px-2 py-1 rounded ${accentColor === 'orange' ? 'bg-orange-500/5 border-orange-500/10 text-orange-400/70' : accentColor === 'blue' ? 'bg-blue-500/5 border-blue-500/10 text-blue-400/70' : 'bg-red-500/5 border-red-500/10 text-red-400/70'} text-[9px] font-black uppercase tracking-tighter`}>
                {q}
              </span>
            ))}
          </div>
        )}
        {langs.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {langs.map((l: string) => (
              <span key={l} className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 border border-white/5 text-[9px] font-bold text-zinc-500">
                <Globe size={10} className="text-zinc-700" /> {l}
              </span>
            ))}
          </div>
        )}
      </div>

      <Link href={profileUrl} className="w-full">
        <button className={`btn-modern w-full text-[10px] font-black uppercase tracking-widest py-3 hover:${accentColor === 'orange' ? 'bg-orange-500/5' : accentColor === 'blue' ? 'bg-blue-500/10' : 'bg-red-600/20'} transition-all ${accentColor === 'blue' ? 'border-blue-500/20' : accentColor === 'red' ? 'bg-red-600/10 border-red-600/20 text-red-400' : ''}`}>
          {t(game === 'TFT' ? 'viewTactician' : game === 'VALORANT' ? 'viewAgent' : 'viewProfile')}
        </button>
      </Link>
    </motion.div>
  );
}