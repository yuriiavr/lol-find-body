'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type GameType = 'lol' | 'tft' | 'valorant' | 'none';

interface GameThemeContextType {
  activeGame: GameType;
  setActiveGame: (game: GameType) => void;
  /** Live list of games the user has enabled — synced from the profile editor */
  enabledGames: string[];
  setEnabledGamesCtx: (games: string[]) => void;
}

const GameThemeContext = createContext<GameThemeContextType | undefined>(undefined);

export function GameThemeProvider({ children }: { children: React.ReactNode }) {
  const [activeGame, setActiveGameState] = useState<GameType>('lol');
  const [isInitialized, setIsInitialized] = useState(false);
  const [enabledGames, setEnabledGamesCtx] = useState<string[]>([]);

  // Load initial theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('site-game-theme') as GameType;
    if (saved && ['lol', 'tft', 'valorant', 'none'].includes(saved)) {
      setActiveGameState(saved);
    }
    setIsInitialized(true);
  }, []);

  // Sync with DOM and localStorage
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('site-game-theme', activeGame);
    // 'none' → прибираємо атрибут щоб застосувались нейтральні CSS змінні
    if (activeGame === 'none') {
      document.documentElement.removeAttribute('data-game-theme');
    } else {
      document.documentElement.setAttribute('data-game-theme', activeGame);
    }
  }, [activeGame, isInitialized]);

  const setActiveGame = (game: GameType) => {
    setActiveGameState(game);
  };

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