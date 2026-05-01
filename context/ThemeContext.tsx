import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem('hackbook_theme') as Theme) || 'dark';
    } catch {
      return 'dark';
    }
  });

  const applyTheme = (nextTheme: Theme) => {
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('hackbook_theme', nextTheme);
    setTheme(nextTheme);
  };

  useEffect(() => {
    applyTheme(theme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    const root = document.documentElement;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const viewTransition = (document as Document & {
      startViewTransition?: (callback: () => void) => { finished: Promise<unknown> };
    }).startViewTransition;

    if (viewTransition && !prefersReducedMotion) {
      root.classList.add('theme-transitioning');
      viewTransition.call(document, () => applyTheme(nextTheme)).finished.finally(() => {
        root.classList.remove('theme-transitioning');
      });
      return;
    }

    root.classList.add('theme-transitioning');
    window.requestAnimationFrame(() => {
      applyTheme(nextTheme);
      window.setTimeout(() => root.classList.remove('theme-transitioning'), 320);
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
