"use client";

import React, { useState, useEffect } from "react";
import { Filter, Gamepad2 } from "lucide-react";
import { createClient } from "@/src/utils/supabase/client";
import { DiscoverySidebar } from "../components/DiscoverySidebar";
import { FilterSelect, LanguageFilter, OnlineToggle } from "../components/DiscoveryFilters";
import { DiscoveryGrid } from "../components/DiscoveryGrid";
import { DiscoveryPagination } from "../components/DiscoveryPagination";
import { useDiscoveryPagination } from "../components/useDiscoveryPagination";
import { useSupabaseAuth } from "@/src/hooks/useSupabaseAuth";
import { useTranslations } from "next-intl";
import { CustomGamePicker, type CustomGame } from "./components/CustomGamePicker";
import { OtherPlayerCard } from "./components/OtherPlayerCard";
import type { OtherGameEntry } from "@/app/[locale]/profile/actions";

const SKILL_LEVELS = ["ALL", "Beginner", "Casual", "Intermediate", "Advanced", "Expert"];

const supabase = createClient();

export default function AnotherDiscoveryPage() {
  const { user, isLoading } = useSupabaseAuth();
  const [game, setGame] = useState<CustomGame | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filterSkill, setFilterSkill] = useState<string>("ALL");
  const [filterLangs, setFilterLangs] = useState<string[]>([]);
  const [onlyOnline, setOnlyOnline] = useState<boolean>(false);
  const t = useTranslations("Discovery");
  const tFilters = useTranslations("LandingPage.discovery.filters");

  const {
    page, setPage, pageSize, setPageSize,
    totalCount, setTotalCount, totalPages,
    rangeFrom, rangeTo,
  } = useDiscoveryPagination();

  useEffect(() => {
    setPage(1);
  }, [game?.game_id, filterSkill, filterLangs, onlyOnline]);

  useEffect(() => {
    let active = true;
    const fetchPlayers = async () => {
      if (isLoading) return;
      if (!game) {
        setPlayers([]);
        setTotalCount(0);
        return;
      }
      setIsFetching(true);

      let query = supabase
        .from("profiles")
        .select(
          "id, display_name, avatar_url, language, last_seen, has_mic, enabled_games, game_profiles",
          { count: "exact" },
        )
        .eq("is_paused", false)
        .contains("game_profiles->other", [{ game_id: game.game_id }]);

      if (user) {
        const { data: existingMatches } = await supabase
          .from("matches")
          .select("user_id, target_id")
          .or(`user_id.eq.${user.id},target_id.eq.${user.id}`);

        const excludedIds = [user.id];
        if (existingMatches) {
          existingMatches.forEach((m) => {
            excludedIds.push(m.user_id === user.id ? m.target_id : m.user_id);
          });
        }
        query = query.not("id", "in", `(${excludedIds.join(",")})`);
      }

      if (filterLangs.length > 0) {
        const orConditions = filterLangs.map((lang) => `language.ilike.%${lang}%`).join(",");
        query = query.or(orConditions);
      }
      if (onlyOnline) {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        query = query.gt("last_seen", tenMinutesAgo);
      }

      const { data, error, count } = await query.range(rangeFrom, rangeTo);
      if (!active) return; // ігноруємо застарілу відповідь

      if (error) {
        setFetchError(error.message);
        setPlayers([]);
        setTotalCount(0);
        setIsFetching(false);
        return;
      }

      // Visibility + skill фільтри застосовуємо на клієнті, бо вони живуть
      // всередині елемента JSONB-масиву (Postgres `.contains` так не вміє).
      const rows = (data as any[]) ?? [];
      const filtered = rows.filter((p) => {
        const others: OtherGameEntry[] = p.game_profiles?.other ?? [];
        const entry = others.find((e) => e.game_id === game.game_id);
        if (!entry) return false;
        if (entry.visible === false) return false;
        if (filterSkill !== "ALL" && entry.skill_level !== filterSkill) return false;
        return true;
      });
      setFetchError(null);
      setPlayers(filtered);

      // Серверний count не враховує клієнтські фільтри, тож не можна довіряти
      // йому напряму. Гарантуємо, що пагінатор НЕ обіцяє сторінок більше, ніж
      // сервер реально може віддати: якщо серверна сторінка повна — може бути
      // ще; якщо ні — це остання сторінка.
      const serverPageWasFull = rows.length === pageSize;
      const safeTotal = serverPageWasFull
        ? Math.max(count ?? 0, rangeFrom + filtered.length + 1)
        : rangeFrom + filtered.length;
      setTotalCount(safeTotal);

      setIsFetching(false);
    };

    fetchPlayers();

    if (user) {
      supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", user.id).then();
    }

    return () => { active = false; };
  }, [user, isLoading, game?.game_id, filterSkill, filterLangs, onlyOnline, page, pageSize]);

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))] text-slate-50">
      <main className="w-full max-w-[1600px] mx-auto p-6 md:p-10">
        <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-8 bg-gradient-to-r from-[rgb(var(--accent-color))] to-zinc-700 bg-clip-text text-transparent">
          {t("title")}
        </h2>
        <div className="flex flex-col lg:flex-row gap-8">
          <DiscoverySidebar title="Other Games" Icon={Filter}>
            <CustomGamePicker selected={game} onSelect={setGame} />

            <FilterSelect
              label="Skill"
              value={filterSkill}
              onChange={setFilterSkill}
              options={SKILL_LEVELS.map((s) => ({
                label: s === "ALL" ? "All Levels" : s,
                value: s,
              }))}
            />

            <LanguageFilter
              selectedLangs={filterLangs}
              onToggle={(lang) =>
                setFilterLangs((prev) =>
                  prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
                )
              }
            />

            <OnlineToggle onlyOnline={onlyOnline} onToggle={() => setOnlyOnline(!onlyOnline)} />
          </DiscoverySidebar>

          <div className="flex-1">
            {!game ? (
              <div className="modern-panel p-16 flex flex-col items-center gap-4 text-zinc-600">
                <Gamepad2 size={48} className="opacity-20" />
                <p className="font-bold uppercase tracking-widest text-sm">
                  Pick a game to find players
                </p>
                <p className="text-[11px] text-zinc-700 max-w-md text-center leading-relaxed">
                  Search for any community-added game from the sidebar. Don't see it? Add it
                  to your profile under "Other games" first.
                </p>
              </div>
            ) : (
              <>
                <DiscoveryGrid
                  isFetching={isFetching}
                  players={players}
                  error={fetchError}
                  emptyMessage={`No players for ${game.game_name} yet`}
                >
                  {players.map((player) => (
                    <OtherPlayerCard key={player.id} player={player} gameId={game.game_id} />
                  ))}
                </DiscoveryGrid>
                <DiscoveryPagination
                  page={page}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalCount={totalCount}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
