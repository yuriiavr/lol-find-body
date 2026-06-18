import { unstable_cache } from 'next/cache';

// Riot шифрує PUUIDs per-key, тому LoL і TFT API ключі повертають різні
// PUUIDs для одного й того ж акаунту і одним ключем не можна викликати
// ендпоінти іншої гри. Тримаємо ключі окремо.
const RIOT_API_KEY = process.env.RIOT_API_KEY;
const TFT_API_KEY = process.env.TFT_API_KEY || RIOT_API_KEY;

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
  EUW:  { platform: "euw1", regional: "europe", shard: "eu" },
  NA:   { platform: "na1",  regional: "americas", shard: "na" },
  KR:   { platform: "kr",   regional: "asia",     shard: "kr" },
};

export async function getAccountByRiotId(
  gameName: string,
  tagLine: string,
  regionKey: string,
  game: "lol" | "tft" = "lol",
): Promise<RiotAccount | null> {
  const route = REGION_MAP[regionKey]?.regional || "europe";
  const key = game === "tft" ? TFT_API_KEY : RIOT_API_KEY;
  const url = `https://${route}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}?api_key=${key}`;

  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) { console.error(`[Riot API] Account not found (game=${game}): ${res.status}`); return null; }
  return res.json();
}

export async function getSummonerByPuuid(
  puuid: string,
  regionKey: string,
): Promise<SummonerDTO | null> {
  const platform = REGION_MAP[regionKey]?.platform || "eun1";
  const url = `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}?api_key=${RIOT_API_KEY}`;

  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) { console.error(`[Riot API] Summoner not found: ${res.status}`); return null; }
  return res.json();
}

export const getRanksByPuuid = unstable_cache(
  async (puuid: string, regionKey: string) => {
    const platform = REGION_MAP[regionKey]?.platform || "eun1";
    const url = `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}?api_key=${RIOT_API_KEY}`;

    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        console.error(`[Riot API] Ranks error: ${res.status}`);
        return { solo: 'UNRANKED', solo_wins: 0, solo_losses: 0, flex: 'UNRANKED', flex_wins: 0, flex_losses: 0 };
      }

      const data: LeagueEntry[] = await res.json();

      const findRank = (qType: string) => {
        const entry = data.find((e) => e.queueType === qType);
        if (!entry) return 'UNRANKED';
        const apexTiers = ['MASTER', 'GRANDMASTER', 'CHALLENGER'];
        return apexTiers.includes(entry.tier.toUpperCase())
          ? entry.tier
          : `${entry.tier} ${entry.rank}`;
      };

      return {
        solo:        findRank('RANKED_SOLO_5x5'),
        solo_wins:   data.find(e => e.queueType === 'RANKED_SOLO_5x5')?.wins   || 0,
        solo_losses: data.find(e => e.queueType === 'RANKED_SOLO_5x5')?.losses || 0,
        flex:        findRank('RANKED_FLEX_SR'),
        flex_wins:   data.find(e => e.queueType === 'RANKED_FLEX_SR')?.wins    || 0,
        flex_losses: data.find(e => e.queueType === 'RANKED_FLEX_SR')?.losses  || 0,
      };
    } catch (err) {
      console.error(`[Riot API] Exception in getRanksByPuuid:`, err);
      return { solo: 'UNRANKED', solo_wins: 0, solo_losses: 0, flex: 'UNRANKED', flex_wins: 0, flex_losses: 0 };
    }
  },
  ['ranks'],
  { revalidate: 300, tags: ['ranks'] },
);

export const getRiotTFTStats = unstable_cache(
  async (puuid: string, regionKey: string) => {
    const platform = REGION_MAP[regionKey]?.platform || "eun1";
    const url = `https://${platform}.api.riotgames.com/tft/league/v1/by-puuid/${encodeURIComponent(puuid)}?api_key=${TFT_API_KEY}`;

    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error(`[Riot API] TFT error ${res.status} for puuid=${puuid.slice(0, 8)}… region=${regionKey} platform=${platform}: ${body}`);
        return { rank: 'UNRANKED', wins: 0, losses: 0 };
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        console.error(`[Riot API] TFT unexpected response shape for puuid=${puuid.slice(0, 8)}…:`, data);
        return { rank: 'UNRANKED', wins: 0, losses: 0 };
      }

      // Prefer the standard ranked queue; fall back to any TFT queue the
      // player is ranked in (Double Up, Hyper Roll, etc.) so we still show
      // something useful instead of UNRANKED.
      const priority = ['RANKED_TFT', 'RANKED_TFT_DOUBLE_UP', 'RANKED_TFT_TURBO'];
      let entry = priority
        .map((q) => data.find((e: any) => e.queueType === q))
        .find(Boolean);
      if (!entry) entry = data[0];

      if (!entry) {
        console.log(`[Riot API] TFT no entries for puuid=${puuid.slice(0, 8)}… region=${regionKey}`);
        return { rank: 'UNRANKED', wins: 0, losses: 0 };
      }

      const apexTiers = ['MASTER', 'GRANDMASTER', 'CHALLENGER'];
      const rank = apexTiers.includes(String(entry.tier).toUpperCase())
        ? entry.tier
        : `${entry.tier} ${entry.rank}`;

      return {
        rank,
        wins:   entry.wins   ?? 0,
        losses: entry.losses ?? 0,
      };
    } catch (err) {
      console.error(`[Riot API] TFT exception for puuid=${puuid.slice(0, 8)}… region=${regionKey}:`, err);
      return { rank: 'UNRANKED', wins: 0, losses: 0 };
    }
  },
  ['tft-stats'],
  { revalidate: 300, tags: ['tft-stats'] },
);

// export const getRiotValorantStats = unstable_cache(
//   async (puuid: string, regionKey: string) => {
//     const regionGroup = REGION_MAP[regionKey]?.regional || "europe";

//     try {
//       const accountUrl = `https://${regionGroup}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}?api_key=${RIOT_API_KEY}`;
//       const accountRes = await fetch(accountUrl, { cache: 'no-store' });
//       if (!accountRes.ok) return null;

//       const accountData = await accountRes.json();

//       return {
//         ...accountData,
//         rankName: 'Unranked',
//         wins:     0,
//         losses:   0,
//       };
//     } catch {
//       return null;
//     }
//   },
//   ['valorant-stats'],
//   { revalidate: 3600, tags: ['valorant-stats'] },
// );

export const getTopChampions = unstable_cache(
  async (puuid: string, regionKey: string) => {
    const platform = REGION_MAP[regionKey]?.platform || "eun1";

    const masteryRes = await fetch(
      `https://${platform}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=10&api_key=${RIOT_API_KEY}`,
      { cache: 'no-store' },
    );
    if (!masteryRes.ok) return [];

    const masteries = await masteryRes.json();
    if (!Array.isArray(masteries) || masteries.length === 0) return [];

    // Data Dragon (версії + дані чемпіонів) можуть впасти/повернути не те —
    // перевіряємо .ok, інакше рендер чемпіонів зламається на undefined.
    const versionRes = await fetch(
      'https://ddragon.leagueoflegends.com/api/versions.json',
      { next: { revalidate: 86400 } },
    );
    if (!versionRes.ok) return [];
    const versions = await versionRes.json();
    const latest = Array.isArray(versions) ? versions[0] : null;
    if (!latest) return [];

    const champDataRes = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${latest}/data/en_US/champion.json`,
      { next: { revalidate: 86400 } },
    );
    if (!champDataRes.ok) return [];
    const champJson = await champDataRes.json();
    const champs = champJson?.data;
    if (!champs) return [];

    return masteries.map((m: any) => {
      const champ = Object.values(champs).find(
        (c: any) => parseInt((c as any).key) === m.championId,
      ) as any;
      return {
        name:       champ?.name || 'Unknown',
        id:         m.championId,
        icon:       champ?.image?.full
          ? `https://ddragon.leagueoflegends.com/cdn/${latest}/img/champion/${champ.image.full}`
          : null,
        points:     m.championPoints,
        lastPlayed: m.lastPlayTime,
      };
    });
  },
  ['top-champions'],
  { revalidate: 3600, tags: ['top-champions'] },
);

export async function getSummonerRank(
  summonerId: string,
  regionKey: string,
) {
  if (!RIOT_API_KEY) return null;

  const platform = REGION_MAP[regionKey]?.platform || "eun1";
  const response = await fetch(
    `https://${platform}.api.riotgames.com/lol/league/v1/entries/by-summoner/${summonerId}?api_key=${RIOT_API_KEY}`,
    { next: { revalidate: 3600 } },
  );

  if (!response.ok) return null;

  const data: LeagueEntry[] = await response.json();
  return data.find((entry) => entry.queueType === 'RANKED_SOLO_5x5') || null;
}

export async function getFullLeagueProfile(
  gameName: string,
  tagLine: string,
  regionKey: string,
) {
  const account = await getAccountByRiotId(gameName, tagLine, regionKey);
  if (!account) return null;

  const summoner = await getSummonerByPuuid(account.puuid, regionKey);
  if (!summoner) return null;

  const rank = await getSummonerRank(summoner.id, regionKey);
  return { account, summoner, rank };
}