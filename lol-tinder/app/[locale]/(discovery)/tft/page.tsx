"use client";

import React, { useState, useEffect } from "react";
import { Gamepad } from "lucide-react";
import { createClient } from "@/src/utils/supabase/client";
import { DiscoverySidebar } from "../components/DiscoverySidebar";
import { FilterSelect, LanguageFilter, OnlineToggle } from "../components/DiscoveryFilters";
import { DiscoveryPlayerCard } from "../components/DiscoveryPlayerCard";
import { DiscoveryGrid } from "../components/DiscoveryGrid";
import { DiscoveryPagination } from "../components/DiscoveryPagination";
import { useDiscoveryPagination } from "../components/useDiscoveryPagination";
import { useSupabaseAuth } from "@/src/hooks/useSupabaseAuth";
import { TFT_QUEUES as AVAILABLE_QUEUES } from "@/src/constants/queues";
import { LOL_DISCOVERY_REGIONS } from "@/src/constants/regions";
import { useTranslations } from "next-intl";

const supabase = createClient();

export default function TFTDiscoveryPage() {
  const { user, isLoading } = useSupabaseAuth();
  const [players, setPlayers] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filterRegion, setFilterRegion] = useState<string>("EUW");
  const [filterRank, setFilterRank] = useState<string>("ALL");
  const [filterLangs, setFilterLangs] = useState<string[]>([]);
  const [filterQueue, setFilterQueue] = useState<string>("ALL");
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
  }, [filterRegion, filterRank, filterLangs, filterQueue, onlyOnline]);

  useEffect(() => {
    let active = true;
    const fetchPlayers = async () => {
      if (isLoading) return;
      setIsFetching(true);

      let query = supabase
        .from("profiles")
        .select("id, display_name, avatar_url, language, last_seen, visible_games, game_profiles", { count: "exact" })
        .eq("is_paused", false)
        .ilike("visible_games", "%TFT%")
        .filter("game_profiles->tft->>region", "eq", filterRegion);

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
        if (filterRank === "MASTER") {
          // «Master+» = Master / Grandmaster / Challenger (apex-тіри без дивізіону).
          query = query.or(
            "game_profiles->tft->>rank.ilike.MASTER%,game_profiles->tft->>rank.ilike.GRANDMASTER%,game_profiles->tft->>rank.ilike.CHALLENGER%"
          );
        } else {
          query = query.filter("game_profiles->tft->>rank", "ilike", `${filterRank}%`);
        }
      }

      if (filterQueue !== "ALL") {
        query = query.filter("game_profiles->tft->>queues", "ilike", `%${filterQueue}%`);
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
      if (!active) return;
      if (error) {
        setFetchError(error.message);
        setPlayers([]);
        setTotalCount(0);
      } else {
        setFetchError(null);
        setPlayers(data ?? []);
        setTotalCount(count ?? 0);
      }
      setIsFetching(false);
    };

    fetchPlayers();
    return () => { active = false; };
  }, [user, isLoading, filterRegion, filterRank, filterLangs, filterQueue, onlyOnline, page, pageSize]);

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))] text-slate-50">
      <main className="w-full max-w-[1600px] mx-auto p-6 md:p-10">
        <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-8 bg-gradient-to-r from-[rgb(var(--accent-color))] to-zinc-700 bg-clip-text text-transparent">
          {t("title")}
        </h2>
        <div className="flex flex-col lg:flex-row gap-8">
          <DiscoverySidebar title={t("tabs.tft")} Icon={Gamepad}>
            <FilterSelect
              label={tFilters("region.label")}
              value={filterRegion}
              onChange={setFilterRegion}
              options={LOL_DISCOVERY_REGIONS}
            />
            <FilterSelect
              label={tFilters("rank.label")}
              value={filterRank}
              onChange={setFilterRank}
              options={[
                { label: tFilters("rank.value"), value: "ALL" },
                { label: "Master+", value: "MASTER" },
                { label: "Diamond", value: "DIAMOND" },
                { label: "Platinum", value: "PLATINUM" },
                { label: "Gold", value: "GOLD" },
              ]}
            />
            <FilterSelect
              label={tFilters("queue.label")}
              value={filterQueue}
              onChange={setFilterQueue}
              options={[
                { label: tFilters("queue.value"), value: "ALL" },
                ...AVAILABLE_QUEUES.map((q) => ({ label: q.toUpperCase(), value: q })),
              ]}
            />
            <LanguageFilter
              selectedLangs={filterLangs}
              onToggle={(lang) =>
                setFilterLangs((prev) =>
                  prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
                )
              }
            />
            <OnlineToggle
              onlyOnline={onlyOnline}
              onToggle={() => setOnlyOnline(!onlyOnline)}
            />
          </DiscoverySidebar>

          <div className="flex-1">
            <DiscoveryGrid isFetching={isFetching} players={players} error={fetchError} emptyMessage="No tacticians found">
              {players.map((player) => (
                <DiscoveryPlayerCard key={player.id} player={player} game="TFT" />
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
