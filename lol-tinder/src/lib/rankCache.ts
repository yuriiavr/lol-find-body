// src/lib/rankCache.ts
import {
  getRanksByPuuid,
  getRiotTFTStats,
  getTopChampions,
} from "@/src/lib/riot";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 година  (ранг)
const UNRANKED_CACHE_TTL_MS = 5 * 60 * 1000; // 5 хв — щоб не залипати в UNRANKED, поки Riot не оновився
const MASTERY_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 години (майстерність)

function isUnranked(value: unknown): boolean {
  return typeof value === "string" && value.trim().toUpperCase() === "UNRANKED";
}

export async function refreshRankIfNeeded(
  supabaseRead: any,
  userId: string,
  game: "lol" | "tft" | "valorant",
) {
  // ─── Читаємо профіль ────────────────────────────────────────────────────
  const { data: profile, error } = await supabaseRead
    .from("profiles")
    .select("game_profiles")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    console.error("[rankCache] profile not found:", error);
    return null;
  }

  const gameProfiles = profile.game_profiles || {};
  const gameProfile = gameProfiles[game] || {};
  const puuid: string | null = gameProfile.puuid ?? null;
  const region: string = gameProfile.region || "EUW";
  const lastUpdated: string | null = gameProfile.rank_updated_at ?? null;

  // ─── Майстерність: перевіряємо незалежно від кешу рангу ─────────────────
  // (навіть якщо ранг свіжий — майстерність могла ще не кешуватись)
  let masteryExtraFields: Record<string, any> = {};
  if (game === "lol" && puuid) {
    const lastMasteryUpdated: string | null =
      gameProfile.mastery_updated_at ?? null;
    const masteryExpired =
      !lastMasteryUpdated ||
      Date.now() - new Date(lastMasteryUpdated).getTime() >=
        MASTERY_CACHE_TTL_MS;

    if (masteryExpired) {
      const champions = await getTopChampions(puuid, region);
      masteryExtraFields = {
        top_champions: champions,
        mastery_updated_at: new Date().toISOString(),
      };
    }
  }

  // ─── Перевірка кешу рангу ───────────────────────────────────────────────
  // UNRANKED у БД може бути результатом тимчасової помилки Riot API або
  // застарілих кодом-багів — даємо такому значенню короткий TTL, щоб
  // користувач швидко побачив свій ранг, як тільки логіка/Riot оновляться.
  const cachedRankValue =
    game === "lol"
      ? gameProfile.rank ?? gameProfile.flex_rank
      : gameProfile.rank;
  const effectiveTtl = isUnranked(cachedRankValue)
    ? UNRANKED_CACHE_TTL_MS
    : CACHE_TTL_MS;
  const rankFresh =
    lastUpdated && Date.now() - new Date(lastUpdated).getTime() < effectiveTtl;

  if (rankFresh) {
    // Ранг свіжий — але якщо майстерність оновилась, зберігаємо тільки її
    if (Object.keys(masteryExtraFields).length > 0) {
      await patchGameProfile(
        userId,
        game,
        gameProfiles,
        gameProfile,
        masteryExtraFields,
      );
    }
    return {
      cached: true,
      data: extractCachedRank({ ...gameProfile, ...masteryExtraFields }, game),
    };
  }

  // ─── Немає puuid або valorant → повертаємо з БД ──────────────────────────
  if (!puuid || game === "valorant") {
    return { cached: true, data: extractCachedRank(gameProfile, game) };
  }

  // ─── Запит до Riot API (ранг) ────────────────────────────────────────────
  let updatedFields: Record<string, any> = { ...masteryExtraFields };

  if (game === "lol") {
    const stats = await getRanksByPuuid(puuid, region);
    updatedFields = {
      ...updatedFields,
      rank: stats.solo,
      flex_rank: stats.flex,
      solo_wins: stats.solo_wins,
      solo_losses: stats.solo_losses,
      flex_wins: stats.flex_wins,
      flex_losses: stats.flex_losses,
      rank_updated_at: new Date().toISOString(),
    };
  } else if (game === "tft") {
    const stats = await getRiotTFTStats(puuid, region);
    updatedFields = {
      ...updatedFields,
      rank: stats.rank,
      wins: stats.wins,
      losses: stats.losses,
      rank_updated_at: new Date().toISOString(),
    };
  }

  // ─── Зберігаємо через Supabase REST API з service role ───────────────────
  const writeOk = await patchGameProfile(
    userId,
    game,
    gameProfiles,
    gameProfile,
    updatedFields,
  );
  if (!writeOk) {
    return { cached: true, data: extractCachedRank(gameProfile, game) };
  }

  return { cached: false, data: updatedFields };
}

// ─── Хелпер: зберігає поля в game_profiles[game] ────────────────────────────
async function patchGameProfile(
  userId: string,
  game: string,
  gameProfiles: Record<string, any>,
  gameProfile: Record<string, any>,
  fields: Record<string, any>,
): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const updatedGameProfiles = {
    ...gameProfiles,
    [game]: { ...gameProfile, ...fields },
  };

  const res = await fetch(`${url}/rest/v1/profiles?id=eq.${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ game_profiles: updatedGameProfiles }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[rankCache] write failed:", res.status, text);
    return false;
  }
  return true;
}

function extractCachedRank(gameProfile: Record<string, any>, game: string) {
  if (game === "lol") {
    return {
      solo: gameProfile.rank,
      flex: gameProfile.flex_rank,
      solo_wins: gameProfile.solo_wins ?? 0,
      solo_losses: gameProfile.solo_losses ?? 0,
      flex_wins: gameProfile.flex_wins ?? 0,
      flex_losses: gameProfile.flex_losses ?? 0,
      top_champions: gameProfile.top_champions ?? [],
    };
  }
  if (game === "tft") {
    return {
      rank: gameProfile.rank,
      wins: gameProfile.wins ?? 0,
      losses: gameProfile.losses ?? 0,
    };
  }
  if (game === "valorant") {
    return {
      rank: gameProfile.rank,
      wins: gameProfile.wins ?? 0,
      losses: gameProfile.losses ?? 0,
    };
  }
  return {};
}
