'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface I18nContextType {
  locale: string
  setLocale: (locale: string) => void
  t: (key: string, params?: Record<string, any>) => string
  translations: Record<string, any>
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

interface I18nProviderProps {
  children: React.ReactNode
  initialLocale?: string
}

export function I18nProvider({ children, initialLocale = 'tr' }: I18nProviderProps) {
  const [locale, setLocaleState] = useState(initialLocale)
  const [translations, setTranslations] = useState<Record<string, any>>({})
  const router = useRouter()

  useEffect(() => {
    loadTranslations(locale)
  }, [locale])

  const loadTranslations = async (newLocale: string) => {
    try {
      const response = await fetch(`/locales/${newLocale}/common.json`)
      const data = await response.json()
      setTranslations(data)
    } catch (error) {
      console.error('Çeviri dosyası yüklenemedi:', error)
    }
  }

  const setLocale = (newLocale: string) => {
    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)
    router.refresh()
  }

  const t = (key: string, params?: Record<string, any>): string => {
    const keys = key.split('.')
    let value: any = translations
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return key // Fallback to key if translation not found
      }
    }
    
    if (typeof value !== 'string') {
      return key
    }
    
    // Parametreli çeviri desteği
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match: string, paramKey: string) => {
        return params[paramKey] !== undefined ? String(params[paramKey]) : match
      })
    }
    
    return value
  }

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale')
    if (savedLocale && savedLocale !== locale) {
      setLocaleState(savedLocale)
    }
  }, [])

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, translations }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}
