'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function ThemeInitializer() {
  const pathname = usePathname();

  useEffect(() => {
    const savedTheme = localStorage.getItem('site-game-theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-game-theme', savedTheme.toLowerCase());
    } else {
      document.documentElement.setAttribute('data-game-theme', 'lol');
      localStorage.setItem('site-game-theme', 'lol');
    }
  }, [pathname]);

  return null;
}