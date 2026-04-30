export type GameKey = 'lol' | 'tft' | 'valorant' | 'cs2'

export function getGameProfile(profile: any, game: GameKey) {
  return profile?.game_profiles?.[game] ?? {}
}

export function getRank(profile: any, game: GameKey): string {
  return getGameProfile(profile, game)?.rank ?? 'Unranked'
}

export function getBio(profile: any, game: GameKey): string {
  return getGameProfile(profile, game)?.bio ?? ''
}

export function getGameName(profile: any, game: GameKey): string {
  return getGameProfile(profile, game)?.game_name ?? ''
}

export function getTagLine(profile: any, game: GameKey): string {
  return getGameProfile(profile, game)?.tag_line ?? ''
}

export function getRegion(profile: any, game: GameKey): string {
  return getGameProfile(profile, game)?.region ?? 'EUW'
}

export function getRole(profile: any, game: GameKey): string {
  return getGameProfile(profile, game)?.role ?? 'FILL'
}

export function getQueues(profile: any, game: GameKey): string[] {
  const q = getGameProfile(profile, game)?.queues
  if (!q) return []
  return Array.isArray(q) ? q : q.split(',').filter(Boolean)
}

export function getExtra(profile: any, game: GameKey, key: string) {
  return getGameProfile(profile, game)?.[key]
}

export function buildGameUpdate(
  currentProfile: any,
  game: GameKey,
  data: Record<string, any>
) {
  return {
    ...currentProfile,
    game_profiles: {
      ...currentProfile?.game_profiles,
      [game]: {
        ...currentProfile?.game_profiles?.[game],
        ...data
      }
    }
  }
}