'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { BrowserType, Theme } from '@/types';

// Browser Settings Interface
interface BrowserSettings {
  defaultBrowser: BrowserType;
  defaultHeadless: boolean;
  defaultRecording: boolean;
  defaultScreenshots: boolean;
}

// App Context Interface
interface AppContextType {
  // Browser Settings
  browserSettings: BrowserSettings;
  setDefaultBrowser: (browser: BrowserType) => void;
  setDefaultHeadless: (headless: boolean) => void;
  setDefaultRecording: (recording: boolean) => void;
  setDefaultScreenshots: (screenshots: boolean) => void;
  getBrowserSettings: () => BrowserSettings;

  // Theme Settings
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;

  // I18n Settings
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Default Settings
const DEFAULT_BROWSER_SETTINGS: BrowserSettings = {
  defaultBrowser: 'chromium',
  defaultHeadless: false,
  defaultRecording: false,
  defaultScreenshots: false
};

export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  
  // Browser State
  const [browserSettings, setBrowserSettings] = useState<BrowserSettings>(DEFAULT_BROWSER_SETTINGS);
  
  // Theme State
  const [theme, setThemeState] = useState<Theme>('system');
  
  // I18n State
  const [locale, setLocaleState] = useState('tr');
  const [translations, setTranslations] = useState<Record<string, any>>({});
  
  // Mount State
  const [mounted, setMounted] = useState(false);

  // Browser Functions
  const setDefaultBrowser = (browser: BrowserType) => {
    const newSettings = { ...browserSettings, defaultBrowser: browser };
    setBrowserSettings(newSettings);
    
    if (mounted) {
      localStorage.setItem('browserSettings', JSON.stringify(newSettings));
    }
  };

  const setDefaultHeadless = (headless: boolean) => {
    setBrowserSettings(prev => ({ ...prev, defaultHeadless: headless }));
  };

  const setDefaultRecording = (recording: boolean) => {
    setBrowserSettings(prev => ({ ...prev, defaultRecording: recording }));
  };

  const setDefaultScreenshots = (screenshots: boolean) => {
    setBrowserSettings(prev => ({ ...prev, defaultScreenshots: screenshots }));
  };

  const getBrowserSettings = () => browserSettings;

  // Theme Functions
  const getActualTheme = (theme: Theme): 'light' | 'dark' => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  };

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

  // I18n Functions
  const loadTranslations = async (newLocale: string) => {
    try {
      const response = await fetch(`/locales/${newLocale}/common.json`);
      const data = await response.json();
      setTranslations(data);
    } catch (error) {
      console.error('Çeviri dosyası yüklenemedi:', error);
    }
  };

  const setLocale = (newLocale: string) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
    router.refresh();
  };

  const t = (key: string, params?: Record<string, any>): string => {
    const keys = key.split('.');
    let value: any = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }
    
    if (typeof value !== 'string') {
      return key;
    }
    
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match: string, paramKey: string) => {
        return params[paramKey] !== undefined ? String(params[paramKey]) : match;
      });
    }
    
    return value;
  };

  // Initialize
  useEffect(() => {
    // Load browser settings
    try {
      const savedBrowserSettings = localStorage.getItem('browserSettings');
      if (savedBrowserSettings) {
        const parsed = JSON.parse(savedBrowserSettings);
        const newSettings = { ...DEFAULT_BROWSER_SETTINGS, ...parsed };
        setBrowserSettings(newSettings);
      }
    } catch (error) {
      console.error('Error loading browser settings:', error);
    }

    // Load theme
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setThemeState(savedTheme);
    }

    // Load locale
    const savedLocale = localStorage.getItem('locale');
    if (savedLocale) {
      setLocaleState(savedLocale);
    }

    setMounted(true);
  }, []);

  // Load translations when locale changes
  useEffect(() => {
    if (mounted) {
      loadTranslations(locale);
    }
  }, [locale, mounted]);

  // Save browser settings
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('browserSettings', JSON.stringify(browserSettings));
    }
  }, [browserSettings, mounted]);

  // Apply theme
  useEffect(() => {
    if (mounted) {
      const actualTheme = getActualTheme(theme);
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(actualTheme);
      localStorage.setItem('theme', theme);
    }
  }, [theme, mounted]);

  // Listen to system theme changes
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

  // Listen to storage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'browserSettings' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          const newSettings = { ...DEFAULT_BROWSER_SETTINGS, ...parsed };
          setBrowserSettings(newSettings);
        } catch (error) {
          console.error('Error loading browser settings from storage:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <AppContext.Provider value={{
      // Browser
      browserSettings,
      setDefaultBrowser,
      setDefaultHeadless,
      setDefaultRecording,
      setDefaultScreenshots,
      getBrowserSettings,
      
      // Theme
      theme,
      toggleTheme,
      setTheme,
      
      // I18n
      locale,
      setLocale,
      t
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Individual hooks for backward compatibility
export function useBrowserSettings() {
  const { browserSettings, setDefaultBrowser, setDefaultHeadless, setDefaultRecording, setDefaultScreenshots, getBrowserSettings } = useApp();
  return {
    ...browserSettings,
    setDefaultBrowser,
    setDefaultHeadless,
    setDefaultRecording,
    setDefaultScreenshots,
    getBrowserSettings
  };
}

export function useTheme() {
  const { theme, toggleTheme, setTheme } = useApp();
  return { theme, toggleTheme, setTheme };
}

export function useI18n() {
  const { locale, setLocale, t } = useApp();
  return { locale, setLocale, t };
}
