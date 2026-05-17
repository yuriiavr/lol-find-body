"use client";

import React, { useState, useEffect } from "react";
import { Filter } from "lucide-react";
import { createClient } from "@/src/utils/supabase/client";
import { DiscoverySidebar } from "../components/DiscoverySidebar";
import { FilterSelect, LanguageFilter, OnlineToggle } from "../components/DiscoveryFilters";
import { DiscoveryPlayerCard } from "../components/DiscoveryPlayerCard";
import { DiscoveryGrid } from "../components/DiscoveryGrid";
import { DiscoveryPagination } from "../components/DiscoveryPagination";
import { useDiscoveryPagination } from "../components/useDiscoveryPagination";
import { useSupabaseAuth } from "@/src/hooks/useSupabaseAuth";
import { CS2_DISCOVERY_RANKS } from "@/src/constants/ranks";
import { CS2_REGIONS } from "@/src/constants/regions";
import { useTranslations } from "next-intl";

const supabase = createClient();

export default function CS2DiscoveryPage() {
  const { user, isLoading } = useSupabaseAuth();
  const [players, setPlayers] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [filterRegion, setFilterRegion] = useState<string>("EU");
  const [filterRank, setFilterRank] = useState<string>("ALL");
  const [filterLangs, setFilterLangs] = useState<string[]>([]);
  const [onlyOnline, setOnlyOnline] = useState<boolean>(false);
  const {
    page, setPage, pageSize, setPageSize,
    totalCount, setTotalCount, totalPages,
    rangeFrom, rangeTo,
  } = useDiscoveryPagination();
  const t = useTranslations("Discovery");
  const tFilters = useTranslations("LandingPage.discovery.filters");

  useEffect(() => {
    setPage(1);
  }, [filterRegion, filterRank, filterLangs, onlyOnline]);

  useEffect(() => {
    const fetchPlayers = async () => {
      if (isLoading) return;
      setIsFetching(true);

      let query = supabase
        .from("profiles")
        .select("id, display_name, avatar_url, language, last_seen, enabled_games, game_profiles", { count: "exact" })
        .eq("is_paused", false)
        .ilike("enabled_games", "%CS2%")
        .filter("game_profiles->cs2->>region", "eq", filterRegion);

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

      if (filterRank !== "ALL") {
        query = query.filter("game_profiles->cs2->>rank", "ilike", `%${filterRank}%`);
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
      if (!error && data) {
        setPlayers(data);
        setTotalCount(count ?? 0);
      }
      setIsFetching(false);
    };

    fetchPlayers();
  }, [user, isLoading, filterRegion, filterRank, filterLangs, onlyOnline, page, pageSize]);

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))] text-slate-50">
      <main className="w-full max-w-[1600px] mx-auto p-6 md:p-10">
        <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-8 bg-gradient-to-r from-[rgb(var(--accent-color))] to-zinc-700 bg-clip-text text-transparent">
          {t("title")}
        </h2>
        <div className="flex flex-col lg:flex-row gap-8">
          <DiscoverySidebar title="CS2 Filters" Icon={Filter} accentColor="orange">
            <FilterSelect
              label="Region"
              value={filterRegion}
              onChange={setFilterRegion}
              accentColor="orange"
              options={CS2_REGIONS}
            />
            <FilterSelect
              label={tFilters("rank.label")}
              value={filterRank}
              onChange={setFilterRank}
              accentColor="orange"
              options={CS2_DISCOVERY_RANKS.map((r) => ({
                label: r === "ALL" ? "All Ranks" : r,
                value: r,
              }))}
            />
            <LanguageFilter
              selectedLangs={filterLangs}
              onToggle={(lang) =>
                setFilterLangs((prev) =>
                  prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
                )
              }
              accentColor="orange"
            />
            <OnlineToggle
              onlyOnline={onlyOnline}
              onToggle={() => setOnlyOnline(!onlyOnline)}
              accentColor="orange"
            />
          </DiscoverySidebar>

          <div className="flex-1">
            <DiscoveryGrid isFetching={isFetching} players={players} accentColor="orange" emptyMessage="No players found in this sector">
              {players.map((player) => (
                <DiscoveryPlayerCard key={player.id} player={player} game="CS2" accentColor="orange" />
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
          </div>
        </div>
      </main>
    </div>
  );
}