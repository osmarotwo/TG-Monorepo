'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { useAuth } from '@/contexts/AuthContext'
import LanguageSelector from '@/components/LanguageSelector'

export default function Navigation() {
  const pathname = usePathname()
  const { user } = useAuth()

  const navItems = [
    { label: 'Home', href: '/dashboard', icon: '🏠' },
    { label: 'Services', href: '/services', icon: '✨' },
    { label: 'Appointments', href: '/appointments', icon: '📅' },
    { label: 'Locations', href: '/locations', icon: '📍' },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo size="md" />
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'border-[#13a4ec] text-[#13a4ec]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
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
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center px-3 py-2 text-xs font-medium rounded-lg ${
                  isActive(item.href)
                    ? 'text-[#13a4ec] bg-blue-50'
                    : 'text-gray-500'
                }`}
              >
                <span className="text-lg mb-1">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  )
}
