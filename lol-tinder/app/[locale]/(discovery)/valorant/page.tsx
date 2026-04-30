"use client";

import React, { useState, useEffect } from "react";
import { Filter } from "lucide-react";
import { createClient } from "@/src/utils/supabase/client";
import { DiscoverySidebar } from "../components/DiscoverySidebar";
import { FilterSelect, LanguageFilter, OnlineToggle } from "../components/DiscoveryFilters";
import { DiscoveryPlayerCard } from "../components/DiscoveryPlayerCard";
import { DiscoveryGrid } from "../components/DiscoveryGrid";
import { useTranslations } from "next-intl";

const supabase = createClient();

export default function ValorantDiscoveryPage() {
  const [user, setUser] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [filterRegion, setFilterRegion] = useState<string>("EUW");
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [filterRank, setFilterRank] = useState<string>("ALL");
  const [filterLangs, setFilterLangs] = useState<string[]>([]);
  const [onlyOnline, setOnlyOnline] = useState<boolean>(false);
  const t = useTranslations("Discovery");
  const tFilters = useTranslations("LandingPage.discovery.filters");

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setIsLoading(false);
    };
    getUser();
  }, []);

  useEffect(() => {
    const fetchPlayers = async () => {
      if (isLoading) return;
      setIsFetching(true);

      let query = supabase
        .from("profiles")
        .select("id, display_name, avatar_url, language, last_seen, enabled_games, game_profiles")
        .eq("is_paused", false)
        .ilike("enabled_games", "%VALORANT%")
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
        query = query.filter("game_profiles->valorant->>rank", "ilike", `%${filterRank}%`);
      }

      if (filterLangs.length > 0) {
        const orConditions = filterLangs.map((lang) => `language.ilike.%${lang}%`).join(",");
        query = query.or(orConditions);
      }

      if (onlyOnline) {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        query = query.gt("last_seen", tenMinutesAgo);
      }

      const { data, error } = await query.limit(20);
      if (!error && data) setPlayers(data);
      setIsFetching(false);
    };

    fetchPlayers();
  }, [user, isLoading, filterRegion, filterRole, filterRank, filterLangs, onlyOnline]);

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))] text-slate-50">
      <main className="w-full max-w-[1600px] mx-auto p-6 md:p-10">
        <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-8 bg-gradient-to-r from-[rgb(var(--accent-color))] to-zinc-700 bg-clip-text text-transparent">
          {t("title")}
        </h2>
        <div className="flex flex-col lg:flex-row gap-8">
          <DiscoverySidebar title="Valorant Filters" Icon={Filter} accentColor="red">
            <FilterSelect
              label={tFilters("region.label")}
              value={filterRegion}
              onChange={setFilterRegion}
              accentColor="red"
              options={[
                { label: "Europe", value: "EUW" },
                { label: "North America", value: "NA" },
                { label: "Korea", value: "KR" },
                { label: "LATAM", value: "LATAM" },
              ]}
            />
            <FilterSelect
              label="Agent Role"
              value={filterRole}
              onChange={setFilterRole}
              accentColor="red"
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
              accentColor="red"
              options={[
                "ALL", "IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM",
                "DIAMOND", "ASCENDANT", "IMMORTAL", "RADIANT",
              ].map((r) => ({
                label: r === "ALL" ? "All Ranks" : r.charAt(0) + r.slice(1).toLowerCase(),
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
              accentColor="red"
            />
            <OnlineToggle
              onlyOnline={onlyOnline}
              onToggle={() => setOnlyOnline(!onlyOnline)}
              accentColor="red"
            />
          </DiscoverySidebar>

          <div className="flex-1">
            <DiscoveryGrid isFetching={isFetching} players={players} accentColor="red" emptyMessage="No agents found in this sector">
              {players.map((player) => (
                <DiscoveryPlayerCard key={player.id} player={player} game="VALORANT" accentColor="red" />
              ))}
            </DiscoveryGrid>
          </div>
        </div>
      </main>
    </div>
  );
}