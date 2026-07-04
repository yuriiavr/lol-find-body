'use client';

import { useRef } from 'react';
import { useServerInsertedHTML } from 'next/navigation';

// Виставляє data-game-theme ще ДО першого малювання, щоб не було спалаху теми.
// GameThemeProvider далі тримає атрибут синхронним зі станом.
// Вставляємо скрипт у <head> через useServerInsertedHTML, а не як JSX <script>:
// скрипт потрапляє лише в серверний HTML і ніколи не рендериться React-ом на
// клієнті (клієнтський рендер <script> не виконується і сипле попередження
// "Encountered a script tag while rendering React component").
const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem('site-game-theme')||'lol';if(t&&t!=='none'){document.documentElement.setAttribute('data-game-theme',t);}}catch(e){}`;

export function ThemeInitScript() {
  const inserted = useRef(false);
  useServerInsertedHTML(() => {
    if (inserted.current) return null;
    inserted.current = true;
    return <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />;
  });
  return null;
}
