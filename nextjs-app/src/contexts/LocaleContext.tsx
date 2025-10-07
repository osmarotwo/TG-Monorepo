'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

// Import translations
import enMessages from '../../messages/en.json'
import esMessages from '../../messages/es.json'

export type Locale = 'en' | 'es'

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, section?: string) => string
  messages: Record<string, Record<string, unknown>>
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

const messages = {
  en: enMessages,
  es: esMessages
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('es') // Default to Spanish

  // Load locale from localStorage on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'es')) {
      setLocaleState(savedLocale)
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)
  }

  // Translation function
  const t = (key: string, section = 'common'): string => {
    const keys = key.includes('.') ? key.split('.') : [section, key]
    let value: unknown = messages[locale]
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k]
      } else {
        return key
      }
    }
    
    return typeof value === 'string' ? value : key
  }

  return (
    <LocaleContext.Provider value={{ 
      locale, 
      setLocale, 
      t, 
      messages: messages[locale] 
    }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return context
}