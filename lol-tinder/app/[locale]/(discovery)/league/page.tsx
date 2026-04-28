"use client";

import React, { useState, useEffect } from "react";
import { Filter, Loader2 } from "lucide-react"
import { createClient } from "@/src/utils/supabase/client";
import { DiscoverySidebar } from "../components/DiscoverySidebar";
import { DiscoveryPlayerCard } from "../components/DiscoveryPlayerCard";
import { DiscoveryGrid } from "../components/DiscoveryGrid";
import { FilterSelect, LanguageFilter, OnlineToggle } from "../components/DiscoveryFilters";

const AVAILABLE_QUEUES = [
  "Solo/Duo", "Flex", "Draft", "ARAM", "Arena", "Quick Play", "Clash"
];

const supabase = createClient();

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastDirection, setLastDirection] = useState<string | null>(null);
  const [filterRegion, setFilterRegion] = useState<string>("EUW");
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [filterRank, setFilterRank] = useState<string>("ALL");
  const [filterLangs, setFilterLangs] = useState<string[]>([]);
  const [filterQueue, setFilterQueue] = useState<string>("ALL");
  const [onlyOnline, setOnlyOnline] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState(false);
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setIsLoading(false);
    };
    getUser();
  }, [supabase]);

  useEffect(() => {
    const saved = localStorage.getItem('lol-match-filters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.region) setFilterRegion(parsed.region);
        if (parsed.role) setFilterRole(parsed.role);
        if (parsed.rank) setFilterRank(parsed.rank);
        if (parsed.langs) setFilterLangs(parsed.langs);
        if (parsed.queue) setFilterQueue(parsed.queue);
        if (parsed.online !== undefined) setOnlyOnline(parsed.online);
      } catch (e) {
      }
    }
  }, []);
  useEffect(() => {
    const filters = {
      region: filterRegion,
      role: filterRole,
      rank: filterRank,
      langs: filterLangs,
      queue: filterQueue,
      online: onlyOnline
    };
    localStorage.setItem('lol-match-filters', JSON.stringify(filters));
  }, [filterRegion, filterRole, filterRank, filterLangs, filterQueue, onlyOnline]);
  useEffect(() => {
    const fetchPlayers = async () => {
      if (isLoading) return;
      setIsFetching(true);
      let query = supabase
        .from('profiles')
        .select('id, display_name, riot_game_name, riot_tag_line, avatar_url, solo_rank, flex_rank, main_role, bio, language, preferred_queue, last_seen, has_mic, riot_region, enabled_games')
        .eq('is_paused', false)
        .eq('riot_region', filterRegion)
        .ilike('enabled_games', '%LOL%');
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
      if (filterRole !== "ALL") {
        query = query.eq('main_role', filterRole);
      }
      if (filterRank !== "ALL") {
        query = query.ilike('solo_rank', `%${filterRank}%`);
      }
      if (filterLangs.length > 0) {
        const orConditions = filterLangs.map(lang => `language.ilike.%${lang}%`).join(',');
        query = query.or(orConditions);
      }
      if (filterQueue !== "ALL") {
        query = query.ilike('preferred_queue', `%${filterQueue}%`);
      }
      if (onlyOnline) {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        query = query.gt('last_seen', tenMinutesAgo);
      }
      const { data, error } = await query.limit(20);
      if (!error && data) {
        setPlayers(data);
        setCurrentIndex(0);
      }
      setIsFetching(false);
    };
    fetchPlayers();
    if (user) {
      supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', user.id).then();
    }
  }, [user, isLoading, filterRegion, filterRole, filterRank, filterLangs, filterQueue, onlyOnline, supabase]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="animate-spin text-orange-500" size={48} />
      </div>
    );
  }

  return ( 
    <div className="flex flex-col lg:flex-row gap-8">
      <DiscoverySidebar title="Filter Rift" Icon={Filter} accentColor="orange">
        <FilterSelect 
          label="Region / Server" value={filterRegion} onChange={setFilterRegion} accentColor="orange"
          options={[{label: 'Europe West', value: 'EUW'}, {label: 'Europe Nordic & East', value: 'EUNE'}, {label: 'North America', value: 'NA'}, {label: 'Korea', value: 'KR'}]} 
        />
        <FilterSelect 
          label="Main Role" value={filterRole} onChange={setFilterRole} accentColor="orange"
          options={[{label: 'All Positions', value: 'ALL'}, {label: 'TOP LANE', value: 'TOP'}, {label: 'JUNGLE', value: 'JUNGLE'}, {label: 'MID LANE', value: 'MID'}, {label: 'ADC / BOTTOM', value: 'ADC'}, {label: 'SUPPORT', value: 'SUPPORT'}]} 
        />
        <FilterSelect 
          label="Tier Rank" value={filterRank} onChange={setFilterRank} accentColor="orange"
          options={['ALL', 'IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER'].map(r => ({label: r === 'ALL' ? 'All Ranks' : r.charAt(0) + r.slice(1).toLowerCase(), value: r}))} 
        />
        <FilterSelect 
          label="Queue Type" value={filterQueue} onChange={setFilterQueue} accentColor="orange"
          options={[{label: 'All Queues', value: 'ALL'}, ...AVAILABLE_QUEUES.map(q => ({label: q.toUpperCase(), value: q}))]} 
        />
        <LanguageFilter selectedLangs={filterLangs} onToggle={(lang: string) => setFilterLangs(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang])} accentColor="orange" />
        <OnlineToggle onlyOnline={onlyOnline} onToggle={() => setOnlyOnline(!onlyOnline)} accentColor="orange" />
      </DiscoverySidebar>

      <div className="flex-1">
        <DiscoveryGrid isFetching={isFetching} players={players} accentColor="orange" emptyMessage="No players found with current filters">
          {players.map((player) => (
            <DiscoveryPlayerCard key={player.id} player={player} game="LOL" accentColor="orange" filterQueue={filterQueue} />
          ))}
        </DiscoveryGrid>
      </div>
    </div>
  );
}
