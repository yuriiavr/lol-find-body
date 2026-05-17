"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Gamepad2, BookOpen, BarChart2, Plus, Trash2, Search, X, Eye, EyeOff } from "lucide-react";
import { FormTextArea } from "@/src/components/ui/FormFields";
import { useClickOutside } from "@/src/hooks/useClickOutside";

import type { OtherGameEntry } from '../../actions'
export type { OtherGameEntry }

interface OtherGamesFormProps {
  /** Current list from profile.game_profiles.other */
  entries: OtherGameEntry[];
  onChange: (entries: OtherGameEntry[]) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SKILL_LEVELS = ["Beginner", "Casual", "Intermediate", "Advanced", "Expert"];

const ACCENT = "text-violet-400";
const ACCENT_BG_ON = "bg-violet-500/15 border-violet-500/40 text-violet-300";
const ACCENT_BG_OFF = "bg-white/[0.02] border-white/5 text-zinc-500 hover:border-white/15 hover:text-zinc-300";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toGameId(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  children,
  trailing,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={14} className={ACCENT} />
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">
            {title}
          </span>
        </div>
        {trailing}
      </div>
      {children}
    </div>
  );
}

// ─── Autocomplete game search ─────────────────────────────────────────────────

interface GameSearchProps {
  onSelect: (name: string) => void;
  existingIds: string[];
}

function GameSearch({ onSelect, existingIds }: GameSearchProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{ game_name: string; player_count: number }[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useClickOutside(ref, () => setOpen(false));

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setSuggestions([]); setOpen(false); return; }
    setLoading(true);
    try {
      // Query Supabase custom_games table via API route (or direct client)
      // We use a simple fetch to an API route you'll create: /api/games/search?q=...
      const res = await fetch(`/api/games/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
      }
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
      setOpen(true);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 250);
  };

  const handleSelect = (name: string) => {
    const id = toGameId(name);
    if (existingIds.includes(id)) return;
    onSelect(name);
    setQuery("");
    setSuggestions([]);
    setOpen(false);
  };

  // Whether we show "add custom" option
  const showCustom =
    query.trim().length >= 2 && !suggestions.some((s) => s.game_name.toLowerCase() === query.trim().toLowerCase());

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-3 bg-zinc-950 border border-white/8 rounded-xl px-4 py-3 focus-within:border-violet-500/40 transition-colors">
        <Search size={14} className="text-zinc-600 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => query.trim() && setOpen(true)}
          placeholder="Search or add a game..."
          className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 outline-none"
        />
        {query && (
          <button type="button" onClick={() => { setQuery(""); setSuggestions([]); setOpen(false); }}>
            <X size={13} className="text-zinc-600 hover:text-zinc-400 transition-colors" />
          </button>
        )}
      </div>

      {open && (suggestions.length > 0 || showCustom) && (
        <div className="absolute z-50 mt-2 w-full bg-zinc-950 border border-white/10 rounded-xl overflow-hidden shadow-2xl shadow-black/50">
          {suggestions.map((s) => {
            const alreadyAdded = existingIds.includes(toGameId(s.game_name));
            return (
              <button
                key={s.game_name}
                type="button"
                disabled={alreadyAdded}
                onClick={() => handleSelect(s.game_name)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left border-b border-white/5 last:border-0 transition-colors ${
                  alreadyAdded
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-white/5 cursor-pointer"
                }`}
              >
                <span className="text-sm text-zinc-200 font-medium">{s.game_name}</span>
                <div className="flex items-center gap-3">
                  {alreadyAdded && (
                    <span className="text-[9px] font-black uppercase tracking-widest text-violet-400">added</span>
                  )}
                  <span className="text-[10px] text-zinc-600">
                    {s.player_count > 0 ? `${s.player_count} players` : ""}
                  </span>
                </div>
              </button>
            );
          })}

          {showCustom && (
            <button
              type="button"
              onClick={() => handleSelect(query.trim())}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors cursor-pointer"
            >
              <Plus size={13} className="text-violet-400 shrink-0" />
              <span className="text-sm text-zinc-300">
                Add <span className="text-violet-300 font-bold">"{query.trim()}"</span> as new game
              </span>
            </button>
          )}

          {loading && (
            <div className="px-4 py-3 text-[10px] text-zinc-600 uppercase tracking-widest">
              Searching...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Single game card editor ──────────────────────────────────────────────────

function GameCard({
  entry,
  index,
  onUpdate,
  onRemove,
}: {
  entry: OtherGameEntry;
  index: number;
  onUpdate: (index: number, updated: OtherGameEntry) => void;
  onRemove: (index: number) => void;
}) {
  const set = (field: keyof OtherGameEntry, value: string | boolean) =>
    onUpdate(index, { ...entry, [field]: value });

  const isVisible = entry.visible !== false;

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Gamepad2 size={13} className="text-violet-400" />
          </div>
          <span className="text-sm font-black uppercase italic tracking-tight text-white">
            {entry.game_name}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => set("visible", !isVisible)}
            title={isVisible ? "Visible in discovery — click to hide" : "Hidden — click to show"}
            className={`p-2 rounded-lg transition-all ${
              isVisible
                ? "text-violet-400 hover:bg-violet-500/10"
                : "text-zinc-600 hover:text-zinc-400 hover:bg-white/5"
            }`}
          >
            {isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Skill level */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BarChart2 size={13} className={ACCENT} />
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">
            Skill level
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SKILL_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => set("skill_level", level)}
              className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                entry.skill_level === level ? ACCENT_BG_ON : ACCENT_BG_OFF
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Bio */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen size={13} className={ACCENT} />
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">
            Bio
          </span>
        </div>
        <FormTextArea
          label=""
          name={`other_bio_${entry.game_id}`}
          value={entry.bio}
          onChange={(e) => set("bio", e.target.value)}
          placeholder={`Tell others what you're looking for in ${entry.game_name}...`}
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function OtherGamesForm({ entries, onChange }: OtherGamesFormProps) {
  const existingIds = entries.map((e) => e.game_id);

  const handleAdd = (gameName: string) => {
    const newEntry: OtherGameEntry = {
      game_id: toGameId(gameName),
      game_name: gameName,
      skill_level: "Casual",
      bio: "",
      visible: true,
    };
    onChange([...entries, newEntry]);
  };

  const handleUpdate = (index: number, updated: OtherGameEntry) => {
    const next = [...entries];
    next[index] = updated;
    onChange(next);
  };

  const handleRemove = (index: number) => {
    onChange(entries.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Search / add */}
      <Section icon={Gamepad2} title="Other games">
        <p className="text-[11px] text-zinc-500 leading-relaxed -mt-1">
          Add any game not listed above. Other players will be able to find you by game name.
        </p>
        <GameSearch onSelect={handleAdd} existingIds={existingIds} />
      </Section>

      {/* Game cards */}
      {entries.map((entry, i) => (
        <GameCard
          key={entry.game_id}
          entry={entry}
          index={i}
          onUpdate={handleUpdate}
          onRemove={handleRemove}
        />
      ))}

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-10 text-zinc-700">
          <Gamepad2 size={28} className="opacity-30" />
          <p className="text-[11px] font-bold uppercase tracking-widest opacity-50">
            No other games added yet
          </p>
        </div>
      )}
    </div>
  );
}