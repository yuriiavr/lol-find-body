// ─── LOL ────────────────────────────────────────────────────────────────────
// Discovery filter — first item is the "ALL" sentinel; only tiers up to MASTER
// are exposed to keep the dropdown short.
export const LOL_DISCOVERY_RANKS = [
  "ALL", "IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "EMERALD", "DIAMOND", "MASTER",
];

// Rooms rank order — full ladder (UPPERCASE) with UNRANKED at the bottom.
export const LOL_ROOM_RANK_ORDER = [
  "UNRANKED", "IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM",
  "EMERALD", "DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER",
];

// Rooms create-modal — collapses MASTER/GRANDMASTER/CHALLENGER into "MASTER+".
export const LOL_ROOM_MODAL_RANKS = [
  "ALL", "IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "EMERALD", "DIAMOND", "MASTER+",
];

// ─── TFT ────────────────────────────────────────────────────────────────────
// TFT discovery currently shows only top tiers (intentional — most players
// browse for diamond+).
export const TFT_DISCOVERY_RANKS = [
  "ALL", "MASTER", "DIAMOND", "PLATINUM", "GOLD",
];

// TFT rooms reuse the LoL ladder.
export const TFT_ROOM_RANK_ORDER = LOL_ROOM_RANK_ORDER;
export const TFT_ROOM_MODAL_RANKS = LOL_ROOM_MODAL_RANKS;

// TFT profile rank selector — Title Case (matches the value persisted in
// profile.game_profiles.tft.rank). Note: no "Emerald" tier in TFT.
export const TFT_PROFILE_RANKS: string[] = [
  "Unranked", "Iron", "Bronze", "Silver", "Gold",
  "Platinum", "Diamond", "Master", "Grandmaster", "Challenger",
];

// ─── VALORANT ───────────────────────────────────────────────────────────────
// Canonical Riot-API form (used by riot.ts to render exact tier+division).
export const VALORANT_RANKS_FULL = [
  "Unranked",
  "Iron 1", "Iron 2", "Iron 3",
  "Bronze 1", "Bronze 2", "Bronze 3",
  "Silver 1", "Silver 2", "Silver 3",
  "Gold 1", "Gold 2", "Gold 3",
  "Platinum 1", "Platinum 2", "Platinum 3",
  "Diamond 1", "Diamond 2", "Diamond 3",
  "Ascendant 1", "Ascendant 2", "Ascendant 3",
  "Immortal 1", "Immortal 2", "Immortal 3",
  "Radiant",
];

export const VALORANT_DISCOVERY_RANKS = [
  "ALL", "IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM",
  "DIAMOND", "ASCENDANT", "IMMORTAL", "RADIANT",
];

export const VALORANT_ROOM_RANK_ORDER = [
  "UNRANKED", "IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM",
  "DIAMOND", "ASCENDANT", "IMMORTAL", "RADIANT",
];

export const VALORANT_ROOM_MODAL_RANKS = [
  "ALL", "IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM",
  "DIAMOND", "ASCENDANT", "IMMORTAL", "RADIANT",
];

// ─── CS2 ────────────────────────────────────────────────────────────────────
// Title-case canonical (used in profile form + discovery filters; matches the
// shape persisted in `profiles.game_profiles.cs2.rank`).
export const CS2_RANKS = [
  "Unranked",
  "Silver I", "Silver II", "Silver III", "Silver IV", "Silver Elite", "Silver Elite Master",
  "Gold Nova I", "Gold Nova II", "Gold Nova III", "Gold Nova Master",
  "Master Guardian I", "Master Guardian II", "Master Guardian Elite", "Distinguished Master Guardian",
  "Legendary Eagle", "Legendary Eagle Master", "Supreme Master First Class", "Global Elite",
];

// Discovery filter prepends ALL.
export const CS2_DISCOVERY_RANKS = ["ALL", ...CS2_RANKS];

// Rooms uses an UPPERCASE variant of the same ladder.
export const CS2_ROOM_RANK_ORDER = CS2_RANKS.map((r) => r.toUpperCase());

// Modal collapses sub-tiers ("Silver I/II/III..." → "SILVER").
export const CS2_ROOM_MODAL_RANKS = [
  "ALL", "SILVER", "GOLD NOVA", "MASTER GUARDIAN",
  "LEGENDARY EAGLE", "SUPREME MASTER FIRST CLASS", "GLOBAL ELITE",
];
