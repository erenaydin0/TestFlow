'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getItem, setItem } from '@/utils/storage';

const STORAGE_KEY = 'locale';
const DEFAULT_LOCALE = 'tr';

// Global state (module-level) - tüm hook instance'ları aynı state'i paylaşır
let globalI18nState = {
  locale: DEFAULT_LOCALE,
  translations: {} as Record<string, any>,
  isInitialized: false
};

const listeners = new Set<(state: { locale: string; translations: Record<string, any> }) => void>();

// State değişikliklerini tüm listener'lara bildir
const notifyListeners = (state: { locale: string; translations: Record<string, any> }) => {
  globalI18nState = { ...state, isInitialized: globalI18nState.isInitialized };
  listeners.forEach(listener => listener({ locale: globalI18nState.locale, translations: globalI18nState.translations }));
};

// Load translations from JSON file
const loadTranslations = async (newLocale: string): Promise<Record<string, any>> => {
  try {
    const response = await fetch(`/locales/${newLocale}/common.json`);
    if (response.ok) {
      const text = await response.text();
      if (!text || text.trim() === '') {
        console.error(`Çeviri dosyası boş: /locales/${newLocale}/common.json`);
        return {};
      }
      try {
        const data = JSON.parse(text);
        return data;
      } catch (parseError) {
        console.error(`Çeviri dosyası parse edilemedi: /locales/${newLocale}/common.json`, parseError);
        return {};
      }
    } else {
      console.error(`Çeviri dosyası bulunamadı: /locales/${newLocale}/common.json`);
      return {};
    }
  } catch (error) {
    console.error('Çeviri dosyası yüklenemedi:', error);
    return {};
  }
};

/**
 * I18n hook
 * Çoklu dil desteği sağlar ve çevirileri yönetir
 * Global state kullanarak tüm component'ler arasında senkronize çalışır
 */
export function useI18n() {
  const router = useRouter();
  const [locale, setLocaleState] = useState(globalI18nState.locale);
  const [translations, setTranslations] = useState(globalI18nState.translations);
  const [mounted, setMounted] = useState(globalI18nState.isInitialized);

  // Global state değişikliklerini dinle
  useEffect(() => {
    const listener = (state: { locale: string; translations: Record<string, any> }) => {
      setLocaleState(state.locale);
      setTranslations(state.translations);
    };

    listeners.add(listener);

    // İlk değerleri set et
    setLocaleState(globalI18nState.locale);
    setTranslations(globalI18nState.translations);

    return () => {
      listeners.delete(listener);
    };
  }, []);

  // Initialize from localStorage (sadece ilk mount'ta)
  useEffect(() => {
    if (globalI18nState.isInitialized) {
      setMounted(true);
      return;
    }

    const savedLocale = getItem<string>(STORAGE_KEY, DEFAULT_LOCALE);
    globalI18nState.locale = savedLocale;
    globalI18nState.isInitialized = true;

    // İlk çevirileri yükle
    loadTranslations(savedLocale).then(loadedTranslations => {
      globalI18nState.translations = loadedTranslations;
      notifyListeners(globalI18nState);
      setMounted(true);
    });
  }, []);

  // Translation function
  const t = useCallback((key: string, params?: Record<string, any>): string => {
    // Hydration mismatch fix: Always return key during server-side rendering and initial client render
    // unless we are already initialized (client-side navigation)
    if (!mounted) {
      return key;
    }

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
  }, [translations, mounted]);

  // Set locale function
  const setLocale = useCallback(async (newLocale: string) => {
    setItem(STORAGE_KEY, newLocale);

    // Çevirileri yükle
    const loadedTranslations = await loadTranslations(newLocale);

    // Global state'i güncelle ve tüm listener'ları bilgilendir
    globalI18nState.locale = newLocale;
    globalI18nState.translations = loadedTranslations;
    notifyListeners(globalI18nState);

    // Router'ı refresh et (Next.js için)
    router.refresh();
  }, [router]);

  return {
    locale,
    setLocale,
    t
  };
}

