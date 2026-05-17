'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocalStorageState } from '@/src/hooks/useLocalStorageState';

export type GameType = 'lol' | 'tft' | 'valorant' | 'cs2' | 'another' | 'none';

const GAME_TYPES: GameType[] = ['lol', 'tft', 'valorant', 'cs2', 'another', 'none'];
const isGameType = (v: unknown): v is GameType =>
  typeof v === 'string' && (GAME_TYPES as string[]).includes(v);

interface GameThemeContextType {
  activeGame: GameType;
  setActiveGame: (game: GameType) => void;
  enabledGames: string[];
  setEnabledGamesCtx: (games: string[]) => void;
}

const GameThemeContext = createContext<GameThemeContextType | undefined>(undefined);

export function GameThemeProvider({ children }: { children: React.ReactNode }) {
  const [activeGame, setActiveGame] = useLocalStorageState<GameType>(
    'site-game-theme',
    'lol',
    {
      validate: isGameType,
      serialize: (v) => v,
      deserialize: (raw) => raw as GameType,
    },
  );
  const [enabledGames, setEnabledGamesCtx] = useState<string[]>([]);

  useEffect(() => {
    if (activeGame === 'none') {
      document.documentElement.removeAttribute('data-game-theme');
    } else {
      document.documentElement.setAttribute('data-game-theme', activeGame);
    }
  }, [activeGame]);

  return (
    <GameThemeContext.Provider value={{ activeGame, setActiveGame, enabledGames, setEnabledGamesCtx }}>
      {children}
    </GameThemeContext.Provider>
  );
}

export function useGameTheme() {
  const context = useContext(GameThemeContext);
  if (context === undefined) {
    throw new Error('useGameTheme must be used within a GameThemeProvider');
  }
  return context;
}
