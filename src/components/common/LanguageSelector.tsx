'use client'

import React from 'react'
import { useI18n } from '@/contexts'
import { CustomSelect } from './CustomSelect'

const languages = [
  { value: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { value: 'en', label: 'English', flag: '🇺🇸' }
]

export function LanguageSelector() {
  const { locale, setLocale } = useI18n()

  const handleLanguageChange = (value: string) => {
    setLocale(value)
  }

  return (
    <div className="flex items-center space-x-2">
      <CustomSelect
        value={locale}
        onChange={handleLanguageChange}
        options={languages.map(lang => ({
          value: lang.value,
          label: `${lang.flag} ${lang.label}`
        }))}
        className="min-w-[140px]"
      />
    </div>
  )
}
