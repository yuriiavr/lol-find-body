export type RegionOption = { value: string; label: string };

// ─── LOL / TFT ──────────────────────────────────────────────────────────────
// Discovery exposes only the four supported Riot-API regions. Rooms goes wider
// because user-created lobbies can target any Riot region label.
export const LOL_DISCOVERY_REGIONS: RegionOption[] = [
  { value: "EUW",  label: "Europe West" },
  { value: "EUNE", label: "Europe Nordic & East" },
  { value: "NA",   label: "North America" },
  { value: "KR",   label: "Korea" },
];

export const ROOM_LOL_REGIONS = [
  "ANY", "EUW", "EUNE", "NA", "KR", "BR", "LAN", "LAS", "OCE", "RU", "TR",
];

// ─── VALORANT ───────────────────────────────────────────────────────────────
// Має збігатися з варіантами у ValorantForm (EUW/EUNE/NA/KR), інакше частина
// гравців стає недосяжною в пошуку, а зайві фільтри — завжди порожні.
export const VALORANT_REGIONS: RegionOption[] = [
  { value: "EUW",  label: "Europe West" },
  { value: "EUNE", label: "Europe NE" },
  { value: "NA",   label: "North America" },
  { value: "KR",   label: "Korea" },
];

export const VALORANT_DISCOVERY_REGIONS: RegionOption[] = VALORANT_REGIONS;

// ─── CS2 ────────────────────────────────────────────────────────────────────
export const CS2_REGIONS: RegionOption[] = [
  { value: "EU",   label: "Europe" },
  { value: "NA",   label: "North America" },
  { value: "SA",   label: "South America" },
  { value: "CIS",  label: "CIS" },
  { value: "ASIA", label: "Asia" },
  { value: "OCE",  label: "Oceania" },
  { value: "ME",   label: "Middle East" },
];

export const CS2_REGION_VALUES = CS2_REGIONS.map((r) => r.value);
export const ROOM_CS2_REGIONS = ["ANY", ...CS2_REGION_VALUES];
