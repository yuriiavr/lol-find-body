"use client";

import React, { useState, useEffect } from "react";
import { Gamepad } from "lucide-react";
import { createClient } from "@/src/utils/supabase/client";
import { DiscoverySidebar } from "../components/DiscoverySidebar";
import { FilterSelect, LanguageFilter, OnlineToggle } from "../components/DiscoveryFilters";
import { DiscoveryPlayerCard } from "../components/DiscoveryPlayerCard";
import { DiscoveryGrid } from "../components/DiscoveryGrid";
import { useTranslations } from "next-intl";

const AVAILABLE_QUEUES = ["Ranked", "Normal", "Hyper Roll", "Double Up"];

const supabase = createClient();

export default function TFTDiscoveryPage() {
  const [user, setUser] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [filterRegion, setFilterRegion] = useState<string>("EUW");
  const [filterRank, setFilterRank] = useState<string>("ALL");
  const [filterLangs, setFilterLangs] = useState<string[]>([]);
  const [filterQueue, setFilterQueue] = useState<string>("ALL");
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
        .ilike("enabled_games", "%TFT%")
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
        query = query.filter("game_profiles->tft->>rank", "ilike", `%${filterRank}%`);
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

      const { data, error } = await query.limit(20);
      if (!error && data) setPlayers(data);
      setIsFetching(false);
    };

    fetchPlayers();
  }, [user, isLoading, filterRegion, filterRank, filterLangs, filterQueue, onlyOnline]);

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))] text-slate-50">
      <main className="w-full max-w-[1600px] mx-auto p-6 md:p-10">
        <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-8 bg-gradient-to-r from-[rgb(var(--accent-color))] to-zinc-700 bg-clip-text text-transparent">
          {t("title")}
        </h2>
        <div className="flex flex-col lg:flex-row gap-8">
          <DiscoverySidebar title={t("tabs.tft")} Icon={Gamepad} accentColor="blue">
            <FilterSelect
              label={tFilters("region.label")}
              value={filterRegion}
              onChange={setFilterRegion}
              accentColor="blue"
              options={[
                { label: "Europe West", value: "EUW" },
                { label: "Europe Nordic & East", value: "EUNE" },
                { label: "North America", value: "NA" },
                { label: "Korea", value: "KR" },
              ]}
            />
            <FilterSelect
              label={tFilters("rank.label")}
              value={filterRank}
              onChange={setFilterRank}
              accentColor="blue"
              options={[
                { label: tFilters("rank.value"), value: "ALL" },
                { label: "Diamond", value: "DIAMOND" },
                { label: "Master+", value: "MASTER" },
                { label: "Platinum", value: "PLATINUM" },
                { label: "Gold", value: "GOLD" },
              ]}
            />
            <FilterSelect
              label={tFilters("queue.label")}
              value={filterQueue}
              onChange={setFilterQueue}
              accentColor="blue"
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
              accentColor="blue"
            />
            <OnlineToggle
              onlyOnline={onlyOnline}
              onToggle={() => setOnlyOnline(!onlyOnline)}
              accentColor="blue"
            />
          </DiscoverySidebar>

          <div className="flex-1">
            <DiscoveryGrid isFetching={isFetching} players={players} accentColor="blue" emptyMessage="No tacticians found">
              {players.map((player) => (
                <DiscoveryPlayerCard key={player.id} player={player} game="TFT" accentColor="blue" />
              ))}
            </DiscoveryGrid>
          </div>
        </div>
      </main>
    </div>
  );
}