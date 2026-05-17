"use client";

import { Gamepad2, BarChart2 } from "lucide-react";
import type { OtherGameEntry } from "@/app/[locale]/profile/actions";

interface Props {
  profile: any;
}

export function OtherGamesShowcase({ profile }: Props) {
  const all: OtherGameEntry[] = profile?.game_profiles?.other ?? [];
  const visible = all.filter((e) => e.visible !== false);

  if (visible.length === 0) return null;

  return (
    <section className="rounded-3xl border border-violet-500/15 bg-gradient-to-br from-violet-500/[0.04] to-transparent p-8">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/[0.06]">
        <Gamepad2 size={16} className="text-violet-400" />
        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-violet-300">
          Other Games
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {visible.map((entry) => (
          <article
            key={entry.game_id}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3"
          >
            <header className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-black uppercase italic tracking-tight text-white truncate">
                {entry.game_name}
              </h4>
              {entry.skill_level && (
                <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-violet-300 bg-violet-500/10 border border-violet-500/20 rounded-full px-2.5 py-1 shrink-0">
                  <BarChart2 size={10} />
                  {entry.skill_level}
                </span>
              )}
            </header>
            {entry.bio?.trim() && (
              <p className="text-[12px] leading-relaxed text-zinc-400 whitespace-pre-wrap break-words">
                {entry.bio}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
