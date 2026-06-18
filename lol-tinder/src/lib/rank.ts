// Чисті хелпери для рангів — винесені сюди, щоб їх можна було протестувати
// й не дублювати між компонентами.

// Від кращого до гіршого; апекс-тіри (CHALLENGER/GRANDMASTER/MASTER) зверху.
export const RANK_PRIORITY = [
  "CHALLENGER",
  "GRANDMASTER",
  "MASTER",
  "DIAMOND",
  "EMERALD",
  "PLATINUM",
  "GOLD",
  "SILVER",
  "BRONZE",
  "IRON",
  "UNRANKED",
];

/** Менша вага = кращий ранг. Невідоме/порожнє → 100 (найгірше). */
export function getRankWeight(r: string | null | undefined): number {
  if (!r) return 100;
  const tier = r.split(" ")[0].toUpperCase();
  const idx = RANK_PRIORITY.indexOf(tier);
  return idx === -1 ? 100 : idx;
}

/** Відсоток перемог із кількості перемог/поразок. 0, якщо ігор немає. */
export function computeWinrate(wins: unknown, losses: unknown): number {
  const w = Number(wins) || 0;
  const l = Number(losses) || 0;
  return w + l > 0 ? (w / (w + l)) * 100 : 0;
}
