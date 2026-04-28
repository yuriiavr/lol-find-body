"use client";

import React, { useState, useEffect } from "react";
import { Gamepad } from "lucide-react"
import { createClient } from "@/src/utils/supabase/client";
import { DiscoverySidebar } from "../components/DiscoverySidebar";
import { FilterSelect, LanguageFilter, OnlineToggle } from "../components/DiscoveryFilters";
import { DiscoveryPlayerCard } from "../components/DiscoveryPlayerCard";
import { DiscoveryGrid } from "../components/DiscoveryGrid";

const AVAILABLE_QUEUES = [
  "Ranked", "Normal", "Hyper Roll", "Double Up"
];

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
        .from('profiles')
        .select('id, display_name, riot_game_name, riot_tag_line, avatar_url, tft_rank, tft_preferred_queue, tft_bio, riot_region, enabled_games, last_seen')
        .eq('is_paused', false)
        .eq('riot_region', filterRegion)
        .ilike('enabled_games', '%TFT%');

      if (user) {
        const { data: existingMatches } = await supabase
          .from('matches')
          .select('user_id, target_id')
          .or(`user_id.eq.${user.id},target_id.eq.${user.id}`);

        const excludedIds = [user.id];
        if (existingMatches) {
          existingMatches.forEach(m => {
            excludedIds.push(m.user_id === user.id ? m.target_id : m.user_id);
          });
        }
        query = query.not('id', 'in', `(${excludedIds.join(',')})`);
      }

      if (filterRank !== "ALL") {
        query = query.ilike('tft_rank', `%${filterRank}%`);
      }

      if (filterQueue !== "ALL") {
        query = query.ilike('tft_preferred_queue', `%${filterQueue}%`);
      }

      if (filterLangs.length > 0) {
        const orConditions = filterLangs.map(lang => `language.ilike.%${lang}%`).join(',');
        query = query.or(orConditions);
      }

      if (onlyOnline) {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        query = query.gt('last_seen', tenMinutesAgo);
      }

      const { data, error } = await query.limit(20);
      if (!error && data) {
        setPlayers(data);
      }
      setIsFetching(false);
    };

    fetchPlayers();
  }, [user, isLoading, filterRegion, filterRank, filterLangs, onlyOnline]);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <DiscoverySidebar title="TFT Strategists" Icon={Gamepad} accentColor="blue">
        <FilterSelect 
          label="Region" value={filterRegion} onChange={setFilterRegion} accentColor="blue"
          options={[{label: 'Europe West', value: 'EUW'}, {label: 'Europe Nordic & East', value: 'EUNE'}, {label: 'North America', value: 'NA'}]} 
        />
        <FilterSelect 
          label="Rank" value={filterRank} onChange={setFilterRank} accentColor="blue"
          options={[{label: 'All Ranks', value: 'ALL'}, {label: 'Diamond', value: 'DIAMOND'}, {label: 'Master+', value: 'MASTER'}, {label: 'Platinum', value: 'PLATINUM'}, {label: 'Gold', value: 'GOLD'}]} 
        />
        <FilterSelect 
          label="Queue Type" value={filterQueue} onChange={setFilterQueue} accentColor="blue"
          options={[{label: 'All Queues', value: 'ALL'}, ...AVAILABLE_QUEUES.map(q => ({label: q.toUpperCase(), value: q}))]} 
        />
        <LanguageFilter 
          selectedLangs={filterLangs} 
          onToggle={(lang: string) => setFilterLangs(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang])} 
          accentColor="blue" 
        />
        <OnlineToggle 
          onlyOnline={onlyOnline} 
          onToggle={() => setOnlyOnline(!onlyOnline)} 
          accentColor="blue" 
          label="Online Now" 
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
  );
}