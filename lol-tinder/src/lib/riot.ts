const RIOT_API_KEY = process.env.RIOT_API_KEY;

interface LeagueEntry {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
}

interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

interface SummonerDTO {
  id: string;
  puuid: string;
  summonerLevel: number;
}

const REGION_MAP: Record<string, { platform: string; regional: string; shard: string }> = {
  EUNE: { platform: "eun1", regional: "europe", shard: "eu" },
  EUW: { platform: "euw1", regional: "europe", shard: "eu" },
  NA: { platform: "na1", regional: "americas", shard: "na" },
  KR: { platform: "kr", regional: "asia", shard: "kr" },
};

const VALORANT_RANKS = [
  "Unranked",
  "Iron 1", "Iron 2", "Iron 3",
  "Bronze 1", "Bronze 2", "Bronze 3",
  "Silver 1", "Silver 2", "Silver 3",
  "Gold 1", "Gold 2", "Gold 3",
  "Platinum 1", "Platinum 2", "Platinum 3",
  "Diamond 1", "Diamond 2", "Diamond 3",
  "Ascendant 1", "Ascendant 2", "Ascendant 3",
  "Immortal 1", "Immortal 2", "Immortal 3",
  "Radiant"
];


export async function getAccountByRiotId(gameName: string, tagLine: string, regionKey: string): Promise<RiotAccount | null> {
  const route = REGION_MAP[regionKey]?.regional || "europe";
  const encodedGameName = encodeURIComponent(gameName);
  const encodedTagLine = encodeURIComponent(tagLine);
  const url = `https://${route}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodedGameName}/${encodedTagLine}?api_key=${RIOT_API_KEY}`;
  
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) {
    const errorBody = await res.text();
    return null;
  }
  const data = await res.json();
  return data;
}

export async function getSummonerByPuuid(puuid: string, regionKey: string): Promise<SummonerDTO | null> {
  const platform = REGION_MAP[regionKey]?.platform || "eun1";
  const url = `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}?api_key=${RIOT_API_KEY}`;

  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) {
    const errorBody = await res.text();
    return null;
  }
  const data = await res.json();
  return data;
}

export async function getRanksByPuuid(puuid: string, regionKey: string) {
  const platform = REGION_MAP[regionKey]?.platform || "eun1";
  const url = `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}?api_key=${RIOT_API_KEY}`;

  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) {
      return { solo: 'UNRANKED', solo_wins: 0, solo_losses: 0, flex: 'UNRANKED', flex_wins: 0, flex_losses: 0 };
    }

    const data: LeagueEntry[] = await res.json();

    const findRank = (qType: string) => {
      const entry = data.find((e) => e.queueType === qType);
      if (!entry) return 'UNRANKED';
      
      const apexTiers = ['MASTER', 'GRANDMASTER', 'CHALLENGER'];
      if (apexTiers.includes(entry.tier.toUpperCase())) {
        return entry.tier;
      }
      
      return `${entry.tier} ${entry.rank}`;
    };

    return {
      solo: findRank('RANKED_SOLO_5x5'),
      solo_wins: data.find(e => e.queueType === 'RANKED_SOLO_5x5')?.wins || 0,
      solo_losses: data.find(e => e.queueType === 'RANKED_SOLO_5x5')?.losses || 0,
      flex: findRank('RANKED_FLEX_SR'),
      flex_wins: data.find(e => e.queueType === 'RANKED_FLEX_SR')?.wins || 0,
      flex_losses: data.find(e => e.queueType === 'RANKED_FLEX_SR')?.losses || 0,
    };
  } catch (error) {
    return { solo: 'UNRANKED', solo_wins: 0, solo_losses: 0, flex: 'UNRANKED', flex_wins: 0, flex_losses: 0 };
  }
}

export async function getRiotTFTStats(puuid: string, regionKey: string) {
  const platform = REGION_MAP[regionKey]?.platform || "eun1";
  const url = `https://${platform}.api.riotgames.com/tft/league/v1/by-puuid/${encodeURIComponent(puuid)}?api_key=${RIOT_API_KEY}`;

  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return { rank: 'UNRANKED', wins: 0, losses: 0 };
    
    const data = await res.json();
    const entry = data.find((e: any) => e.queueType === 'RANKED_TFT');
    if (!entry) return { rank: 'UNRANKED', wins: 0, losses: 0 };

    return {
      rank: `${entry.tier} ${entry.rank}`,
      wins: entry.wins,
      losses: entry.losses
    };
  } catch (e) {
    return { rank: 'UNRANKED', wins: 0, losses: 0 };
  }
}

export async function getRiotValorantStats(puuid: string, regionKey: string) {
  const regionGroup = REGION_MAP[regionKey]?.regional || "europe";
  const shard = REGION_MAP[regionKey]?.shard || "eu";

  try {
    const accountUrl = `https://${regionGroup}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}?api_key=${RIOT_API_KEY}`;
    const accountRes = await fetch(accountUrl, { next: { revalidate: 3600 } });
    if (!accountRes.ok) return null;
    const accountData = await accountRes.json();
    
    const matchlistUrl = `https://${shard}.api.riotgames.com/val/match/v1/matchlists/by-puuid/${puuid}?api_key=${RIOT_API_KEY}`;
    const listRes = await fetch(matchlistUrl, { next: { revalidate: 600 } });
    
    if (!listRes.ok) return { ...accountData, rankName: 'Unranked', wins: 0, losses: 0 };
    
    const history = await listRes.json();
    const lastMatchId = history.history?.[0]?.matchId;
    if (!lastMatchId) return { ...accountData, rankName: 'Unranked', wins: 0, losses: 0 };

    const matchUrl = `https://${shard}.api.riotgames.com/val/match/v1/matches/${lastMatchId}?api_key=${RIOT_API_KEY}`;
    const matchRes = await fetch(matchUrl, { next: { revalidate: 900 } });
    const matchData = await matchRes.json();
    const player = matchData.players?.find((p: any) => p.puuid === puuid);
    const tier = player?.competitiveTier || 0;
    
    return {
      ...accountData,
      rankName: VALORANT_RANKS[tier] || 'Unranked',
      wins: 0, // Valorant API не віддає агреговану статистику без Match History
      losses: 0
    };
  } catch (err) {
    return null;
  }
}

export async function getTopChampions(puuid: string, regionKey: string) {
  const platform = REGION_MAP[regionKey]?.platform || "eun1";
  const masteryRes = await fetch(
    `https://${platform}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=10&api_key=${RIOT_API_KEY}`,
    { next: { revalidate: 300 } }
  );
  if (!masteryRes.ok) return [];
  const masteries = await masteryRes.json();

  const versionRes = await fetch('https://ddragon.leagueoflegends.com/api/versions.json', { next: { revalidate: 86400 } });
  const versions = await versionRes.json();
  const latest = versions[0];
  const champDataRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latest}/data/en_US/champion.json`, { next: { revalidate: 86400 } });
  const { data: champs } = await champDataRes.json();

  return masteries.map((m: any) => {
    const champ = Object.values(champs).find((c: any) => parseInt((c as any).key) === m.championId) as any;
    return {
      name: champ?.name || 'Unknown',
      id: m.championId,
      icon: `https://ddragon.leagueoflegends.com/cdn/${latest}/img/champion/${champ?.image?.full}`,
      points: m.championPoints,
      lastPlayed: m.lastPlayTime
    };
  });
}

export async function getSummonerRank(summonerId: string, regionKey: string) {
  if (!RIOT_API_KEY) {
    return null;
  }

  const platform = REGION_MAP[regionKey]?.platform || "eun1";
  const response = await fetch(
    `https://${platform}.api.riotgames.com/lol/league/v1/entries/by-summoner/${summonerId}?api_key=${RIOT_API_KEY}`,
    { next: { revalidate: 3600 } }
  );
  
  if (!response.ok) {
    return null;
  }

  const data: LeagueEntry[] = await response.json();
  return data.find((entry) => entry.queueType === 'RANKED_SOLO_5x5') || null;
}

export async function getFullLeagueProfile(gameName: string, tagLine: string, regionKey: string) {
  const account = await getAccountByRiotId(gameName, tagLine, regionKey);
  if (!account) return null;

  const summoner = await getSummonerByPuuid(account.puuid, regionKey);
  if (!summoner) return null;

  const rank = await getSummonerRank(summoner.id, regionKey);
  return { account, summoner, rank };
}
