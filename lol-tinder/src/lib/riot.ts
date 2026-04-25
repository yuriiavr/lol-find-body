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

const REGION_MAP: Record<string, { platform: string; regional: string }> = {
  EUNE: { platform: "eun1", regional: "europe" },
  EUW: { platform: "euw1", regional: "europe" },
  NA: { platform: "na1", regional: "americas" },
  KR: { platform: "kr", regional: "asia" },
};


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
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) {
      return { solo: 'UNRANKED', flex: 'UNRANKED' };
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
      flex: findRank('RANKED_FLEX_SR')
    };
  } catch (error) {
    return { solo: 'UNRANKED', flex: 'UNRANKED' };
  }
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
