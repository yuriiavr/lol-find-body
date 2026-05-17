"use client";

import React from "react";
import { motion } from "framer-motion";
import { User, MicOff, Globe, BarChart2, Gamepad2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import type { OtherGameEntry } from "@/app/[locale]/profile/actions";

interface Props {
  player: any;
  gameId: string;
}

export function OtherPlayerCard({ player, gameId }: Props) {
  const locale = useLocale();
  const router = useRouter();

  const others: OtherGameEntry[] = player?.game_profiles?.other ?? [];
  const entry = others.find((e) => e.game_id === gameId);
  if (!entry) return null;

  const langs: string[] = player.language ? player.language.split(",").filter(Boolean) : [];
  const isOnline = new Date(player.last_seen).getTime() > Date.now() - 10 * 60 * 1000;

  const profileUrl = `/${locale}/profile/${player.id}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => router.push(profileUrl)}
      className="modern-panel p-6 group flex flex-col h-full cursor-pointer"
      style={{ transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgb(167 139 250 / 0.35)";
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
            <div className="w-14 h-14 rounded-xl bg-zinc-800 p-[1px]">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center overflow-hidden">
                {player.avatar_url ? (
                  <img src={player.avatar_url} className="w-full h-full object-cover" alt="" />
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

          {/* Name + game */}
          <div className="min-w-0 flex flex-col justify-center">
            <h4 className="text-lg font-black truncate text-white">
              {player.display_name || "Player"}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <Gamepad2 size={12} className="text-violet-400" />
              <span className="text-[10px] font-black uppercase text-zinc-500 tracking-tighter truncate">
                {entry.game_name}
              </span>
            </div>
          </div>
        </div>

        {/* Skill badge */}
        {entry.skill_level && (
          <div className="absolute top-0 right-0 flex items-center gap-1 px-2 py-1 rounded text-[9px] font-black border uppercase tracking-widest bg-violet-500/10 border-violet-500/30 text-violet-300">
            <BarChart2 size={9} />
            {entry.skill_level}
          </div>
        )}
      </div>

      {/* Bio */}
      <div className="flex-1 bg-black/20 rounded-xl p-4 mb-5 border border-white/[0.02] flex flex-col">
        <p className="text-sm text-zinc-400 italic leading-relaxed line-clamp-3">
          {entry.bio?.trim() || "No information added."}
        </p>
      </div>

      {/* Languages */}
      {langs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {langs.map((l) => (
            <span
              key={l}
              className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 border border-white/5 text-[9px] font-bold text-zinc-500"
            >
              <Globe size={10} className="text-zinc-700" /> {l}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}
