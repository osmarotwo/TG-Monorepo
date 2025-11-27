'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { useAuth } from '@/contexts/AuthContext'
import { useLocale } from '@/contexts/LocaleContext'
import LanguageSelector from '@/components/LanguageSelector'

export default function Navigation() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { t } = useLocale()

  const navItems = [
    { label: t('navigation.home', 'navigation'), href: '/dashboard', icon: '🏠' },
    { label: t('navigation.appointments', 'navigation'), href: '/appointments', icon: '📅' },
  ]

  const isActive = (href: string) => {
    // Normalizar rutas removiendo trailing slash
    const normalizedPathname = pathname.endsWith('/') && pathname !== '/' 
      ? pathname.slice(0, -1) 
      : pathname
    const normalizedHref = href.endsWith('/') && href !== '/' 
      ? href.slice(0, -1) 
      : href
    
    return normalizedPathname === normalizedHref
  }

  return (
    <header className="sticky top-0 z-10 bg-white shadow-sm">
      {/* Top Bar: Logo | Language | Avatar */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Logo size="md" />
            </div>

            {/* Language Selector (centro en móvil, lado derecho en desktop) */}
            <div className="flex-1 flex justify-center md:justify-end items-center gap-4">
              <LanguageSelector />
              
              {/* Notifications */}
              <button className="hidden md:block p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>

              {/* User Avatar */}
              <div className="h-10 w-10 rounded-full bg-[#13a4ec] flex items-center justify-center text-white font-bold text-base shadow-sm">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Desktop (centrados) */}
      <div className="hidden md:block border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex justify-center space-x-8 py-4">
            {navItems.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center px-8 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                    active
                      ? 'bg-[#e3f5ff] text-[#13a4ec]'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-3xl mb-1">{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Navigation - Bottom Fixed */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <nav className="flex justify-around py-3">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center px-6 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
                  active
                    ? 'text-[#13a4ec] bg-[#13a4ec]/10'
                    : 'text-gray-500 hover:text-[#13a4ec]'
                }`}
              >
                <span className={`text-2xl mb-1 transition-transform ${active ? 'scale-110' : ''}`}>
                  {item.icon}
                </span>
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
