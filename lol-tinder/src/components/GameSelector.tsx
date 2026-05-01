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

export const GAME_URL_SLUG: Record<GameType, string> = {
  lol: "league",
  tft: "tft",
  valorant: "valorant",
};

const ALL_GAMES = Object.keys(GAME_META) as GameType[];
const ALL_GAME_SLUGS = Object.values(GAME_URL_SLUG);

interface GameSelectorProps {
  userId?: string | null;
}

export default function GameSelector({ userId }: GameSelectorProps) {
  const { activeGame, setActiveGame } = useGameTheme();
  const [enabledGames, setEnabledGames] = useState<GameType[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!userId) {
      // Гість — показуємо всі ігри
      setEnabledGames(ALL_GAMES);
      return;
    }

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
        // Якщо масив непорожній — використовуємо його, інакше fallback на всі
        setEnabledGames(normalized.length > 0 ? normalized : ALL_GAMES);
      } else {
        // Немає обраних ігор — показуємо всі
        setEnabledGames(ALL_GAMES);
      }
    };

    fetchGames();
  }, [userId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = GAME_META[activeGame] ?? GAME_META.lol;

  // Якщо enabledGames ще не завантажились — нічого не рендеримо, щоб уникнути flash
  if (enabledGames.length === 0) return null;

  const isSingleGame = enabledGames.length === 1;

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
        onClick={() => !isSingleGame && setIsOpen((v) => !v)}
        className="flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[10px] font-bold uppercase tracking-[1.5px] text-zinc-500 hover:text-zinc-300 transition-colors duration-150 border border-white/[0.06] hover:border-white/[0.12]"
        style={{ cursor: isSingleGame ? "default" : "pointer" }}
      >
        <span style={{ color: "rgb(var(--accent-color))" }}>
          {current.label}
        </span>
        {/* Шеврон приховуємо якщо вибору немає */}
        {!isSingleGame && (
          <ChevronDown
            size={10}
            strokeWidth={2}
            style={{
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.18s",
            }}
          />
        )}
      </button>

      <AnimatePresence>
        {isOpen && !isSingleGame && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-[calc(100%+6px)] rounded-lg overflow-hidden z-[110]"
            style={{
              background: "#0a0a0a",
              border: "1px solid rgba(255,255,255,0.1)",
              minWidth: "160px",
            }}
          >
            {enabledGames.map((game) => (
              <button
                key={game}
                onClick={() => handleGameChange(game)}
                className="w-full px-3 py-2.5 text-[10px] font-bold uppercase tracking-[1.5px] text-left transition-colors flex items-center justify-between"
                style={{
                  color: game === activeGame
                    ? "rgb(var(--accent-color))"
                    : "rgb(113,113,122)",
                }}
              >
                {GAME_META[game]?.label ?? game}
                {game === activeGame && (
                  <span
                    className="w-1 h-1 rounded-full"
                    style={{ background: "rgb(var(--accent-color))" }}
                  />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}