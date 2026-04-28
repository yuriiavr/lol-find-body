'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type GameType = 'lol' | 'tft' | 'valorant';

interface GameThemeContextType {
  activeGame: GameType;
  setActiveGame: (game: GameType) => void;
}

const GameThemeContext = createContext<GameThemeContextType | undefined>(undefined);

export function GameThemeProvider({ children }: { children: React.ReactNode }) {
  const [activeGame, setActiveGameState] = useState<GameType>('lol');
  const [isInitialized, setIsInitialized] = useState(false);

  // Load initial theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('site-game-theme') as GameType;
    if (saved && ['lol', 'tft', 'valorant'].includes(saved)) {
      setActiveGameState(saved);
    }
    setIsInitialized(true);
  }, []);

  // Sync with DOM and localStorage
  useEffect(() => {
    if (!isInitialized) return;
    
    localStorage.setItem('site-game-theme', activeGame);
    document.documentElement.setAttribute('data-game-theme', activeGame);
  }, [activeGame, isInitialized]);

  const setActiveGame = (game: GameType) => {
    setActiveGameState(game);
  };

  return (
    <GameThemeContext.Provider value={{ activeGame, setActiveGame }}>
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
