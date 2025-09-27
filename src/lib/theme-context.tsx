'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  // Gerçek tema değerini hesapla (sistem teması için)
  const getActualTheme = (theme: Theme): 'light' | 'dark' => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  };

  useEffect(() => {
    // localStorage'dan tema tercihini al
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setThemeState(savedTheme);
    } else {
      setThemeState('system');
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const actualTheme = getActualTheme(theme);
      
      // HTML elementine class ekle
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(actualTheme);
      
      // localStorage'a kaydet
      localStorage.setItem('theme', theme);
    }
  }, [theme, mounted]);

  // Sistem teması değişikliklerini dinle
  useEffect(() => {
    if (mounted && theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = () => {
        const actualTheme = getActualTheme('system');
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(actualTheme);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [mounted, theme]);

  const toggleTheme = () => {
    setThemeState(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  // Hydration mismatch'i önlemek için
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 