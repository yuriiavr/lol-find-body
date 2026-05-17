"use client";

import React from "react";
import { motion } from "framer-motion";
import { User, Trophy, MicOff, Globe, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  getGameName,
  getTagLine,
  getRank,
  getRole,
  getBio,
  getExtra,
  getQueues,
  type GameKey,
} from "@/src/lib/profile";

const RANK_PRIORITY = [
  "CHALLENGER",
  "GRANDMASTER",
  "MASTER",
  "DIAMOND",
  "EMERALD",
  "PLATINUM",
  "GOLD",
  "SILVER",
  "BRONZE",
  "IRON",
  "UNRANKED",
];
const getRankWeight = (r: string | null) => {
  if (!r) return 100;
  const tier = r.split(" ")[0].toUpperCase();
  const idx = RANK_PRIORITY.indexOf(tier);
  return idx === -1 ? 100 : idx;
};

interface DiscoveryPlayerCardProps {
  player: any;
  game: "LOL" | "TFT" | "VALORANT" | "CS2";
  filterQueue?: string;
}

export function DiscoveryPlayerCard({
  player,
  game,
  filterQueue = "ALL",
}: DiscoveryPlayerCardProps) {
  const t = useTranslations("Discovery.card");
  const locale = useLocale();
  const router = useRouter();
  const gameKey = game.toLowerCase() as GameKey;

  const displayName = getGameName(player, gameKey) || player.display_name;
  const tagLine = getTagLine(player, gameKey);
  const bio = getBio(player, gameKey);
  const role = game !== "TFT" ? getRole(player, gameKey) : "";
  const queues = getQueues(player, gameKey);
  const agents =
    game === "VALORANT"
      ? (getExtra(player, "valorant", "agents") || "")
          .split(",")
          .filter(Boolean)
      : [];

  let displayedRank = "UNRANKED";
  let queueLabel = "";

  if (game === "LOL") {
    const soloRank = getRank(player, "lol");
    const flexRank = getExtra(player, "lol", "flex_rank") || "UNRANKED";
    const soloWeight = getRankWeight(soloRank);
    const flexWeight = getRankWeight(flexRank);
    displayedRank = soloRank || "UNRANKED";
    queueLabel = "Solo";
    if (
      filterQueue === "Flex" ||
      (filterQueue === "ALL" && flexWeight < soloWeight)
    ) {
      displayedRank = flexRank;
      queueLabel = "Flex";
    }
  } else if (game === "TFT") {
    displayedRank = getRank(player, "tft") || "UNRANKED";
    queueLabel = "Ranked";
  } else if (game === "VALORANT") {
    displayedRank = getRank(player, "valorant") || "Unranked";
    queueLabel = "Competitive";
  }

  // Winrate (LOL only, shown if >= 55%)
  const winrate =
    game === "LOL" ? parseFloat(getExtra(player, "lol", "winrate") || "0") : 0;
  const showWinrate = game === "LOL" && winrate >= 55;

  const profileUrl =
    game === "TFT"
      ? `/${locale}/profile/${player.id}?game=TFT`
      : game === "VALORANT"
        ? `/${locale}/profile/${player.id}?game=VALORANT`
        : `/${locale}/profile/${player.id}`;

  const langs = player.language
    ? player.language.split(",").filter(Boolean)
    : [];
  const isOnline =
    new Date(player.last_seen).getTime() > Date.now() - 10 * 60 * 1000;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => router.push(profileUrl)}
      className="modern-panel p-6 group flex flex-col h-full cursor-pointer"
      style={{
        transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
      }}
      onMouseEnter={(e) => {
        const accent = getComputedStyle(document.documentElement)
          .getPropertyValue("--accent-color")
          .trim();
        e.currentTarget.style.borderColor = `rgb(${accent} / 0.35)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.03)";
      }}
    >
      {/* Header */}
      <div className="relative flex justify-between items-start mb-4">
        <div className="flex gap-4 overflow-hidden pr-20">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-xl bg-zinc-800 p-[1px] transition-colors discovery-avatar">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center overflow-hidden">
                {player.avatar_url ? (
                  <img
                    src={player.avatar_url}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                ) : (
                  <User size={28} className="text-slate-700" />
                )}
              </div>
            </div>
            {isOnline && (
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-lg shadow-emerald-500/50" />
            )}
            {player.has_mic === false && (
              <div className="absolute -bottom-1 -left-1 text-red-500 bg-[#0a0a0a] rounded-full p-0.5 shadow-lg border border-red-500/20">
                <MicOff size={14} />
              </div>
            )}
          </div>

          {/* Name + rank */}
          <div className="min-w-0 flex flex-col justify-center">
            <h4 className="text-lg font-black transition-colors truncate discovery-name">
              {displayName}
              {tagLine && (
                <span className="text-zinc-600 text-sm font-medium ml-1">
                  #{tagLine}
                </span>
              )}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <Trophy size={12} className="discovery-accent-icon" />
              <span className="text-[10px] font-black uppercase text-zinc-500 tracking-tighter">
                {displayedRank}
              </span>
              <span className="text-zinc-800 text-[10px]">•</span>
              <span className="text-[10px] font-bold uppercase opacity-60 discovery-accent-text">
                {queueLabel}
              </span>
              {showWinrate && (
                <>
                  <span className="text-zinc-800 text-[10px]">•</span>
                  <span className="flex items-center gap-0.5 text-[10px] font-black uppercase tracking-tighter text-emerald-400">
                    <TrendingUp size={10} />
                    {winrate.toFixed(0)}% WR
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Role badge */}
        {role && (
          <div className="absolute top-0 right-0 px-2 py-1 rounded text-[9px] font-black border uppercase tracking-widest discovery-badge">
            {role}
          </div>
        )}
      </div>

      {/* Bio */}
      <div className="flex-1 bg-black/20 rounded-xl p-4 mb-5 border border-white/[0.02] flex flex-col">
        <p className="text-sm text-zinc-400 italic leading-relaxed line-clamp-3">
          {bio || t(`noInfo.${game.toLowerCase()}`)}
        </p>
      </div>

      {/* Tags */}
      <div className="space-y-4">
        {game === "VALORANT" && agents.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {agents.map((agent: string) => (
              <span
                key={agent}
                className="px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter discovery-tag"
              >
                {agent}
              </span>
            ))}
          </div>
        )}
        {queues.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {queues.map((q: string) => (
              <span
                key={q}
                className="px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter discovery-tag-subtle"
              >
                {q}
              </span>
            ))}
          </div>
        )}
        {langs.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {langs.map((l: string) => (
              <span
                key={l}
                className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 border border-white/5 text-[9px] font-bold text-zinc-500"
              >
                <Globe size={10} className="text-zinc-700" /> {l}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
