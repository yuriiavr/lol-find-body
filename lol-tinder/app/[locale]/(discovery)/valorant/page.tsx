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
import { VALORANT_DISCOVERY_RANKS } from "@/src/constants/ranks";
import { VALORANT_DISCOVERY_REGIONS } from "@/src/constants/regions";
import { useTranslations } from "next-intl";

const supabase = createClient();

export default function ValorantDiscoveryPage() {
  const { user, isLoading } = useSupabaseAuth();
  const [players, setPlayers] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filterRegion, setFilterRegion] = useState<string>("EUW");
  const [filterRole, setFilterRole] = useState<string>("ALL");
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
  }, [filterRegion, filterRole, filterRank, filterLangs, onlyOnline]);

  useEffect(() => {
    let active = true;
    const fetchPlayers = async () => {
      if (isLoading) return;
      setIsFetching(true);

      let query = supabase
        .from("profiles")
        .select("id, display_name, avatar_url, language, last_seen, visible_games, game_profiles", { count: "exact" })
        .eq("is_paused", false)
        .ilike("visible_games", "%VALORANT%")
        .filter("game_profiles->valorant->>region", "eq", filterRegion);

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

      if (filterRole !== "ALL") {
        query = query.filter("game_profiles->valorant->>role", "eq", filterRole);
      }

      if (filterRank !== "ALL") {
        // Префікс-матч (case-insensitive): «GOLD» → «Gold 1/2/3».
        query = query.filter("game_profiles->valorant->>rank", "ilike", `${filterRank}%`);
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
  }, [user, isLoading, filterRegion, filterRole, filterRank, filterLangs, onlyOnline, page, pageSize]);

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))] text-slate-50">
      <main className="w-full max-w-[1600px] mx-auto p-6 md:p-10">
        <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-8 bg-gradient-to-r from-[rgb(var(--accent-color))] to-zinc-700 bg-clip-text text-transparent">
          {t("title")}
        </h2>
        <div className="flex flex-col lg:flex-row gap-8">
          <DiscoverySidebar title={t("tabs.valorant")} Icon={Filter}>
            <FilterSelect
              label={tFilters("region.label")}
              value={filterRegion}
              onChange={setFilterRegion}
              options={VALORANT_DISCOVERY_REGIONS}
            />
            <FilterSelect
              label={tFilters("role.label")}
              value={filterRole}
              onChange={setFilterRole}
              options={[
                { label: "All Roles", value: "ALL" },
                { label: "DUELIST", value: "DUELIST" },
                { label: "INITIATOR", value: "INITIATOR" },
                { label: "CONTROLLER", value: "CONTROLLER" },
                { label: "SENTINEL", value: "SENTINEL" },
              ]}
            />
            <FilterSelect
              label={tFilters("rank.label")}
              value={filterRank}
              onChange={setFilterRank}
              options={VALORANT_DISCOVERY_RANKS.map((r) => ({
                label: r === "ALL" ? tFilters("rank.value") : r.charAt(0) + r.slice(1).toLowerCase(),
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
            />
            <OnlineToggle
              onlyOnline={onlyOnline}
              onToggle={() => setOnlyOnline(!onlyOnline)}
            />
          </DiscoverySidebar>

          <div className="flex-1">
            <DiscoveryGrid isFetching={isFetching} players={players} error={fetchError} emptyMessage="No agents found in this sector">
              {players.map((player) => (
                <DiscoveryPlayerCard key={player.id} player={player} game="VALORANT" />
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
