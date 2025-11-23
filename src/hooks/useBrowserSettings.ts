'use client';

import { useState, useEffect, useCallback } from 'react';
import { BrowserType } from '@/types';
import { getItem, setItem, onStorageChange } from '@/utils/storage';

// Browser Settings Interface
export interface BrowserSettings {
  defaultBrowser: BrowserType;
  defaultHeadless: boolean;
  defaultRecording: boolean;
  defaultScreenshots: boolean;
}

// Default Settings
const DEFAULT_BROWSER_SETTINGS: BrowserSettings = {
  defaultBrowser: 'chromium',
  defaultHeadless: false,
  defaultRecording: false,
  defaultScreenshots: false
};

const STORAGE_KEY = 'browserSettings';

/**
 * Browser settings hook
 * Tarayıcı ayarlarını yönetir ve LocalStorage'a kaydeder
 */
export function useBrowserSettings() {
  const [browserSettings, setBrowserSettings] = useState<BrowserSettings>(DEFAULT_BROWSER_SETTINGS);
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    const savedSettings = getItem<BrowserSettings>(STORAGE_KEY, DEFAULT_BROWSER_SETTINGS);
    setBrowserSettings(savedSettings);
    setMounted(true);
  }, []);

  // Save to localStorage when settings change
  useEffect(() => {
    if (mounted) {
      setItem(STORAGE_KEY, browserSettings);
    }
  }, [browserSettings, mounted]);

  // Listen to storage changes (for multi-tab sync)
  useEffect(() => {
    if (!mounted) return;

    const cleanup = onStorageChange<BrowserSettings>(STORAGE_KEY, (newValue) => {
      if (newValue) {
        setBrowserSettings({ ...DEFAULT_BROWSER_SETTINGS, ...newValue });
      }
    });

    return cleanup;
  }, [mounted]);

  const setDefaultBrowser = useCallback((browser: BrowserType) => {
    setBrowserSettings(prev => ({ ...prev, defaultBrowser: browser }));
  }, []);

  const setDefaultHeadless = useCallback((headless: boolean) => {
    setBrowserSettings(prev => ({ ...prev, defaultHeadless: headless }));
  }, []);

  const setDefaultRecording = useCallback((recording: boolean) => {
    setBrowserSettings(prev => ({ ...prev, defaultRecording: recording }));
  }, []);

  const setDefaultScreenshots = useCallback((screenshots: boolean) => {
    setBrowserSettings(prev => ({ ...prev, defaultScreenshots: screenshots }));
  }, []);

  const getBrowserSettings = useCallback(() => browserSettings, [browserSettings]);

  return {
    ...browserSettings,
    setDefaultBrowser,
    setDefaultHeadless,
    setDefaultRecording,
    setDefaultScreenshots,
    getBrowserSettings
  };
}

