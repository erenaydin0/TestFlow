'use client';

import { useState, useEffect, useCallback } from 'react';
import { Theme } from '@/types';
import { getItem, setItem } from '@/utils/storage';

const STORAGE_KEY = 'theme';
const DEFAULT_THEME: Theme = 'system';

/**
 * Theme hook
 * Tema yönetimini yapar ve LocalStorage'a kaydeder
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  // Get actual theme (resolves 'system' to 'light' or 'dark')
  const getActualTheme = useCallback((currentTheme: Theme): 'light' | 'dark' => {
    if (typeof window === 'undefined') {
      return 'light';
    }

    if (currentTheme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return currentTheme;
  }, []);

  // Initialize from localStorage
  useEffect(() => {
    const savedTheme = getItem<Theme>(STORAGE_KEY, DEFAULT_THEME);
    if (['light', 'dark', 'system'].includes(savedTheme)) {
      setThemeState(savedTheme);
    }
    setMounted(true);
  }, []);

  // Apply theme to DOM
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    const actualTheme = getActualTheme(theme);
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(actualTheme);
    setItem(STORAGE_KEY, theme);
  }, [theme, mounted, getActualTheme]);

  // Listen to system theme changes when theme is 'system'
  useEffect(() => {
    if (!mounted || typeof window === 'undefined' || theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      const actualTheme = getActualTheme('system');
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(actualTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mounted, theme, getActualTheme]);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  return {
    theme,
    toggleTheme,
    setTheme
  };
}

