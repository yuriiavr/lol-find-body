// Profile/discovery — display values stored verbatim in profile.game_profiles.<game>.queues.
export const LOL_QUEUES = [
  "Solo/Duo", "Flex", "Draft", "ARAM", "Arena", "Quick Play", "Clash",
];

export const TFT_QUEUES = [
  "Ranked", "Normal", "Hyper Roll", "Double Up",
];

export const VALORANT_QUEUES = [
  "Competitive", "Unrated", "Swiftplay", "Spike Rush", "Deathmatch", "Premier",
];

export const CS2_QUEUES = [
  "Competitive", "Premier", "Wingman", "Casual", "Deathmatch", "Workshop",
];

// Rooms — UPPERCASE modes with leading "ALL" sentinel.
// LoL room modes intentionally diverge from LOL_QUEUES (rooms target a different
// set of game modes — no Solo/Duo, has CUSTOM).
export const LOL_ROOM_MODES = [
  "ALL", "FLEX", "NORMAL", "ARAM", "ARENA", "QUICK PLAY", "CUSTOM",
];

export const TFT_ROOM_MODES = [
  "ALL", "RANKED", "NORMAL", "HYPER ROLL", "DOUBLE UP",
];

export const VALORANT_ROOM_MODES = [
  "ALL", "COMPETITIVE", "UNRATED", "SWIFTPLAY", "SPIKE RUSH", "DEATHMATCH", "PREMIER",
];

export const CS2_ROOM_MODES = [
  "ALL", "COMPETITIVE", "PREMIER", "WINGMAN", "CASUAL", "DEATHMATCH", "WORKSHOP",
];
