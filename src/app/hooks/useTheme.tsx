import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'system';

export function useTheme(initialTheme: Theme = 'system') {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    const applyTheme = (currentTheme: Theme) => {
      const root = document.documentElement;
      const isDark =
        currentTheme === 'dark' ||
        (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }

      const bg = isDark ? '#111113' : '#f1f1f1';
      root.style.backgroundColor = bg;
      root.style.minHeight = '100dvh';
      document.body.style.backgroundColor = bg;
      document.body.style.minHeight = '100dvh';
      const rootEl = document.getElementById('root');
      if (rootEl) {
        rootEl.style.backgroundColor = bg;
        rootEl.style.minHeight = '100dvh';
      }
    };

    applyTheme(theme);

    // Listen for system theme changes if theme is set to 'system'
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  return { theme, setTheme };
}
