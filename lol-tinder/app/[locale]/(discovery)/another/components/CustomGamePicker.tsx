"use client";

import React, { useEffect, useRef, useState } from "react";
import { Search, X, Gamepad2, Check } from "lucide-react";
import { useClickOutside } from "@/src/hooks/useClickOutside";

export interface CustomGame {
  game_id: string;
  game_name: string;
  player_count?: number;
}

interface Props {
  selected: CustomGame | null;
  onSelect: (game: CustomGame | null) => void;
}

function toGameId(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function CustomGamePicker({ selected, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomGame[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useClickOutside(ref, () => setOpen(false));

  const fetchGames = async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/games/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data: { game_name: string; player_count: number }[] = await res.json();
        setResults(data.map((g) => ({
          game_id: toGameId(g.game_name),
          game_name: g.game_name,
          player_count: g.player_count,
        })));
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchGames(query), 250);
  }, [query, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (!open) setOpen(true);
  };

  const handleSelect = (game: CustomGame) => {
    onSelect(game);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
        Game
      </label>

      {selected ? (
        <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-md border border-violet-500/30 bg-violet-500/5">
          <div className="flex items-center gap-2 min-w-0">
            <Gamepad2 size={12} className="text-violet-400 shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-violet-200 truncate">
              {selected.game_name}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
            aria-label="Clear selected game"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <div ref={ref} className="relative">
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-md border border-white/[0.06] hover:border-white/[0.12] transition-colors">
            <Search size={11} className="text-zinc-600 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={handleChange}
              onFocus={() => setOpen(true)}
              placeholder="Search games..."
              className="flex-1 bg-transparent text-[11px] font-bold uppercase tracking-wider text-zinc-300 placeholder:text-zinc-600 outline-none"
            />
          </div>

          {open && (
            <div
              className="absolute left-0 top-[calc(100%+6px)] w-full rounded-lg overflow-hidden z-[110] max-h-72 overflow-y-auto"
              style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              {loading && (
                <div className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                  Searching...
                </div>
              )}
              {!loading && results.length === 0 && (
                <div className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                  No games yet
                </div>
              )}
              {!loading &&
                results.map((g) => (
                  <button
                    key={g.game_id}
                    type="button"
                    onClick={() => handleSelect(g)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-200 truncate">
                      {g.game_name}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 shrink-0 ml-2">
                      {g.player_count ?? 0}
                    </span>
                  </button>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
