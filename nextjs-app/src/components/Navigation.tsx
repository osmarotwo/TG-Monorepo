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
    { label: t('navigation.services', 'navigation'), href: '/services', icon: '✨' },
    { label: t('navigation.appointments', 'navigation'), href: '/appointments', icon: '📅' },
    { label: t('navigation.locations', 'navigation'), href: '/locations', icon: '📍' },
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
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo size="md" />
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex space-x-2">
            {navItems.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-[#13a4ec] text-white shadow-md'
                      : 'text-gray-600 hover:text-[#13a4ec] hover:bg-[#f6f7f8]'
                  }`}
                  style={active ? { backgroundColor: '#13a4ec', color: 'white' } : {}}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <LanguageSelector />
            
            {/* Notifications */}
            <button className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            {/* User Avatar */}
            <div className="relative">
              <button className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-[#13a4ec] flex items-center justify-center text-white font-semibold text-sm">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden border-t border-gray-200">
          <div className="flex justify-around py-2">
            {navItems.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
                    active
                      ? 'text-[#13a4ec] bg-[#13a4ec]/10 scale-105'
                      : 'text-gray-500 hover:text-[#13a4ec]'
                  }`}
                  style={active ? { color: '#13a4ec', backgroundColor: 'rgba(19, 164, 236, 0.1)' } : {}}
                >
                  <span className={`text-lg mb-1 transition-transform ${active ? 'scale-110' : ''}`}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </header>
  )
}
