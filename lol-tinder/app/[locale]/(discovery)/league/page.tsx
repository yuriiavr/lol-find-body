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
import { LOL_QUEUES as AVAILABLE_QUEUES } from "@/src/constants/queues";
import { LOL_DISCOVERY_RANKS } from "@/src/constants/ranks";
import { LOL_DISCOVERY_REGIONS } from "@/src/constants/regions";
import { useTranslations } from "next-intl";

const supabase = createClient();

export default function LeagueDiscoveryPage() {
  const { user, isLoading } = useSupabaseAuth();
  const [players, setPlayers] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [filterRegion, setFilterRegion] = useState<string>("EUW");
  const [filterRole, setFilterRole] = useState<string>("ALL");
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
    const saved = localStorage.getItem("lol-match-filters");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.region) setFilterRegion(parsed.region);
        if (parsed.role) setFilterRole(parsed.role);
        if (parsed.rank) setFilterRank(parsed.rank);
        if (parsed.langs) setFilterLangs(parsed.langs);
        if (parsed.queue) setFilterQueue(parsed.queue);
        if (parsed.online !== undefined) setOnlyOnline(parsed.online);
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "lol-match-filters",
      JSON.stringify({ region: filterRegion, role: filterRole, rank: filterRank, langs: filterLangs, queue: filterQueue, online: onlyOnline })
    );
  }, [filterRegion, filterRole, filterRank, filterLangs, filterQueue, onlyOnline]);

  useEffect(() => {
    setPage(1);
  }, [filterRegion, filterRole, filterRank, filterLangs, filterQueue, onlyOnline]);

  useEffect(() => {
    const fetchPlayers = async () => {
      if (isLoading) return;
      setIsFetching(true);

      let query = supabase
        .from("profiles")
        .select("id, display_name, avatar_url, language, last_seen, has_mic, enabled_games, game_profiles", { count: "exact" })
        .eq("is_paused", false)
        .ilike("enabled_games", "%LOL%")
        .filter("game_profiles->lol->>region", "eq", filterRegion);

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

      if (filterRole !== "ALL") query = query.filter("game_profiles->lol->>role", "eq", filterRole);
      if (filterRank !== "ALL") query = query.filter("game_profiles->lol->>rank", "ilike", `%${filterRank}%`);
      if (filterLangs.length > 0) {
        const orConditions = filterLangs.map((lang) => `language.ilike.%${lang}%`).join(",");
        query = query.or(orConditions);
      }
      if (filterQueue !== "ALL") query = query.filter("game_profiles->lol->>queues", "ilike", `%${filterQueue}%`);
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

    if (user) {
      supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", user.id).then();
    }
  }, [user, isLoading, filterRegion, filterRole, filterRank, filterLangs, filterQueue, onlyOnline, page, pageSize]);

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))] text-slate-50">
      <main className="w-full max-w-[1600px] mx-auto p-6 md:p-10">
        <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-8 bg-gradient-to-r from-[rgb(var(--accent-color))] to-zinc-700 bg-clip-text text-transparent">
          {t("title")}
        </h2>
        <div className="flex flex-col lg:flex-row gap-8">
          <DiscoverySidebar title={tFilters("title")} Icon={Filter}>
            <FilterSelect
              label={tFilters("region.label")}
              value={filterRegion}
              onChange={setFilterRegion}
              options={LOL_DISCOVERY_REGIONS}
            />
            <FilterSelect
              label={tFilters("role.label")}
              value={filterRole}
              onChange={setFilterRole}
              options={[
                { label: "All Positions", value: "ALL" },
                { label: "TOP LANE", value: "TOP" },
                { label: "JUNGLE", value: "JUNGLE" },
                { label: "MID LANE", value: "MID" },
                { label: "ADC / BOTTOM", value: "ADC" },
                { label: "SUPPORT", value: "SUPPORT" },
              ]}
            />
            <FilterSelect
              label={tFilters("rank.label")}
              value={filterRank}
              onChange={setFilterRank}
              options={LOL_DISCOVERY_RANKS.map(
                (r) => ({ label: r === "ALL" ? tFilters("rank.value") : r.charAt(0) + r.slice(1).toLowerCase(), value: r })
              )}
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
            <DiscoveryGrid isFetching={isFetching} players={players} emptyMessage="No players found with current filters">
              {players.map((player) => (
                <DiscoveryPlayerCard key={player.id} player={player} game="LOL" filterQueue={filterQueue} />
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