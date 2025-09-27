'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type BrowserType = 'chromium' | 'firefox' | 'webkit' | 'msedge';

interface BrowserSettings {
  defaultBrowser: BrowserType;
  defaultHeadless: boolean;
  defaultRecording: boolean;
  defaultScreenshots: boolean;
}

interface BrowserContextType extends BrowserSettings {
  setDefaultBrowser: (browser: BrowserType) => void;
  setDefaultHeadless: (headless: boolean) => void;
  setDefaultRecording: (recording: boolean) => void;
  setDefaultScreenshots: (screenshots: boolean) => void;
  getBrowserSettings: () => BrowserSettings;
}

const BrowserContext = createContext<BrowserContextType | undefined>(undefined);

const DEFAULT_SETTINGS: BrowserSettings = {
  defaultBrowser: 'chromium',
  defaultHeadless: false,
  defaultRecording: false,
  defaultScreenshots: false
};

export function BrowserProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<BrowserSettings>(DEFAULT_SETTINGS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // localStorage'dan ayarları yükle
    try {
      const savedSettings = localStorage.getItem('browserSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error('Error loading browser settings:', error);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // localStorage'a kaydet
      localStorage.setItem('browserSettings', JSON.stringify(settings));
    }
  }, [settings, mounted]);

  const setDefaultBrowser = (browser: BrowserType) => {
    setSettings(prev => ({ ...prev, defaultBrowser: browser }));
  };

  const setDefaultHeadless = (headless: boolean) => {
    setSettings(prev => ({ ...prev, defaultHeadless: headless }));
  };

  const setDefaultRecording = (recording: boolean) => {
    setSettings(prev => ({ ...prev, defaultRecording: recording }));
  };

  const setDefaultScreenshots = (screenshots: boolean) => {
    setSettings(prev => ({ ...prev, defaultScreenshots: screenshots }));
  };

  const getBrowserSettings = () => settings;

  // Hydration mismatch'i önlemek için
  if (!mounted) {
    return null;
  }

  return (
    <BrowserContext.Provider value={{
      ...settings,
      setDefaultBrowser,
      setDefaultHeadless,
      setDefaultRecording,
      setDefaultScreenshots,
      getBrowserSettings
    }}>
      {children}
    </BrowserContext.Provider>
  );
}

export function useBrowserSettings() {
  const context = useContext(BrowserContext);
  if (context === undefined) {
    throw new Error('useBrowserSettings must be used within a BrowserProvider');
  }
  return context;
}
