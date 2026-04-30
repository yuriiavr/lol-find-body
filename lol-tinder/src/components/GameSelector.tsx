"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/src/utils/supabase/client";
import { useGameTheme, GameType } from "@/src/context/GameThemeContext";

const supabase = createClient();

const GAME_META: Record<string, { label: string; shortLabel: string }> = {
  lol:      { label: "League of Legends", shortLabel: "LoL" },
  tft:      { label: "Teamfight Tactics",  shortLabel: "TFT" },
  valorant: { label: "Valorant",           shortLabel: "VAL" },
};

// Маппінг GameType → URL slug
export const GAME_URL_SLUG: Record<GameType, string> = {
  lol: "league",
  tft: "tft",
  valorant: "valorant",
};

// Всі можливі URL slugи ігор (для пошуку в pathname)
const ALL_GAME_SLUGS = Object.values(GAME_URL_SLUG);

interface GameSelectorProps {
  userId: string;
}

export default function GameSelector({ userId }: GameSelectorProps) {
  const { activeGame, setActiveGame } = useGameTheme();
  const [enabledGames, setEnabledGames] = useState<GameType[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Fetch enabled_games for the current user
  useEffect(() => {
    if (!userId) return;
    const fetchGames = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("enabled_games")
        .eq("id", userId)
        .single();

      if (data?.enabled_games) {
        const normalized = (data.enabled_games as string)
          .split(",")
          .map((g: string) => g.toLowerCase() as GameType);
        setEnabledGames(normalized);
      }
    };
    fetchGames();
  }, [userId]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Don't render if 0 or 1 game — nothing to switch
  if (enabledGames.length <= 1) return null;

  const current = GAME_META[activeGame] ?? GAME_META.lol;

  const handleGameChange = (game: GameType) => {
    setActiveGame(game);
    setIsOpen(false);

    const segments = pathname.split("/");
    const gameSegmentIndex = segments.findIndex((seg) =>
      ALL_GAME_SLUGS.includes(seg)
    );

    if (gameSegmentIndex !== -1) {
      segments[gameSegmentIndex] = GAME_URL_SLUG[game];
      router.push(segments.join("/"));
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-3 py-1.5 text-slate-400 hover:text-white transition-all group hover:bg-white/10"
      >
        <span className="text-[rgb(var(--accent-color))] text-[10px] font-black uppercase tracking-widest">
          {current.shortLabel}
        </span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-44 bg-[#111111] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-[110]"
          >
            {enabledGames.map((game) => (
              <button
                key={game}
                onClick={() => handleGameChange(game)}
                className={`w-full px-4 py-2.5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest transition-colors ${
                  game === activeGame
                    ? "text-[rgb(var(--accent-color))] bg-[rgb(var(--accent-color)/0.05)]"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {GAME_META[game]?.label ?? game}
                {game === activeGame && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--accent-color))] shadow-[0_0_8px_rgb(var(--accent-color))]" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}