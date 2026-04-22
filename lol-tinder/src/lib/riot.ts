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
  id: string; // encryptedSummonerId
  puuid: string;
  summonerLevel: number;
}

// Мапінг регіонів для Riot API
const REGION_MAP: Record<string, { platform: string; regional: string }> = {
  EUNE: { platform: "eun1", regional: "europe" },
  EUW: { platform: "euw1", regional: "europe" },
  NA: { platform: "na1", regional: "americas" },
  KR: { platform: "kr", regional: "asia" },
};

/**
 * Отримує PUUID за допомогою Riot ID (напр. Name#UA1)
 */
export async function getAccountByRiotId(gameName: string, tagLine: string, regionKey: string): Promise<RiotAccount | null> {
  const route = REGION_MAP[regionKey]?.regional || "europe";
  console.log(`[Riot API] Debug: raw gameName="${gameName}"`); // Перевірка вхідного значення
  const encodedGameName = encodeURIComponent(gameName);
  const encodedTagLine = encodeURIComponent(tagLine);
  const url = `https://${route}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodedGameName}/${encodedTagLine}?api_key=${RIOT_API_KEY}`;
  
  console.log(`[Riot API] Requesting Account: ${url}`); // Логуємо URL запиту
  
  const res = await fetch(url, { next: { revalidate: 86400 } }); // Кешуємо на 24 години
  if (!res.ok) {
    console.error(`[Riot API] Account lookup failed for ${gameName}#${tagLine} (${regionKey}): ${res.status} ${res.statusText}`);
    const errorBody = await res.text();
    console.error(`[Riot API] Error Body: ${errorBody}`);
    return null;
  }
  const data = await res.json();
  console.log(`[Riot API] Account data received: ${JSON.stringify(data)}`);
  return data;
}

/**
 * Отримує дані сумонера (включаючи summonerId) за PUUID
 */
export async function getSummonerByPuuid(puuid: string, regionKey: string): Promise<SummonerDTO | null> {
  const platform = REGION_MAP[regionKey]?.platform || "eun1";
  const url = `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}?api_key=${RIOT_API_KEY}`;
  
  console.log(`[Riot API] Requesting Summoner by PUUID: ${url}`); // Логуємо URL запиту

  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) {
    console.error(`[Riot API] Summoner lookup failed for PUUID ${puuid} on platform ${platform}: ${res.status} ${res.statusText}`);
    const errorBody = await res.text();
    console.error(`[Riot API] Error Body: ${errorBody}`);
    return null;
  }
  const data = await res.json();
  console.log(`[Riot API] Summoner data received: ${JSON.stringify(data)}`);
  return data;
}

/**
 * Отримує ранг гравця прямо за PUUID (League V4)
 */
export async function getRanksByPuuid(puuid: string, regionKey: string) {
  const platform = REGION_MAP[regionKey]?.platform || "eun1";
  const url = `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}?api_key=${RIOT_API_KEY}`;

  console.log(`[Riot API] Requesting Rank by PUUID: ${url}`);

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) {
      console.error(`[Riot API] League entries failed for PUUID ${puuid}: ${res.status}`);
      return { solo: 'UNRANKED', flex: 'UNRANKED' };
    }

    const data: LeagueEntry[] = await res.json();
    console.log(`[Riot API] Rank data received: ${JSON.stringify(data)}`);

    const findRank = (qType: string) => {
      const entry = data.find((e) => e.queueType === qType);
      if (!entry) return 'UNRANKED';
      
      // Високі ранги не мають дивізіонів (I, II, III...)
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
    console.error(`[Riot API] Error fetching ranks:`, error);
    return { solo: 'UNRANKED', flex: 'UNRANKED' };
  }
}

/**
 * Отримує ранг гравця за його summonerId
 */
export async function getSummonerRank(summonerId: string, regionKey: string) {
  if (!RIOT_API_KEY) {
    console.error("Missing RIOT_API_KEY in environment variables");
    return null;
  }

  const platform = REGION_MAP[regionKey]?.platform || "eun1";
  const response = await fetch(
    `https://${platform}.api.riotgames.com/lol/league/v1/entries/by-summoner/${summonerId}?api_key=${RIOT_API_KEY}`,
    { next: { revalidate: 3600 } } // Кешуємо ранг на 1 годину
  );
  
  if (!response.ok) {
    console.error(`[Riot API] Rank lookup failed for Summoner ID ${summonerId} (${regionKey}): ${response.status} ${response.statusText}`);
    const errorBody = await response.text();
    console.error(`[Riot API] Error Body: ${errorBody}`);
    return null;
  }

  const data: LeagueEntry[] = await response.json();
  console.log(`[Riot API] Rank data received: ${JSON.stringify(data)}`);
  return data.find((entry) => entry.queueType === 'RANKED_SOLO_5x5') || null;
}

/**
 * Головна функція для повного отримання профілю за одну операцію
 */
export async function getFullLeagueProfile(gameName: string, tagLine: string, regionKey: string) {
  const account = await getAccountByRiotId(gameName, tagLine, regionKey);
  if (!account) return null;

  const summoner = await getSummonerByPuuid(account.puuid, regionKey);
  if (!summoner) return null;

  const rank = await getSummonerRank(summoner.id, regionKey);
  return { account, summoner, rank };
}
